// FIFA API coordinate system (observed from 2022 WC Final Argentina vs France, matchId 400128145):
// X range: 2–18 (center at 10, total width ~20 units)
// Y range: 1–12 (GK at y=1, forwards at y=12)
// Raw coords are team-relative: both teams' GKs are at rawY=1 / rawX≈10.
// Canonical output: GK at Y=60 for both teams — TeamHalf renders the away team
// with `inverted` (flipping Y at render time) so away GK appears at pitch-bottom.
// X is pitch-absolute from home's perspective, so the provider mirrors X for the
// away team (left/right flip) — TeamHalf does not flip X.
// Normalization inset to [90, 910] so player nodes (centered on coord)
// don't extend past the pitch edges. Formula: 90 + (raw - min) / (max - min) * 820
//   X: 90 + (raw_x - 2) / 16 * 820  (range 2–18)
//   Y: 90 + (raw_y - 1) / 11 * 820  (range 1–12)
// Starters have non-null LineupX/Y; bench/subs have null (Position=4).

import type { CompetitionProvider } from '../types'
import type {
  Match,
  MatchLineups,
  TeamInMatch,
  TeamLineup,
  LineupPlayer,
  BenchPlayer,
  PlayerInfo,
  MatchEvent,
  PenaltyEvent,
} from '@/types/match'
import type { FifaMatch, FifaCalendarResponse, FifaTeam, FifaPlayer } from './types'
import { FIFA_COMPETITION_ID, FIFA_SEASON_IDS } from './seasons'
import squads2018 from './squads/2018.json'
import squads2022 from './squads/2022.json'
import clubs from './clubs.json'
import shootouts from './shootouts.json'

const PROXY = '/fifa-api'

type SquadMap = Record<string, Record<string, { clubName: string }>>
type ClubMap = Record<string, { logoUrl?: string }>

// FIFA only reports SCORED kicks in a shootout via Goals[Period=11]. Misses
// are absent from the public feed, and even the order of SCORED kicks is only
// loosely conveyed (by minute, which can tie). For accurate display we keep a
// curated per-match `kicks[]` sequence — used as the sole source of truth when
// present. See ADDING_WORLD_CUP_YEAR.md for the format.
type ShootoutKick = {
  idTeam: string
  idPlayer?: string
  playerName: string
  result: 'SCORED' | 'MISSED'
}
type ShootoutMap = Record<
  string,
  {
    description?: string
    kicks: ShootoutKick[]
  }
>

const squadsByYear: Record<number, SquadMap> = {
  2018: squads2018 as SquadMap,
  2022: squads2022 as SquadMap,
}
const clubsMap: ClubMap = clubs as ClubMap
const shootoutSequences: ShootoutMap = shootouts as ShootoutMap

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`FIFA API error: ${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

function getLocale(arr: { Locale: string; Description: string }[]): string {
  if (!arr || arr.length === 0) return ''
  const en = arr.find((d) => d.Locale.toLowerCase().startsWith('en'))
  return (en ?? arr[0]).Description
}

// Keep in sync with the scraper and the squad JSON key format.
// - NFD + strip combining marks handles most diacritics (é → e, á → a, ć → c).
// - Explicit substitutions cover chars that NFD can't decompose (æ, ð, ø, þ, ł).
// - Trailing Wikipedia disambiguation suffixes like ` (footballer, born 1992)`
//   are dropped so a key matches the plain FIFA-API name.
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/æ/g, 'ae')
    .replace(/ð/g, 'd')
    .replace(/ø/g, 'o')
    .replace(/þ/g, 'th')
    .replace(/ł/g, 'l')
    .replace(/\s*\([^)]*\)\s*$/, '')
    .trim()
}

function normalizeX(rawX: number): number {
  return Math.round(90 + ((rawX - 2) / 16) * 820)
}

function normalizeY(rawY: number): number {
  return Math.round(90 + ((rawY - 1) / 11) * 820)
}

function mapMatchStatus(status: number): 'UPCOMING' | 'LIVE' | 'FINISHED' {
  // 0 = Finished, 1 = Not Started, 3 = Live, 4 = Live
  if (status === 0) return 'FINISHED'
  if (status === 1) return 'UPCOMING'
  return 'LIVE'
}

function parseMinute(minuteStr: string): number {
  const match = minuteStr.match(/(\d+)/)
  return match ? Number(match[1]) : 0
}

// FIFA team PictureUrl is a template like
//   https://api.fifa.com/api/v3/picture/flags-{format}-{size}/QAT
// where format ∈ {'sq' (square) | 'fh' (flag horizontal) | 'hp'} and size ∈ 1-5.
function resolveFifaPictureUrl(template: string | undefined, size: number): string {
  if (!template) return ''
  return template.replace('{format}', 'sq').replace('{size}', String(size))
}

function normalizeFifaMatch(raw: FifaMatch): FifaMatch {
  // Calendar endpoint returns Home/Away; live endpoint returns HomeTeam/AwayTeam.
  // Normalize so downstream code always reads HomeTeam/AwayTeam.
  if (!raw.HomeTeam && raw.Home) {
    raw.HomeTeam = raw.Home
  }
  if (!raw.AwayTeam && raw.Away) {
    raw.AwayTeam = raw.Away
  }
  return raw
}

function mapTeamInMatch(team: FifaTeam): TeamInMatch {
  const name = getLocale(team.TeamName)
  const teamCode = team.Abbreviation ?? name.slice(0, 3).toUpperCase()
  return {
    id: team.IdTeam,
    internationalName: name,
    logoUrl: resolveFifaPictureUrl(team.PictureUrl, 3),
    mediumLogoUrl: resolveFifaPictureUrl(team.PictureUrl, 4),
    bigLogoUrl: resolveFifaPictureUrl(team.PictureUrl, 5),
    countryCode: team.IdCountry ?? teamCode,
    teamCode,
    translations: {
      displayName: { EN: name },
      displayOfficialName: { EN: name },
    },
  }
}

function mapFifaMatchToCanonical(raw: FifaMatch): Match {
  const status = mapMatchStatus(raw.MatchStatus)
  const stageNameEn = getLocale(raw.StageName)
  const groupNameEn = raw.GroupName ? getLocale(raw.GroupName) : ''
  const matchDay = Number(raw.MatchDay) || 1
  const isGroupStage = /group/i.test(stageNameEn)
  const roundLabel = isGroupStage
    ? groupNameEn
      ? `${groupNameEn} · MD${matchDay}`
      : `Group Stage · MD${matchDay}`
    : stageNameEn
  const date = raw.Date ? raw.Date.split('T')[0] : ''
  const hasScore = status !== 'UPCOMING'

  const homeTeam = raw.HomeTeam
  const awayTeam = raw.AwayTeam
  if (!homeTeam || !awayTeam) {
    throw new Error(`FIFA match ${raw.IdMatch} is missing team data`)
  }

  const home = mapTeamInMatch(homeTeam)
  const away = mapTeamInMatch(awayTeam)

  const homeGoals = homeTeam.Goals ?? []
  const awayGoals = awayTeam.Goals ?? []
  const allGoals = [...homeGoals, ...awayGoals].sort(
    (a, b) => parseMinute(a.Minute) - parseMinute(b.Minute),
  )

  // Build an IdPlayer → short player descriptor lookup from both rosters so
  // goal / card / shootout events can render a name instead of a blank cell.
  const playerById = new Map<
    string,
    { internationalName: string; clubShirtName: string; countryCode: string }
  >()
  for (const team of [homeTeam, awayTeam]) {
    const teamCountry = team.IdCountry ?? ''
    for (const p of team.Players ?? []) {
      const fullName = getLocale(p.PlayerName)
      const lastName = fullName.includes(' ') ? fullName.split(' ').slice(1).join(' ') : fullName
      playerById.set(p.IdPlayer, {
        internationalName: fullName,
        clubShirtName: lastName,
        countryCode: teamCountry,
      })
    }
  }
  const lookupPlayer = (id: string) =>
    playerById.get(id) ?? { internationalName: '', clubShirtName: '', countryCode: '' }

  // FIFA's `Type` field is unreliable as a penalty-kick flag: in some matches
  // every Type=2 is a normal goal (e.g. Croatia 2-1 Morocco third-place match)
  // while in others Type=2 is a spot kick (e.g. Qatar-Ecuador). We skip the
  // Type=2 → PENALTY mapping entirely to avoid false positives; in-game
  // penalty kicks just render as 'REGULAR' goals. Shootout kicks are still
  // handled separately via the Period === 11 path below.
  const scorers: MatchEvent[] = allGoals
    .filter((g) => g.Period !== 11)
    .map((g, i) => ({
      id: `goal-${i}-${g.IdPlayer}`,
      phase: g.Period === 3 ? 'REGULAR' : g.Period === 5 ? 'REGULAR' : 'EXTRA_TIME',
      teamId: g.IdTeam,
      time: { minute: parseMinute(g.Minute), second: 0 },
      goalType: 'REGULAR',
      player: lookupPlayer(g.IdPlayer),
    }))

  const homeBookings = homeTeam.Bookings ?? []
  const awayBookings = awayTeam.Bookings ?? []
  const redCards: MatchEvent[] = [...homeBookings, ...awayBookings]
    .filter((b) => b.Card === 2)
    .map((b, i) => ({
      id: `rc-${i}-${b.IdPlayer}`,
      phase: 'REGULAR',
      teamId: b.IdTeam,
      time: { minute: parseMinute(b.Minute), second: 0 },
      player: lookupPlayer(b.IdPlayer),
    }))

  // FIFA returns 0-0 for matches that never went to a shootout, so "scores are
  // present" isn't enough — treat the shootout as real only when at least one
  // team actually scored a spot-kick.
  const penaltyHome = raw.HomeTeamPenaltyScore ?? 0
  const penaltyAway = raw.AwayTeamPenaltyScore ?? 0
  const hadShootout = penaltyHome > 0 || penaltyAway > 0

  let penaltyScorers: PenaltyEvent[] | undefined
  if (hadShootout) {
    const curated = shootoutSequences[raw.IdMatch]
    if (curated?.kicks?.length) {
      // Curated data is the source of truth: full alternating sequence with
      // both SCORED and MISSED kicks in the real kick order.
      penaltyScorers = curated.kicks.map((k, i) => {
        const rosterHit = k.idPlayer
          ? lookupPlayer(k.idPlayer)
          : { internationalName: '', clubShirtName: '', countryCode: '' }
        const fullName = rosterHit.internationalName || k.playerName
        const shortName =
          rosterHit.clubShirtName ||
          (fullName.includes(' ') ? fullName.split(' ').slice(1).join(' ') : fullName)
        return {
          id: `pen-${i}-${k.idPlayer ?? k.playerName.replace(/\s+/g, '-').toLowerCase()}`,
          penaltyType: k.result,
          phase: 'PENALTY',
          teamId: k.idTeam,
          player: { internationalName: fullName, clubShirtName: shortName },
        }
      })
    } else {
      // Fallback for matches we haven't curated yet: emit scored kicks from
      // FIFA Goals[Period=11]. Misses will be absent; UI will show gaps.
      const penGoals = allGoals.filter((g) => g.Period === 11)
      penaltyScorers = penGoals.map((g, i) => {
        const p = lookupPlayer(g.IdPlayer)
        return {
          id: `pen-scored-${i}-${g.IdPlayer}`,
          penaltyType: 'SCORED',
          phase: 'PENALTY',
          teamId: g.IdTeam,
          player: { internationalName: p.internationalName, clubShirtName: p.clubShirtName },
        }
      })
    }
  }

  return {
    id: raw.IdMatch,
    homeTeam: home,
    awayTeam: away,
    kickOffTime: {
      date,
      dateTime: raw.Date ?? '',
      utcOffsetInHours: 0,
    },
    score: hasScore
      ? {
          total: {
            home: raw.HomeTeamScore ?? homeTeam.Score ?? 0,
            away: raw.AwayTeamScore ?? awayTeam.Score ?? 0,
          },
          regular: {
            home: raw.HomeTeamScore ?? homeTeam.Score ?? 0,
            away: raw.AwayTeamScore ?? awayTeam.Score ?? 0,
          },
          ...(hadShootout
            ? {
                penalty: {
                  home: penaltyHome,
                  away: penaltyAway,
                },
              }
            : {}),
        }
      : undefined,
    status,
    round: {
      metaData: { name: roundLabel, type: 'TOURNAMENT' },
      phase: 'TOURNAMENT',
    },
    matchday: {
      longName: roundLabel,
      name: roundLabel,
      dateFrom: date,
      dateTo: date,
    },
    stadium: raw.Stadium
      ? {
          id: 0,
          translations: {
            officialName: { EN: getLocale(raw.Stadium.Name) },
          },
          city: {
            translations: {
              name: { EN: getLocale(raw.Stadium.CityName) },
            },
          },
        }
      : undefined,
    competition: { id: FIFA_COMPETITION_ID, metaData: { name: 'FIFA World Cup' } },
    playerEvents:
      scorers.length > 0 || redCards.length > 0 || penaltyScorers
        ? { scorers, redCards, penaltyScorers }
        : undefined,
  }
}

function enrichPlayerClub(
  _idPlayer: string,
  playerName: string,
  countryCode: string,
  seasonYear: number,
): { clubName?: string; clubLogoUrl?: string } {
  const squadMap = squadsByYear[seasonYear]
  if (!squadMap) return {}

  const countrySquad = squadMap[countryCode]
  if (!countrySquad) return {}

  const key = normalizeName(playerName)
  const entry = countrySquad[key]
  if (!entry) return {}

  const clubName = entry.clubName
  const clubEntry = clubsMap[clubName]
  const clubLogoUrl = clubEntry?.logoUrl

  return { clubName, ...(clubLogoUrl ? { clubLogoUrl } : {}) }
}

function mapPlayerInfo(p: FifaPlayer, seasonYear: number, countryCode: string): PlayerInfo {
  const name = getLocale(p.PlayerName)
  const lastName = name.includes(' ') ? name.split(' ').slice(1).join(' ') : name
  const posMap: Record<number, string> = {
    0: 'GOALKEEPER',
    1: 'DEFENDER',
    2: 'MIDFIELDER',
    3: 'FORWARD',
    4: 'MIDFIELDER',
  }
  const fieldPosition = posMap[p.Position] ?? 'MIDFIELDER'

  const { clubName, clubLogoUrl } = enrichPlayerClub(p.IdPlayer, name, countryCode, seasonYear)

  return {
    id: p.IdPlayer,
    internationalName: name,
    clubShirtName: lastName,
    countryCode,
    fieldPosition,
    detailedFieldPosition: fieldPosition,
    imageUrl: '',
    clubName,
    clubLogoUrl,
    translations: {
      shortName: { EN: lastName },
      name: { EN: name },
    },
  }
}

function mapTeamLineup(team: FifaTeam, isAway: boolean, seasonYear: number): TeamLineup {
  const countryCode = team.IdCountry ?? team.Abbreviation ?? ''
  const field: LineupPlayer[] = []
  const bench: BenchPlayer[] = []

  const starters = team.Players.filter(
    (p) => p.LineupX != null && p.LineupY != null && p.Position !== 4,
  )
  const benchPlayers = team.Players.filter(
    (p) => p.LineupX == null || p.LineupY == null || p.Position === 4,
  )

  for (const p of starters) {
    const rawX = p.LineupX!
    const rawY = p.LineupY!
    let nx = normalizeX(rawX)
    const ny = normalizeY(rawY)

    if (isAway) {
      nx = 1000 - nx
    }

    const playerInfo = mapPlayerInfo(p, seasonYear, countryCode)
    field.push({
      jerseyNumber: p.ShirtNumber,
      fieldCoordinate: { x: nx, y: ny },
      fspFieldCoordinate: { x: nx, y: ny },
      isBooked: false,
      type: playerInfo.fieldPosition,
      player: playerInfo,
    })
  }

  for (const p of benchPlayers) {
    const playerInfo = mapPlayerInfo(p, seasonYear, countryCode)
    bench.push({
      jerseyNumber: p.ShirtNumber,
      isBooked: false,
      type: playerInfo.fieldPosition,
      player: playerInfo,
    })
  }

  const teamName = getLocale(team.TeamName)

  return {
    team: {
      id: team.IdTeam,
      internationalName: teamName,
      logoUrl: resolveFifaPictureUrl(team.PictureUrl, 3),
      mediumLogoUrl: resolveFifaPictureUrl(team.PictureUrl, 4),
      bigLogoUrl: resolveFifaPictureUrl(team.PictureUrl, 5),
    },
    field,
    bench,
  }
}

export const fifaWorldCupProvider: CompetitionProvider = {
  id: 'fifa-wc',
  name: 'FIFA World Cup',
  logoUrl: '/competitions-logos/fifa-wc.svg',
  proxyPath: PROXY,
  competitionType: 'national',
  paginationMode: 'offset',
  defaultDisplayMode: 'clubLogo',

  getSeasons() {
    return [2022, 2018]
  },

  getDefaultSeason() {
    return 2022
  },

  seasonLabel(year) {
    if (year === 2022) return 'Qatar 2022'
    if (year === 2018) return 'Russia 2018'
    return String(year)
  },

  async fetchMatches(seasonYear, offset, limit, signal) {
    const seasonId = FIFA_SEASON_IDS[seasonYear]
    if (!seasonId) throw new Error(`FIFA: unknown season ${seasonYear}`)

    const data = await fetchJson<FifaCalendarResponse>(
      `${PROXY}/api/v3/calendar/matches?idCompetition=${FIFA_COMPETITION_ID}&idSeason=${seasonId}&language=en&count=100`,
      signal,
    )

    const all = data.Results.map(normalizeFifaMatch)
      .map(mapFifaMatchToCanonical)
      .sort((a, b) => b.kickOffTime.dateTime.localeCompare(a.kickOffTime.dateTime))

    return all.slice(offset, offset + limit)
  },

  async fetchMatch(matchId, signal) {
    const raw = await fetchJson<FifaMatch>(
      `${PROXY}/api/v3/live/football/${matchId}?language=en`,
      signal,
    )
    return mapFifaMatchToCanonical(normalizeFifaMatch(raw))
  },

  async fetchMatchLineups(matchId, signal) {
    const raw = normalizeFifaMatch(
      await fetchJson<FifaMatch>(`${PROXY}/api/v3/live/football/${matchId}?language=en`, signal),
    )

    const seasonYear = Number(
      Object.entries(FIFA_SEASON_IDS).find(([, v]) => v === raw.IdSeason)?.[0] ?? 2022,
    )

    const homeTeam = raw.HomeTeam
    const awayTeam = raw.AwayTeam
    if (!homeTeam || !awayTeam) {
      throw new Error(`FIFA match ${raw.IdMatch} is missing team data`)
    }

    return {
      matchId: raw.IdMatch,
      lineupStatus:
        raw.MatchStatus === 0 ? 'TACTICAL' : raw.MatchStatus === 1 ? 'EXPECTED' : 'TACTICAL',
      homeTeam: mapTeamLineup(homeTeam, false, seasonYear),
      awayTeam: mapTeamLineup(awayTeam, true, seasonYear),
    } as MatchLineups
  },

  getExternalUrl(match) {
    const dateStr = match.kickOffTime.date || match.kickOffTime.dateTime || ''
    const year = Number(dateStr.slice(0, 4))
    const seasonId = FIFA_SEASON_IDS[year] ?? FIFA_SEASON_IDS[2022] ?? ''
    return `https://www.fifa.com/en/match-centre/match/${FIFA_COMPETITION_ID}/${seasonId}/${match.id}`
  },
}
