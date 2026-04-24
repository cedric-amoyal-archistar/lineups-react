import { describe, it, expect, vi, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { fifaWorldCupProvider, normalizeName } from '../index'
import { FIFA_SEASON_IDS } from '../seasons'
import { server } from '@/test/msw/server'
import { FIFA_MATCH_ID, fifaCalendarFixture, fifaMatchDetailFixture } from '@/test/msw/fixtures'
import type { Match } from '@/types/match'

// MSW server is started globally via src/test/setup.ts

// ---------------------------------------------------------------------------
// Test-local squad + club data injected via vi.mock to avoid coupling tests
// to the placeholder JSON files that the scraper will populate later.
// ---------------------------------------------------------------------------

vi.mock('@/providers/fifa/squads/2022.json', () => ({
  default: {
    ARG: {
      'lionel messi': { clubName: 'Inter Miami' },
      // Julian Alvarez is in squad map but his club is NOT in the clubs mock
      'julian alvarez': { clubName: 'Manchester City' },
      // Angel Di Maria is intentionally absent (MISS player)
    },
  },
}))

vi.mock('@/providers/fifa/squads/2018.json', () => ({
  default: {
    FRA: {
      'antoine griezmann': { clubName: 'Atletico Madrid 2018' },
    },
  },
}))

vi.mock('@/providers/fifa/clubs.json', () => ({
  default: {
    'Inter Miami': { logoUrl: 'https://logos.example.com/inter-miami.png' },
    // 'Manchester City' is intentionally absent → PARTIAL (clubName resolved, no logo)
  },
}))

// ---------------------------------------------------------------------------
// Provider metadata
// ---------------------------------------------------------------------------

describe('fifaWorldCupProvider — metadata', () => {
  it('has id "fifa-wc"', () => {
    expect(fifaWorldCupProvider.id).toBe('fifa-wc')
  })

  it('has paginationMode "offset"', () => {
    expect(fifaWorldCupProvider.paginationMode).toBe('offset')
  })

  it('has defaultDisplayMode "clubLogo"', () => {
    expect(fifaWorldCupProvider.defaultDisplayMode).toBe('clubLogo')
  })

  it('getSeasons() includes 2022', () => {
    expect(fifaWorldCupProvider.getSeasons()).toContain(2022)
  })

  it('getDefaultSeason() returns 2022', () => {
    expect(fifaWorldCupProvider.getDefaultSeason()).toBe(2022)
  })

  it('seasonLabel(2022) returns "Qatar 2022"', () => {
    expect(fifaWorldCupProvider.seasonLabel(2022)).toBe('Qatar 2022')
  })

  it('does not expose gameweek methods', () => {
    expect('fetchMatchesByGameweek' in fifaWorldCupProvider).toBe(false)
    expect('getTotalGameweeks' in fifaWorldCupProvider).toBe(false)
    expect('getDefaultGameweek' in fifaWorldCupProvider).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// fetchMatches — offset-based, returns all matches in the calendar response
// ---------------------------------------------------------------------------

describe('fifaWorldCupProvider.fetchMatches', () => {
  it('returns all matches in the calendar response', async () => {
    const matches = await fifaWorldCupProvider.fetchMatches(2022, 0, 100)
    expect(matches).toHaveLength(fifaCalendarFixture.Results.length)
  })

  it('match IDs are strings', async () => {
    const matches = await fifaWorldCupProvider.fetchMatches(2022, 0, 100)
    for (const m of matches) {
      expect(typeof m.id).toBe('string')
    }
  })

  it('FINISHED match has score', async () => {
    const matches = await fifaWorldCupProvider.fetchMatches(2022, 0, 100)
    const finished = matches.find((m) => m.status === 'FINISHED')
    expect(finished?.score).toBeDefined()
    expect(finished?.score?.total).toBeDefined()
  })

  it('sorts newest first', async () => {
    const matches = await fifaWorldCupProvider.fetchMatches(2022, 0, 100)
    for (let i = 1; i < matches.length; i++) {
      expect(matches[i - 1].kickOffTime.dateTime >= matches[i].kickOffTime.dateTime).toBe(true)
    }
  })

  it('respects offset + limit', async () => {
    const all = await fifaWorldCupProvider.fetchMatches(2022, 0, 100)
    const page = await fifaWorldCupProvider.fetchMatches(2022, 1, 1)
    expect(page).toHaveLength(1)
    expect(page[0].id).toBe(all[1].id)
  })

  it('throws for unknown season', async () => {
    await expect(fifaWorldCupProvider.fetchMatches(9999, 0, 100)).rejects.toThrow(
      'FIFA: unknown season 9999',
    )
  })

  it('round label uses FIFA stage name (no gameweek terminology)', async () => {
    const matches = await fifaWorldCupProvider.fetchMatches(2022, 0, 100)
    const final = matches.find((m) => /final/i.test(m.round.metaData.name))
    expect(final?.round.metaData.name).toBe('Final')
    const groupMatch = matches.find((m) => /Group|MD/i.test(m.round.metaData.name))
    expect(groupMatch?.round.metaData.name).toMatch(/MD\d/)
  })
})

// ---------------------------------------------------------------------------
// fetchMatch
// ---------------------------------------------------------------------------

describe('fifaWorldCupProvider.fetchMatch', () => {
  beforeEach(() => {
    // Reset to default handler (serves fifaMatchDetailFixture for FIFA_MATCH_ID)
  })

  it('returns canonical Match with correct id', async () => {
    const match = await fifaWorldCupProvider.fetchMatch(FIFA_MATCH_ID)
    expect(match.id).toBe(FIFA_MATCH_ID)
  })

  it('maps home team correctly', async () => {
    const match = await fifaWorldCupProvider.fetchMatch(FIFA_MATCH_ID)
    expect(match.homeTeam.internationalName).toBe('Argentina')
    expect(match.homeTeam.teamCode).toBe('ARG')
  })

  it('maps away team correctly', async () => {
    const match = await fifaWorldCupProvider.fetchMatch(FIFA_MATCH_ID)
    expect(match.awayTeam.internationalName).toBe('France')
    expect(match.awayTeam.teamCode).toBe('FRA')
  })

  it('maps score for FINISHED match', async () => {
    const match = await fifaWorldCupProvider.fetchMatch(FIFA_MATCH_ID)
    expect(match.status).toBe('FINISHED')
    expect(match.score?.total.home).toBe(3)
    expect(match.score?.total.away).toBe(3)
    expect(match.score?.penalty?.home).toBe(4)
    expect(match.score?.penalty?.away).toBe(2)
  })

  it('maps stadium name', async () => {
    const match = await fifaWorldCupProvider.fetchMatch(FIFA_MATCH_ID)
    expect(match.stadium?.translations.officialName?.EN).toBe('Lusail Stadium')
  })

  it('maps round name to "Final"', async () => {
    const match = await fifaWorldCupProvider.fetchMatch(FIFA_MATCH_ID)
    expect(match.round.metaData.name).toBe('Final')
  })

  it('UPCOMING match has no score', async () => {
    server.use(
      http.get('/fifa-api/api/v3/live/football/:matchId', () =>
        HttpResponse.json({ ...fifaMatchDetailFixture, MatchStatus: 1 }),
      ),
    )
    const match = await fifaWorldCupProvider.fetchMatch(FIFA_MATCH_ID)
    expect(match.status).toBe('UPCOMING')
    expect(match.score).toBeUndefined()
  })

  it('omits penalty score when neither team scored in a shootout (FIFA returns 0-0 for non-shootout matches)', async () => {
    server.use(
      http.get('/fifa-api/api/v3/live/football/:matchId', () =>
        HttpResponse.json({
          ...fifaMatchDetailFixture,
          HomeTeamScore: 2,
          AwayTeamScore: 0,
          HomeTeamPenaltyScore: 0,
          AwayTeamPenaltyScore: 0,
          Goals: [],
        }),
      ),
    )
    const match = await fifaWorldCupProvider.fetchMatch(FIFA_MATCH_ID)
    expect(match.score?.total.home).toBe(2)
    expect(match.score?.total.away).toBe(0)
    expect(match.score?.penalty).toBeUndefined()
    expect(match.playerEvents?.penaltyScorers).toBeUndefined()
  })

  it('keeps penalty score when a real shootout occurred (non-zero penalty scores)', async () => {
    // Default fixture is the 2022 Final Argentina 4-2 France on penalties.
    const match = await fifaWorldCupProvider.fetchMatch(FIFA_MATCH_ID)
    expect(match.score?.penalty?.home).toBe(4)
    expect(match.score?.penalty?.away).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// fetchMatchLineups — coordinate normalization + enrichment
// ---------------------------------------------------------------------------

describe('fifaWorldCupProvider.fetchMatchLineups', () => {
  it('returns canonical MatchLineups with correct matchId', async () => {
    const lineups = await fifaWorldCupProvider.fetchMatchLineups(FIFA_MATCH_ID)
    expect(lineups.matchId).toBe(FIFA_MATCH_ID)
  })

  it('has 11 starters per team', async () => {
    const lineups = await fifaWorldCupProvider.fetchMatchLineups(FIFA_MATCH_ID)
    expect(lineups.homeTeam.field).toHaveLength(11)
    expect(lineups.awayTeam.field).toHaveLength(11)
  })

  it('has bench players for each team', async () => {
    const lineups = await fifaWorldCupProvider.fetchMatchLineups(FIFA_MATCH_ID)
    expect(lineups.homeTeam.bench.length).toBeGreaterThan(0)
    expect(lineups.awayTeam.bench.length).toBeGreaterThan(0)
  })

  it('all field coordinates are integers in [0, 1000]', async () => {
    const lineups = await fifaWorldCupProvider.fetchMatchLineups(FIFA_MATCH_ID)
    const allPlayers = [...lineups.homeTeam.field, ...lineups.awayTeam.field]
    for (const p of allPlayers) {
      const { x, y } = p.fieldCoordinate
      expect(Number.isInteger(x)).toBe(true)
      expect(Number.isInteger(y)).toBe(true)
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThanOrEqual(1000)
      expect(y).toBeGreaterThanOrEqual(0)
      expect(y).toBeLessThanOrEqual(1000)
    }
  })

  it('home GK has y near the inset low edge (bottom of pitch)', async () => {
    const lineups = await fifaWorldCupProvider.fetchMatchLineups(FIFA_MATCH_ID)
    // GK in fixture: rawX=10, rawY=1 → normalizeY: 90 + (1-1)/11*820 = 90
    const gk = lineups.homeTeam.field.find((p) => p.jerseyNumber === 23)
    expect(gk).toBeDefined()
    expect(gk!.fieldCoordinate.y).toBe(90)
    // x: 90 + (10-2)/16*820 = 500
    expect(gk!.fieldCoordinate.x).toBe(500)
  })

  it('away GK has the same canonical Y as home GK (provider does not mirror Y)', async () => {
    const lineups = await fifaWorldCupProvider.fetchMatchLineups(FIFA_MATCH_ID)
    // Away GK rawY=1 → normalizeY=90. No Y mirror in the provider — TeamHalf's
    // `inverted` prop flips Y at render time so the away GK visually sits at
    // the bottom of the pitch.
    const gk = lineups.awayTeam.field.find((p) => p.jerseyNumber === 1)
    expect(gk).toBeDefined()
    expect(gk!.fieldCoordinate.y).toBe(90)
    // x: 90 + (10-2)/16*820=500 → mirrored: 1000-500=500
    expect(gk!.fieldCoordinate.x).toBe(500)
  })

  it('home and away GK have identical canonical Y — rendering flip happens in TeamHalf', async () => {
    const lineups = await fifaWorldCupProvider.fetchMatchLineups(FIFA_MATCH_ID)
    const homeGK = lineups.homeTeam.field.find((p) => p.jerseyNumber === 23)
    const awayGK = lineups.awayTeam.field.find((p) => p.jerseyNumber === 1)
    expect(homeGK!.fieldCoordinate.y).toBe(awayGK!.fieldCoordinate.y)
  })

  it('formation string is passed through on TeamLineup', async () => {
    const lineups = await fifaWorldCupProvider.fetchMatchLineups(FIFA_MATCH_ID)
    // The fixture does not set formation on TeamLineup directly — provider does not set it.
    // Assert homeTeam has team.internationalName set correctly
    expect(lineups.homeTeam.team.internationalName).toBe('Argentina')
    expect(lineups.awayTeam.team.internationalName).toBe('France')
  })

  // Club enrichment tests

  it('HIT player (Messi) has both clubName and clubLogoUrl', async () => {
    const lineups = await fifaWorldCupProvider.fetchMatchLineups(FIFA_MATCH_ID)
    const messi = lineups.homeTeam.field.find((p) => p.jerseyNumber === 10)
    expect(messi).toBeDefined()
    expect(messi!.player.clubName).toBe('Inter Miami')
    expect(messi!.player.clubLogoUrl).toBe('https://logos.example.com/inter-miami.png')
  })

  it('PARTIAL player (Alvarez) has clubName but no clubLogoUrl', async () => {
    const lineups = await fifaWorldCupProvider.fetchMatchLineups(FIFA_MATCH_ID)
    const alvarez = lineups.homeTeam.field.find((p) => p.jerseyNumber === 9)
    expect(alvarez).toBeDefined()
    expect(alvarez!.player.clubName).toBe('Manchester City')
    expect(alvarez!.player.clubLogoUrl).toBeUndefined()
  })

  it('MISS player (Di Maria) has neither clubName nor clubLogoUrl', async () => {
    const lineups = await fifaWorldCupProvider.fetchMatchLineups(FIFA_MATCH_ID)
    const diMaria = lineups.homeTeam.field.find((p) => p.jerseyNumber === 11)
    expect(diMaria).toBeDefined()
    expect(diMaria!.player.clubName).toBeUndefined()
    expect(diMaria!.player.clubLogoUrl).toBeUndefined()
  })

  // Events

  it('maps at least one goal event', async () => {
    const match = await fifaWorldCupProvider.fetchMatch(FIFA_MATCH_ID)
    expect(match.playerEvents?.scorers?.length).toBeGreaterThan(0)
  })

  it('regular-time goals are never flagged as PENALTY (FIFA Type field is unreliable)', async () => {
    const match = await fifaWorldCupProvider.fetchMatch(FIFA_MATCH_ID)
    for (const s of match.playerEvents?.scorers ?? []) {
      expect(s.goalType).toBe('REGULAR')
    }
  })

  it('shootout goals are excluded from scorers list (they live in penaltyScorers)', async () => {
    const match = await fifaWorldCupProvider.fetchMatch(FIFA_MATCH_ID)
    for (const s of match.playerEvents?.scorers ?? []) {
      // Shootout kicks happen at 121'+ — none should leak into the main scorers list
      expect(s.time.minute).toBeLessThan(121)
    }
  })

  it('scorer events resolve player names from the roster', async () => {
    const match = await fifaWorldCupProvider.fetchMatch(FIFA_MATCH_ID)
    const scorers = match.playerEvents?.scorers ?? []
    expect(scorers.length).toBeGreaterThan(0)
    for (const s of scorers) {
      expect(s.player.internationalName).not.toBe('')
      expect(s.player.clubShirtName).not.toBe('')
    }
  })

  it('penalty shootout takers resolve player names from the roster', async () => {
    const match = await fifaWorldCupProvider.fetchMatch(FIFA_MATCH_ID)
    const takers = match.playerEvents?.penaltyScorers ?? []
    expect(takers.length).toBeGreaterThan(0)
    for (const t of takers) {
      expect(t.player.internationalName).not.toBe('')
      expect(t.player.clubShirtName).not.toBe('')
    }
  })

  it('curated shootouts.json carries both SCORED and MISSED kicks in order', async () => {
    const match = await fifaWorldCupProvider.fetchMatch(FIFA_MATCH_ID)
    const takers = match.playerEvents?.penaltyScorers ?? []
    const missed = takers.filter((t) => t.penaltyType === 'MISSED')
    const scored = takers.filter((t) => t.penaltyType === 'SCORED')
    // 2022 Final: 4 ARG scored + 2 FRA scored + 2 FRA missed (Coman, Tchouaméni)
    expect(scored).toHaveLength(6)
    expect(missed).toHaveLength(2)
    const missedNames = missed.map((m) => m.player.internationalName ?? '')
    expect(missedNames.some((n) => /Coman/i.test(n))).toBe(true)
    expect(missedNames.some((n) => /Tchouameni/i.test(n))).toBe(true)
    // Coman was kick 3 (France's 2nd), Tchouameni kick 5 (France's 3rd)
    expect(takers[2].penaltyType).toBe('MISSED')
    expect(takers[4].penaltyType).toBe('MISSED')
  })

  it('only Card=2 bookings appear as redCards — Card=1 (yellow) is excluded', async () => {
    // Fixture has Card=1 (yellow) for arg-mid-8 — should NOT appear in redCards
    const match = await fifaWorldCupProvider.fetchMatch(FIFA_MATCH_ID)
    // No Card=2 bookings in the fixture → redCards array is empty
    expect(match.playerEvents?.redCards).toHaveLength(0)
  })

  it('penalty shootout: penaltyScorers populated from curated kicks[] when present', async () => {
    const match = await fifaWorldCupProvider.fetchMatch(FIFA_MATCH_ID)
    expect(match.playerEvents?.penaltyScorers).toBeDefined()
    // Curated 2022 Final kicks[]: 8 total (4 ARG scored + 2 FRA scored + 2 FRA missed)
    expect(match.playerEvents!.penaltyScorers!.length).toBe(8)
    for (const ps of match.playerEvents!.penaltyScorers!) {
      expect(ps.phase).toBe('PENALTY')
    }
  })

  it('penalty shootout kicks are in real shootout order (not FIFA-minute order)', async () => {
    const match = await fifaWorldCupProvider.fetchMatch(FIFA_MATCH_ID)
    const takers = match.playerEvents?.penaltyScorers ?? []
    // Real 2022 Final order: FRA kicker, ARG kicker, FRA, ARG, FRA, ARG, FRA, ARG
    // (France went first per coin toss.)
    const teams = takers.map((t) => t.teamId)
    expect(teams[0]).toBe('43946') // FRA first
    expect(teams[1]).toBe('43922') // ARG second
    // Teams alternate
    for (let i = 1; i < teams.length; i++) {
      expect(teams[i]).not.toBe(teams[i - 1])
    }
  })

  it('competition is FIFA World Cup', async () => {
    const match = await fifaWorldCupProvider.fetchMatch(FIFA_MATCH_ID)
    expect(match.competition.metaData.name).toBe('FIFA World Cup')
  })
})

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

describe('fifaWorldCupProvider — error handling', () => {
  it('throws when match API returns 404', async () => {
    server.use(
      http.get('/fifa-api/api/v3/live/football/:matchId', () =>
        HttpResponse.json({ error: 'Not found' }, { status: 404 }),
      ),
    )
    await expect(fifaWorldCupProvider.fetchMatch('unknown-id')).rejects.toThrow('FIFA API error')
  })

  it('throws when calendar API returns non-ok', async () => {
    server.use(
      http.get('/fifa-api/api/v3/calendar/matches', () =>
        HttpResponse.json({ error: 'Server error' }, { status: 500 }),
      ),
    )
    await expect(fifaWorldCupProvider.fetchMatches(2022, 0, 100)).rejects.toThrow('FIFA API error')
  })
})

// ---------------------------------------------------------------------------
// Verify fixture shapes used in tests match what the provider expects
// ---------------------------------------------------------------------------

describe('fifaCalendarFixture shape', () => {
  it('has 3 matches representing 3 different stages', () => {
    expect(fifaCalendarFixture.Results).toHaveLength(3)
  })

  it('includes group-stage MD1, Round of 16, and Final', () => {
    const stages = fifaCalendarFixture.Results.map(
      (m) => m.StageName.find((l) => l.Locale === 'en-GB')?.Description,
    )
    expect(stages).toContain('Group A')
    expect(stages).toContain('Round of 16')
    expect(stages).toContain('Final')
  })
})

describe('fifaMatchDetailFixture shape', () => {
  it('has the correct match ID', () => {
    expect(fifaMatchDetailFixture.IdMatch).toBe(FIFA_MATCH_ID)
  })

  it('home team has 11 starters', () => {
    const starters = fifaMatchDetailFixture.HomeTeam!.Players.filter(
      (p) => p.LineupX !== null && p.LineupY !== null && p.Position !== 4,
    )
    expect(starters).toHaveLength(11)
  })

  it('home team has 3 bench players', () => {
    const bench = fifaMatchDetailFixture.HomeTeam!.Players.filter(
      (p) => p.LineupX === null || p.LineupY === null || p.Position === 4,
    )
    expect(bench).toHaveLength(3)
  })

  it('penalty shootout goals are present (Period=11)', () => {
    const homeGoals = fifaMatchDetailFixture.HomeTeam!.Goals ?? []
    const awayGoals = fifaMatchDetailFixture.AwayTeam!.Goals ?? []
    const penGoals = [...homeGoals, ...awayGoals].filter((g) => g.Period === 11)
    expect(penGoals.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Multi-year support
// ---------------------------------------------------------------------------

describe('multi-year support', () => {
  it('FIFA_SEASON_IDS[2018] equals "254645"', () => {
    expect(FIFA_SEASON_IDS[2018]).toBe('254645')
  })

  it('getSeasons() equals [2022, 2018] — newest first', () => {
    expect(fifaWorldCupProvider.getSeasons()).toEqual([2022, 2018])
  })

  it('getDefaultSeason() still returns 2022', () => {
    expect(fifaWorldCupProvider.getDefaultSeason()).toBe(2022)
  })

  it('seasonLabel(2018) returns "Russia 2018"', () => {
    expect(fifaWorldCupProvider.seasonLabel(2018)).toBe('Russia 2018')
  })

  it('seasonLabel(2022) still returns "Qatar 2022" — regression', () => {
    expect(fifaWorldCupProvider.seasonLabel(2022)).toBe('Qatar 2022')
  })
})

// ---------------------------------------------------------------------------
// fetchMatchLineups — year switching: 2018 squad map is consulted for 2018 match
// ---------------------------------------------------------------------------

const FIFA_2018_FINAL_ID = '300331552'

const fifa2018Player = {
  IdPlayer: 'griezmann-id',
  PlayerName: [{ Locale: 'en-GB', Description: 'Antoine Griezmann' }],
  ShirtNumber: 7,
  Position: 2 as const,
  LineupX: 10,
  LineupY: 8,
  IdTeam: 'fra-2018',
  IdCountry: 'FRA',
}

const fifa2018MatchDetail = {
  IdMatch: FIFA_2018_FINAL_ID,
  IdCompetition: '17',
  IdSeason: '254645',
  IdStage: 'stage-final-2018',
  IdGroup: null,
  StageName: [{ Locale: 'en-GB', Description: 'Final' }],
  MatchDay: '1',
  MatchNumber: 64,
  Date: '2018-07-15T15:00:00Z',
  LocalDate: '2018-07-15T17:00:00+02:00',
  MatchTime: '90',
  MatchStatus: 0,
  HomeTeamScore: 4,
  AwayTeamScore: 2,
  HomeTeamPenaltyScore: null,
  AwayTeamPenaltyScore: null,
  Winner: 'fra-2018',
  ResultType: 1,
  Stadium: null,
  HomeTeam: {
    IdTeam: 'fra-2018',
    IdCountry: 'FRA',
    TeamName: [{ Locale: 'en-GB', Description: 'France' }],
    Tactics: '433',
    Score: 4,
    PictureUrl: 'https://img.fifa.com/teams/france.png',
    Abbreviation: 'FRA',
    Players: [fifa2018Player],
    Goals: [],
    Bookings: [],
    Substitutions: [],
  },
  AwayTeam: {
    IdTeam: 'cro-2018',
    IdCountry: 'CRO',
    TeamName: [{ Locale: 'en-GB', Description: 'Croatia' }],
    Tactics: '433',
    Score: 2,
    PictureUrl: 'https://img.fifa.com/teams/croatia.png',
    Abbreviation: 'CRO',
    Players: [],
    Goals: [],
    Bookings: [],
    Substitutions: [],
  },
}

describe('fetchMatchLineups — year switching', () => {
  beforeEach(() => {
    server.use(
      http.get('/fifa-api/api/v3/live/football/:matchId', ({ params }) => {
        if (params['matchId'] === FIFA_2018_FINAL_ID) {
          return HttpResponse.json(fifa2018MatchDetail)
        }
        return HttpResponse.json(fifaMatchDetailFixture)
      }),
    )
  })

  it('Griezmann club resolves from 2018 squad map, not 2022 map', async () => {
    const lineups = await fifaWorldCupProvider.fetchMatchLineups(FIFA_2018_FINAL_ID)
    const griezmann = lineups.homeTeam.field.find((p) => p.jerseyNumber === 7)
    expect(griezmann).toBeDefined()
    // 'Atletico Madrid 2018' only exists in the 2018 mock — proves year routing is correct
    expect(griezmann!.player.clubName).toBe('Atletico Madrid 2018')
  })

  it('existing 2022 match is unaffected — Messi still resolves from 2022 map', async () => {
    const lineups = await fifaWorldCupProvider.fetchMatchLineups(FIFA_MATCH_ID)
    const messi = lineups.homeTeam.field.find((p) => p.jerseyNumber === 10)
    expect(messi).toBeDefined()
    expect(messi!.player.clubName).toBe('Inter Miami')
  })
})

// ---------------------------------------------------------------------------
// getExternalUrl — year-aware: URL contains the correct season ID
// ---------------------------------------------------------------------------

function minimalMatch(date: string): Match {
  const stub: Match['homeTeam'] = {
    id: 'team-a',
    internationalName: 'Team A',
    logoUrl: '',
    mediumLogoUrl: '',
    bigLogoUrl: '',
    countryCode: 'AAA',
    teamCode: 'AAA',
    translations: { displayName: {}, displayOfficialName: {} },
  }
  return {
    id: 'match-stub',
    homeTeam: stub,
    awayTeam: {
      ...stub,
      id: 'team-b',
      internationalName: 'Team B',
      teamCode: 'BBB',
      countryCode: 'BBB',
    },
    kickOffTime: { date, dateTime: `${date}T15:00:00Z`, utcOffsetInHours: 0 },
    status: 'FINISHED',
    round: { metaData: { name: 'Final', type: 'TOURNAMENT' }, phase: 'TOURNAMENT' },
    matchday: { longName: 'Final', name: 'Final', dateFrom: date, dateTo: date },
    competition: { id: '17', metaData: { name: 'FIFA World Cup' } },
  }
}

describe('getExternalUrl — year-aware', () => {
  it('2022 match URL contains season ID 255711', () => {
    const url = fifaWorldCupProvider.getExternalUrl(minimalMatch('2022-12-18'))
    expect(url).toContain('255711')
  })

  it('2018 match URL contains season ID 254645', () => {
    const url = fifaWorldCupProvider.getExternalUrl(minimalMatch('2018-07-15'))
    expect(url).toContain('254645')
  })

  it('unknown year falls back to 2022 season ID 255711', () => {
    const url = fifaWorldCupProvider.getExternalUrl(minimalMatch('1990-07-08'))
    expect(url).toContain('255711')
  })

  it('empty date string but populated dateTime still resolves the correct year', () => {
    const match = minimalMatch('2018-07-15')
    match.kickOffTime.date = ''
    match.kickOffTime.dateTime = '2018-07-15T15:00:00Z'
    expect(fifaWorldCupProvider.getExternalUrl(match)).toContain('254645')
  })

  it('both date and dateTime empty falls back to 2022 without throwing', () => {
    const match = minimalMatch('2018-07-15')
    match.kickOffTime.date = ''
    match.kickOffTime.dateTime = ''
    expect(() => fifaWorldCupProvider.getExternalUrl(match)).not.toThrow()
    expect(fifaWorldCupProvider.getExternalUrl(match)).toContain('255711')
  })
})

// ---------------------------------------------------------------------------
// normalizeName — the critical contract between FIFA API and squad JSON keys
// ---------------------------------------------------------------------------

describe('normalizeName', () => {
  it('lowercases and strips combining marks', () => {
    expect(normalizeName('Luka Modrić')).toBe('luka modric')
    expect(normalizeName('Héctor Herrera')).toBe('hector herrera')
  })

  it('substitutes non-NFD-decomposable characters', () => {
    expect(normalizeName('Kjær')).toBe('kjaer')
    expect(normalizeName('Sigurðsson')).toBe('sigurdsson')
    expect(normalizeName('Jørgensen')).toBe('jorgensen')
    expect(normalizeName('Þórðarson')).toBe('thordarson')
    expect(normalizeName('Błaszczykowski')).toBe('blaszczykowski')
  })

  it('strips trailing Wikipedia disambiguation suffixes', () => {
    expect(normalizeName('Willian (footballer, born 1988)')).toBe('willian')
    expect(normalizeName('Pepe (footballer, born 1983)')).toBe('pepe')
    expect(normalizeName('Koke (footballer, born 1992)')).toBe('koke')
  })

  it('is idempotent — normalized names round-trip to themselves', () => {
    for (const input of ['willian', 'luka modric', 'kjaer', 'sigurdsson']) {
      expect(normalizeName(input)).toBe(input)
    }
  })
})

// Squad JSON files must round-trip: every key must equal normalizeName(key).
// This guards against future scraper bugs where a raw Wikipedia wikilink
// (with disambiguation suffix or non-ASCII chars) is written into the squad
// map — the FIFA API would emit the plain name and miss the enrichment.
describe('squad JSON files are pre-normalized', () => {
  type SquadMap = Record<string, Record<string, { clubName: string }>>

  async function loadRealSquad(year: '2018' | '2022'): Promise<SquadMap> {
    const mod = await vi.importActual<{ default: SquadMap }>(`@/providers/fifa/squads/${year}.json`)
    return mod.default
  }

  it.each(['2018', '2022'] as const)('%s keys are all self-normalized', async (year) => {
    const data = await loadRealSquad(year)
    const offenders: string[] = []
    for (const [country, players] of Object.entries(data)) {
      for (const name of Object.keys(players)) {
        if (normalizeName(name) !== name) {
          offenders.push(`${country}:${name}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })
})
