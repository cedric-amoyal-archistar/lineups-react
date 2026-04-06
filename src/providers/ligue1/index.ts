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
  Ligue1MatchesResponse,
  Ligue1MatchDetail,
  Ligue1Match,
  Ligue1MatchSide,
  Ligue1ClubIdentity,
  Ligue1Goal,
} from './types'
import { getFormationCoordinates } from './formations'

const PROXY = '/ligue1-api'

interface StandingsResponse {
  standings: Record<string, { played: number }>
}

async function fetchStandings(
  seasonYear: number,
  signal?: AbortSignal,
): Promise<{ totalGameweeks: number; currentGameweek: number }> {
  const data = await fetchJson<StandingsResponse>(
    `${PROXY}/championship-standings/1/general?season=${seasonYear}`,
    signal,
  )
  const teams = Object.values(data.standings)
  const numTeams = teams.length
  const totalGameweeks = (numTeams - 1) * 2
  const currentGameweek = Math.max(...teams.map((t) => t.played))
  return { totalGameweeks, currentGameweek }
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Ligue 1 API error: ${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

function mapStatus(period: string, isLive: boolean): 'UPCOMING' | 'LIVE' | 'FINISHED' {
  if (isLive) return 'LIVE'
  if (period === 'fullTime') return 'FINISHED'
  return 'UPCOMING'
}

function mapTeam(clubIdentity: Ligue1ClubIdentity, clubId: string): TeamInMatch {
  return {
    id: clubId,
    internationalName: clubIdentity.name,
    logoUrl: clubIdentity.assets.logo.small,
    mediumLogoUrl: clubIdentity.assets.logo.medium,
    bigLogoUrl: clubIdentity.assets.logo.large,
    countryCode: 'FRA',
    teamCode: clubIdentity.trigram,
    translations: {
      displayName: { FR: clubIdentity.name },
      displayOfficialName: { FR: clubIdentity.name },
    },
  }
}

function mapListMatch(raw: Ligue1Match): Match {
  const status = mapStatus(raw.period, raw.isLive)
  const hasScore = status !== 'UPCOMING'
  return {
    id: raw.matchId,
    homeTeam: mapTeam(raw.home.clubIdentity, raw.home.clubId),
    awayTeam: mapTeam(raw.away.clubIdentity, raw.away.clubId),
    kickOffTime: {
      date: raw.date.split('T')[0],
      dateTime: raw.date,
      utcOffsetInHours: 0,
    },
    score: hasScore
      ? {
          total: { home: raw.home.score, away: raw.away.score },
          regular: { home: raw.home.score, away: raw.away.score },
        }
      : undefined,
    status,
    round: {
      metaData: { name: `Matchday ${raw.gameWeekNumber}`, type: 'MATCHDAY' },
      phase: 'LEAGUE',
    },
    matchday: {
      longName: `Matchday ${raw.gameWeekNumber}`,
      name: `MD${raw.gameWeekNumber}`,
      dateFrom: raw.date,
      dateTo: raw.date,
    },
    competition: { id: '1', metaData: { name: 'Ligue 1' } },
  }
}

function mapDetailMatch(raw: Ligue1MatchDetail): Match {
  const isLive = raw.period !== 'fullTime' && raw.period !== 'preMatch'
  const status = mapStatus(raw.period, isLive)
  const hasScore = status !== 'UPCOMING'

  const scorers = mapGoalsToEvents(raw.home, raw.away)

  return {
    id: raw.id,
    homeTeam: mapTeam(raw.home.clubIdentity, raw.home.clubId),
    awayTeam: mapTeam(raw.away.clubIdentity, raw.away.clubId),
    kickOffTime: {
      date: raw.date.split('T')[0],
      dateTime: raw.date,
      utcOffsetInHours: 0,
    },
    score: hasScore
      ? {
          total: { home: raw.home.score, away: raw.away.score },
          regular: { home: raw.home.score, away: raw.away.score },
        }
      : undefined,
    status,
    round: {
      metaData: { name: `Matchday ${raw.gameWeekNumber}`, type: 'MATCHDAY' },
      phase: 'LEAGUE',
    },
    matchday: {
      longName: `Matchday ${raw.gameWeekNumber}`,
      name: `MD${raw.gameWeekNumber}`,
      dateFrom: raw.date,
      dateTo: raw.date,
    },
    stadium: raw.stadium
      ? {
          id: 0,
          translations: { officialName: { EN: raw.stadium.name } },
          city: { translations: { name: { EN: raw.stadium.address?.city ?? '' } } },
        }
      : undefined,
    competition: { id: '1', metaData: { name: 'Ligue 1' } },
    playerEvents: {
      scorers,
      redCards: mapRedCards(raw.home, raw.away),
    },
  }
}

function findPlayerName(
  side: Ligue1MatchSide,
  playerId: string,
): { name: string; countryCode: string } {
  const player = side.players[playerId]
  if (player) {
    const pi = player.playerIdentity
    return {
      name: `${pi.firstName} ${pi.lastName}`,
      countryCode: pi.countryShortCode,
    }
  }
  return { name: 'Unknown', countryCode: '' }
}

function parseMinute(time: string): number {
  const match = time.match(/(\d+)/)
  return match ? Number(match[1]) : 0
}

function mapGoalsToEvents(home: Ligue1MatchSide, away: Ligue1MatchSide): MatchEvent[] {
  const events: MatchEvent[] = []

  const mapSideGoals = (side: Ligue1MatchSide, teamId: string, goals: Ligue1Goal[]) => {
    for (const goal of goals) {
      const { name, countryCode } = findPlayerName(side, goal.scorerId)
      events.push({
        id: `${goal.timestamp}`,
        phase: 'REGULAR',
        teamId,
        time: {
          minute: parseMinute(goal.time),
          second: 0,
        },
        goalType:
          goal.type === 'penalty' ? 'PENALTY' : goal.type === 'ownGoal' ? 'OWN_GOAL' : 'REGULAR',
        player: {
          clubShirtName: name,
          internationalName: name,
          countryCode,
        },
      })
    }
  }

  mapSideGoals(home, home.clubId, home.goals)
  mapSideGoals(away, away.clubId, away.goals)
  events.sort((a, b) => a.time.minute - b.time.minute)
  return events
}

function mapRedCards(home: Ligue1MatchSide, away: Ligue1MatchSide): MatchEvent[] {
  const events: MatchEvent[] = []

  const mapSide = (side: Ligue1MatchSide, teamId: string) => {
    for (const booking of side.bookings) {
      if (booking.type !== 'red') continue
      const { name, countryCode } = findPlayerName(side, booking.playerId)
      events.push({
        id: `${booking.timestamp}`,
        phase: 'REGULAR',
        teamId,
        time: { minute: parseMinute(booking.time), second: 0 },
        player: {
          clubShirtName: name,
          internationalName: name,
          countryCode,
        },
      })
    }
  }

  mapSide(home, home.clubId)
  mapSide(away, away.clubId)
  return events
}

const POSITION_MAP: Record<number, string> = {
  1: 'GOALKEEPER',
  2: 'DEFENDER',
  3: 'MIDFIELDER',
  4: 'FORWARD',
}

function mapLineups(raw: Ligue1MatchDetail): MatchLineups {
  return {
    matchId: raw.id,
    lineupStatus: raw.period === 'preMatch' ? 'EXPECTED' : 'TACTICAL',
    homeTeam: mapTeamLineup(raw.home),
    awayTeam: mapTeamLineup(raw.away),
  }
}

function mapTeamLineup(side: Ligue1MatchSide): TeamLineup {
  const coordMap = getFormationCoordinates(side.formation)
  const field: LineupPlayer[] = []
  const bench: BenchPlayer[] = []

  for (const player of Object.values(side.players)) {
    const pi = player.playerIdentity
    const fullName = `${pi.firstName} ${pi.lastName}`
    const lastName = pi.lastName
    const fieldPosition = POSITION_MAP[player.position] ?? 'MIDFIELDER'

    if (player.formationPlace > 0 && player.startedMatch) {
      const coord = coordMap[player.formationPlace] ?? { x: 500, y: 500 }
      field.push({
        jerseyNumber: player.shirtNumber,
        fieldCoordinate: coord,
        fspFieldCoordinate: coord,
        isBooked: false,
        type: fieldPosition,
        player: {
          id: player.id,
          internationalName: fullName,
          clubShirtName: lastName,
          countryCode: pi.countryShortCode,
          fieldPosition,
          detailedFieldPosition: fieldPosition,
          imageUrl: pi.assets?.facePictures?.medium ?? '',
          birthDate: pi.birthDate,
          translations: {
            shortName: { EN: lastName },
            name: { EN: fullName },
          },
        },
      })
    } else {
      bench.push({
        jerseyNumber: player.shirtNumber,
        isBooked: false,
        type: fieldPosition,
        player: {
          id: player.id,
          internationalName: fullName,
          clubShirtName: lastName,
          countryCode: pi.countryShortCode,
          fieldPosition,
          detailedFieldPosition: fieldPosition,
          imageUrl: pi.assets?.facePictures?.medium ?? '',
          birthDate: pi.birthDate,
          translations: {
            shortName: { EN: lastName },
            name: { EN: fullName },
          },
        },
      })
    }
  }

  // Mark booked players
  for (const booking of side.bookings) {
    const allPlayers = [...field, ...bench]
    const booked = allPlayers.find((p) => p.player.id === booking.playerId)
    if (booked) booked.isBooked = true
  }

  return {
    team: {
      id: side.clubId,
      internationalName: side.clubIdentity.name,
      logoUrl: side.clubIdentity.assets.logo.small,
      mediumLogoUrl: side.clubIdentity.assets.logo.medium,
      bigLogoUrl: side.clubIdentity.assets.logo.large,
    },
    coaches: [
      {
        person: {
          id: '0',
          countryCode: '',
          translations: {
            name: { EN: `${side.manager.firstName} ${side.manager.lastName}` },
            shortName: { EN: side.manager.lastName },
          },
        },
        imageUrl: '',
      },
    ],
    field,
    bench,
    shirtColor: side.clubIdentity.primaryColor,
  }
}

export const ligue1Provider: CompetitionProvider = {
  id: 'ligue1',
  name: 'Ligue 1',
  logoUrl: '/logos/ligue1.png',
  proxyPath: PROXY,
  paginationMode: 'gameweek',

  async fetchMatches(seasonYear, _offset, _limit, signal) {
    return this.fetchMatchesByGameweek!(seasonYear, 1, signal)
  },

  async fetchMatchesByGameweek(seasonYear, gameweek, signal) {
    const data = await fetchJson<Ligue1MatchesResponse>(
      `${PROXY}/championship-matches/championship/1/game-week/${gameweek}?season=${seasonYear}`,
      signal,
    )
    return data.matches.map(mapListMatch)
  },

  async fetchMatch(matchId, signal) {
    const data = await fetchJson<Ligue1MatchDetail>(
      `${PROXY}/championship-match/${matchId}`,
      signal,
    )
    return mapDetailMatch(data)
  },

  async fetchMatchLineups(matchId, signal) {
    const data = await fetchJson<Ligue1MatchDetail>(
      `${PROXY}/championship-match/${matchId}`,
      signal,
    )
    return mapLineups(data)
  },

  async getDefaultGameweek(seasonYear, signal) {
    const { currentGameweek } = await fetchStandings(seasonYear, signal)
    return currentGameweek || 1
  },

  async getTotalGameweeks(seasonYear, signal) {
    const { totalGameweeks } = await fetchStandings(seasonYear, signal)
    return totalGameweeks
  },

  getExternalUrl(match) {
    return `https://ligue1.com/fr/match-sheet/${match.id}/summary`
  },

  getSeasons() {
    const now = new Date()
    const current = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1
    return Array.from({ length: current - 2015 + 1 }, (_, i) => current - i)
  },

  getDefaultSeason() {
    const now = new Date()
    return now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1
  },

  seasonLabel(year) {
    return `${year}/${String(year + 1).slice(2)}`
  },
}
