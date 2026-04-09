import type { CompetitionProvider } from '../types'
import type {
  Match,
  MatchLineups,
  TeamInMatch,
  MatchEvent,
  LineupPlayer,
  BenchPlayer,
  TeamLineup,
} from '@/types/match'
import type {
  PLMatchesResponse,
  PLMatchSummary,
  PLMatchDetail,
  PLTeamRef,
  PLLineupsResponse,
  PLTeamLineup,
  PLPlayer,
  PLEventsResponse,
  PLEventsSide,
  PLTeamsResponse,
  PLSquadPlayer,
} from './types'
import { findActiveGameweek } from '../shared/findActiveGameweek'
import { getFormationCoordinates } from '../shared/formations'

const PROXY = '/pl-api'
const COMPETITION_ID = '8'
const BADGE_BASE = 'https://resources.premierleague.com/premierleague/badges'
const PLAYER_IMG_BASE = 'https://resources.premierleague.com/premierleague25/photos/players/40x40'

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`PL API error: ${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

function mapStatus(period: string): 'UPCOMING' | 'LIVE' | 'FINISHED' {
  if (period === 'PreMatch') return 'UPCOMING'
  if (period === 'FullTime') return 'FINISHED'
  return 'LIVE'
}

function mapTeam(team: PLTeamRef): TeamInMatch {
  return {
    id: team.id,
    internationalName: team.name,
    logoUrl: `${BADGE_BASE}/50/t${team.id}.png`,
    mediumLogoUrl: `${BADGE_BASE}/100/t${team.id}.png`,
    bigLogoUrl: `${BADGE_BASE}/rb/t${team.id}.svg`,
    countryCode: 'ENG',
    teamCode: team.abbr ?? team.shortName.slice(0, 3).toUpperCase(),
    translations: {
      displayName: { EN: team.name },
      displayOfficialName: { EN: team.name },
    },
  }
}

function parseGround(ground: string): { stadium: string; city: string } {
  const lastComma = ground.lastIndexOf(',')
  if (lastComma === -1) return { stadium: ground, city: '' }
  return {
    stadium: ground.slice(0, lastComma).trim(),
    city: ground.slice(lastComma + 1).trim(),
  }
}

const POSITION_MAP: Record<string, string> = {
  Goalkeeper: 'GOALKEEPER',
  Defender: 'DEFENDER',
  Midfielder: 'MIDFIELDER',
  Forward: 'FORWARD',
}

function mapGoalType(goalType: string): string {
  if (goalType === 'Penalty') return 'PENALTY'
  if (goalType === 'Own') return 'OWN_GOAL'
  return 'REGULAR'
}

function mapMatchSummary(raw: PLMatchSummary, gameweek: number): Match {
  const status = mapStatus(raw.period)
  const date = raw.kickoff.slice(0, 10)
  const { stadium, city } = parseGround(raw.ground)

  return {
    id: raw.matchId,
    homeTeam: mapTeam(raw.homeTeam),
    awayTeam: mapTeam(raw.awayTeam),
    kickOffTime: {
      dateTime: raw.kickoff.replace(' ', 'T'),
      date,
      utcOffsetInHours: 0,
    },
    score:
      status !== 'UPCOMING' && raw.homeTeam.score !== undefined && raw.awayTeam.score !== undefined
        ? {
            total: { home: raw.homeTeam.score, away: raw.awayTeam.score },
            regular: { home: raw.homeTeam.score, away: raw.awayTeam.score },
          }
        : undefined,
    status,
    round: {
      metaData: { name: `Matchday ${gameweek}`, type: 'MATCHDAY' },
      phase: 'LEAGUE',
    },
    matchday: {
      longName: `Matchday ${gameweek}`,
      name: `MD${gameweek}`,
      dateFrom: date,
      dateTo: date,
    },
    minute: status === 'LIVE' && raw.clock ? Number(raw.clock) : undefined,
    competition: { id: COMPETITION_ID, metaData: { name: 'Premier League' } },
    stadium: {
      id: 0,
      translations: { officialName: { EN: stadium } },
      city: { translations: { name: { EN: city } } },
    },
  }
}

async function fetchSquad(
  seasonYear: number,
  teamId: string,
  signal?: AbortSignal,
): Promise<PLSquadPlayer[]> {
  const res = await fetch(
    `${PROXY}/api/v2/competitions/${COMPETITION_ID}/seasons/${seasonYear}/teams/${teamId}/squad`,
    { signal },
  )
  if (!res.ok) return []
  const raw = (await res.json()) as PLSquadPlayer[] | Record<string, PLSquadPlayer>
  if (Array.isArray(raw)) return raw
  const players: PLSquadPlayer[] = []
  for (const key of Object.keys(raw)) {
    if (!isNaN(Number(key))) {
      players.push(raw[key])
    }
  }
  return players
}

function buildPlayerCountryMap(players: PLSquadPlayer[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const p of players) {
    map.set(p.id, p.country?.isoCode ?? '')
  }
  return map
}

function buildPlayerNameMap(lineups?: PLLineupsResponse): Map<string, string> {
  const map = new Map<string, string>()
  if (!lineups) return map
  const addPlayers = (teamLineup: PLTeamLineup) => {
    for (const player of teamLineup.players) {
      const displayName = player.knownName ?? `${player.firstName} ${player.lastName}`
      map.set(player.id, displayName)
    }
  }
  addPlayers(lineups.home_team)
  addPlayers(lineups.away_team)
  return map
}

function mapEventsToScorers(
  homeEvents: PLEventsSide,
  awayEvents: PLEventsSide,
  playerNameMap: Map<string, string>,
): MatchEvent[] {
  const events: MatchEvent[] = []

  const mapSideGoals = (side: PLEventsSide) => {
    for (const goal of side.goals) {
      const name = playerNameMap.get(goal.playerId) ?? goal.playerId
      events.push({
        id: goal.timestamp,
        phase: 'REGULAR',
        teamId: side.id,
        time: {
          minute: Number(goal.time),
          second: 0,
        },
        goalType: mapGoalType(goal.goalType),
        player: {
          clubShirtName: name,
          internationalName: name,
          countryCode: '',
        },
      })
    }
  }

  mapSideGoals(homeEvents)
  mapSideGoals(awayEvents)
  events.sort((a, b) => a.time.minute - b.time.minute)
  return events
}

function mapRedCards(
  homeEvents: PLEventsSide,
  awayEvents: PLEventsSide,
  playerNameMap: Map<string, string>,
): MatchEvent[] {
  const events: MatchEvent[] = []

  const mapSide = (side: PLEventsSide) => {
    for (const card of side.cards) {
      if (!card.type.includes('Red')) continue
      const name = playerNameMap.get(card.playerId) ?? card.playerId
      events.push({
        id: card.timestamp,
        phase: 'REGULAR',
        teamId: side.id,
        time: { minute: Number(card.time), second: 0 },
        player: {
          clubShirtName: name,
          internationalName: name,
          countryCode: '',
        },
      })
    }
  }

  mapSide(homeEvents)
  mapSide(awayEvents)
  return events
}

function mapMatchDetail(
  raw: PLMatchDetail,
  events?: PLEventsResponse,
  lineups?: PLLineupsResponse,
  _countryMap?: Map<string, string>,
): Match {
  const status = mapStatus(raw.period)
  const date = raw.kickoff.slice(0, 10)
  const { stadium, city } = parseGround(raw.ground)
  const playerNameMap = buildPlayerNameMap(lineups)

  const scorers = events ? mapEventsToScorers(events.homeTeam, events.awayTeam, playerNameMap) : []
  const redCards = events ? mapRedCards(events.homeTeam, events.awayTeam, playerNameMap) : []

  const hasScore = status !== 'UPCOMING'

  return {
    id: raw.matchId,
    homeTeam: mapTeam(raw.homeTeam),
    awayTeam: mapTeam(raw.awayTeam),
    kickOffTime: {
      dateTime: raw.kickoff.replace(' ', 'T'),
      date,
      utcOffsetInHours: 0,
    },
    score: hasScore
      ? {
          total: { home: raw.homeTeam.score, away: raw.awayTeam.score },
          regular: { home: raw.homeTeam.score, away: raw.awayTeam.score },
        }
      : undefined,
    status,
    minute: status === 'LIVE' && raw.clock ? Number(raw.clock) : undefined,
    round: {
      metaData: { name: `Matchday ${raw.matchWeek}`, type: 'MATCHDAY' },
      phase: 'LEAGUE',
    },
    matchday: {
      longName: `Matchday ${raw.matchWeek}`,
      name: `MD${raw.matchWeek}`,
      dateFrom: date,
      dateTo: date,
    },
    competition: { id: COMPETITION_ID, metaData: { name: 'Premier League' } },
    stadium: {
      id: 0,
      translations: { officialName: { EN: stadium } },
      city: { translations: { name: { EN: city } } },
    },
    playerEvents:
      scorers.length > 0 || redCards.length > 0
        ? {
            scorers,
            redCards,
          }
        : undefined,
  }
}

function mapTeamLineup(
  teamData: PLTeamLineup,
  events?: PLEventsSide,
  countryMap?: Map<string, string>,
): TeamLineup {
  const playerMap = new Map<string, PLPlayer>()
  for (const p of teamData.players) {
    playerMap.set(p.id, p)
  }

  const formationStr = teamData.formation.formation.replace(/-/g, '')
  const coordMap = getFormationCoordinates(formationStr)
  const starterIds = teamData.formation.lineup.flat()
  const cardedPlayerIds = new Set(events?.cards.map((c) => c.playerId) ?? [])

  const field: LineupPlayer[] = starterIds
    .map((playerId, index) => {
      const player = playerMap.get(playerId)
      if (!player) return null
      const formationPlace = index + 1
      const coord = coordMap[formationPlace] ?? { x: 500, y: 500 }
      const displayName = player.knownName ?? `${player.firstName} ${player.lastName}`
      const shirtName = player.knownName ?? player.lastName
      const fieldPosition = POSITION_MAP[player.position] ?? 'MIDFIELDER'
      return {
        jerseyNumber: Number(player.shirtNum),
        fieldCoordinate: coord,
        fspFieldCoordinate: coord,
        isBooked: cardedPlayerIds.has(playerId),
        type: fieldPosition,
        player: {
          id: player.id,
          internationalName: displayName,
          clubShirtName: shirtName,
          countryCode: countryMap?.get(player.id) ?? '',
          fieldPosition,
          detailedFieldPosition: fieldPosition,
          imageUrl: `${PLAYER_IMG_BASE}/${player.id}.png`,
          translations: {
            shortName: { EN: shirtName },
            name: { EN: displayName },
          },
        },
      }
    })
    .filter(Boolean) as LineupPlayer[]

  const bench: BenchPlayer[] = teamData.formation.subs
    .map((playerId) => {
      const player = playerMap.get(playerId)
      if (!player) return null
      const displayName = player.knownName ?? `${player.firstName} ${player.lastName}`
      const shirtName = player.knownName ?? player.lastName
      const fieldPosition = POSITION_MAP[player.position] ?? 'MIDFIELDER'
      return {
        jerseyNumber: Number(player.shirtNum),
        isBooked: cardedPlayerIds.has(playerId),
        type: fieldPosition,
        player: {
          id: player.id,
          internationalName: displayName,
          clubShirtName: shirtName,
          countryCode: countryMap?.get(player.id) ?? '',
          fieldPosition,
          detailedFieldPosition: fieldPosition,
          imageUrl: `${PLAYER_IMG_BASE}/${player.id}.png`,
          translations: {
            shortName: { EN: shirtName },
            name: { EN: displayName },
          },
        },
      }
    })
    .filter(Boolean) as BenchPlayer[]

  return {
    team: {
      id: teamData.teamId,
      internationalName: '',
      logoUrl: `${BADGE_BASE}/50/t${teamData.teamId}.png`,
      mediumLogoUrl: `${BADGE_BASE}/100/t${teamData.teamId}.png`,
      bigLogoUrl: `${BADGE_BASE}/rb/t${teamData.teamId}.svg`,
    },
    coaches: [],
    field,
    bench,
  }
}

function mapLineups(
  matchId: string,
  data: PLLineupsResponse,
  events?: PLEventsResponse,
  countryMap?: Map<string, string>,
): MatchLineups {
  return {
    matchId,
    lineupStatus: 'TACTICAL',
    homeTeam: mapTeamLineup(data.home_team, events?.homeTeam, countryMap),
    awayTeam: mapTeamLineup(data.away_team, events?.awayTeam, countryMap),
  }
}

export const premierLeagueProvider: CompetitionProvider = {
  id: 'premier-league',
  name: 'Premier League',
  logoUrl: '/competitions-logos/premier-league.svg',
  proxyPath: PROXY,
  paginationMode: 'gameweek',

  async fetchMatches(seasonYear, _offset, _limit, signal) {
    return this.fetchMatchesByGameweek!(seasonYear, 1, signal)
  },

  async fetchMatchesByGameweek(seasonYear, gameweek, signal) {
    const data = await fetchJson<PLMatchesResponse>(
      `${PROXY}/api/v1/competitions/${COMPETITION_ID}/seasons/${seasonYear}/matchweeks/${gameweek}/matches?_limit=20`,
      signal,
    )
    return data.data.map((m) => mapMatchSummary(m, gameweek))
  },

  async fetchMatch(matchId, signal) {
    const [detail, events, lineups] = await Promise.all([
      fetchJson<PLMatchDetail>(`${PROXY}/api/v2/matches/${matchId}`, signal),
      fetchJson<PLEventsResponse>(`${PROXY}/api/v1/matches/${matchId}/events`, signal).catch(
        () => undefined,
      ),
      fetchJson<PLLineupsResponse>(`${PROXY}/api/v3/matches/${matchId}/lineups`, signal).catch(
        () => undefined,
      ),
    ])

    let countryMap = new Map<string, string>()
    if (lineups) {
      const seasonYear = Number(detail.seasonId)
      const [homeSquad, awaySquad] = await Promise.all([
        fetchSquad(seasonYear, lineups.home_team.teamId, signal),
        fetchSquad(seasonYear, lineups.away_team.teamId, signal),
      ])
      countryMap = buildPlayerCountryMap([...homeSquad, ...awaySquad])
    }

    return mapMatchDetail(detail, events, lineups, countryMap)
  },

  async fetchMatchLineups(matchId, signal) {
    const [lineups, events] = await Promise.all([
      fetchJson<PLLineupsResponse>(`${PROXY}/api/v3/matches/${matchId}/lineups`, signal),
      fetchJson<PLEventsResponse>(`${PROXY}/api/v1/matches/${matchId}/events`, signal).catch(
        () => undefined,
      ),
    ])

    const detail = await fetchJson<PLMatchDetail>(`${PROXY}/api/v2/matches/${matchId}`, signal)
    const seasonYear = Number(detail.seasonId)

    const [homeSquad, awaySquad] = await Promise.all([
      fetchSquad(seasonYear, lineups.home_team.teamId, signal),
      fetchSquad(seasonYear, lineups.away_team.teamId, signal),
    ])
    const countryMap = buildPlayerCountryMap([...homeSquad, ...awaySquad])

    return mapLineups(String(matchId), lineups, events, countryMap)
  },

  async getTotalGameweeks(seasonYear, signal) {
    const data = await fetchJson<PLTeamsResponse>(
      `${PROXY}/api/v1/competitions/${COMPETITION_ID}/seasons/${seasonYear}/teams?_limit=100`,
      signal,
    )
    return (data.data.length - 1) * 2
  },

  async getDefaultGameweek(seasonYear, signal) {
    const totalGameweeks = await this.getTotalGameweeks!(seasonYear, signal)
    let low = 1
    let high = totalGameweeks
    while (low <= high) {
      const mid = Math.floor((low + high) / 2)
      const matches = await this.fetchMatchesByGameweek!(seasonYear, mid, signal)
      const allFinished = matches.length > 0 && matches.every((m) => m.status === 'FINISHED')
      const allUpcoming = matches.length > 0 && matches.every((m) => m.status === 'UPCOMING')
      if (allFinished) {
        low = mid + 1
      } else if (allUpcoming) {
        high = mid - 1
      } else {
        return findActiveGameweek(
          (sy, gw, sig) => this.fetchMatchesByGameweek!(sy, gw, sig),
          seasonYear,
          mid,
          totalGameweeks,
          signal,
        )
      }
    }
    const start = Math.min(low, totalGameweeks)
    return findActiveGameweek(
      (sy, gw, sig) => this.fetchMatchesByGameweek!(sy, gw, sig),
      seasonYear,
      start,
      totalGameweeks,
      signal,
    )
  },

  getExternalUrl(match) {
    return `https://www.premierleague.com/en/match/${match.id}`
  },

  getSeasons() {
    const now = new Date()
    const current = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1
    return Array.from({ length: current - 2008 + 1 }, (_, i) => current - i)
  },

  getDefaultSeason() {
    const now = new Date()
    return now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1
  },

  seasonLabel(year) {
    return `${year}/${String(year + 1).slice(2)}`
  },
}
