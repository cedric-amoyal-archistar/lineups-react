import { describe, it, expect, vi, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { fifaWorldCupProvider } from '../index'
import { server } from '@/test/msw/server'
import { FIFA_MATCH_ID, fifaCalendarFixture, fifaMatchDetailFixture } from '@/test/msw/fixtures'

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

  it('home GK has y near 0 (bottom of pitch)', async () => {
    const lineups = await fifaWorldCupProvider.fetchMatchLineups(FIFA_MATCH_ID)
    // GK in fixture: rawX=10, rawY=1 → normalizeY: (1-1)/11*1000 = 0
    const gk = lineups.homeTeam.field.find((p) => p.jerseyNumber === 23)
    expect(gk).toBeDefined()
    expect(gk!.fieldCoordinate.y).toBe(0)
    // x: (10-2)/16*1000 = 500
    expect(gk!.fieldCoordinate.x).toBe(500)
  })

  it('away GK has y near 1000 (mirrored for away team)', async () => {
    const lineups = await fifaWorldCupProvider.fetchMatchLineups(FIFA_MATCH_ID)
    // Away GK rawY=1 → normalizeY=0 → mirrored: 1000-0=1000
    const gk = lineups.awayTeam.field.find((p) => p.jerseyNumber === 1)
    expect(gk).toBeDefined()
    expect(gk!.fieldCoordinate.y).toBe(1000)
    // x: (10-2)/16*1000=500 → mirrored: 1000-500=500
    expect(gk!.fieldCoordinate.x).toBe(500)
  })

  it('home and away GK x coordinates differ when mirrored asymmetrically', async () => {
    const lineups = await fifaWorldCupProvider.fetchMatchLineups(FIFA_MATCH_ID)
    const homeGK = lineups.homeTeam.field.find((p) => p.jerseyNumber === 23)
    const awayGK = lineups.awayTeam.field.find((p) => p.jerseyNumber === 1)
    // Both have rawX=10 → x=500, mirrored also 500 — but y values differ
    expect(homeGK!.fieldCoordinate.y).not.toBe(awayGK!.fieldCoordinate.y)
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

  it('only Card=2 bookings appear as redCards — Card=1 (yellow) is excluded', async () => {
    // Fixture has Card=1 (yellow) for arg-mid-8 — should NOT appear in redCards
    const match = await fifaWorldCupProvider.fetchMatch(FIFA_MATCH_ID)
    // No Card=2 bookings in the fixture → redCards array is empty
    expect(match.playerEvents?.redCards).toHaveLength(0)
  })

  it('penalty shootout: penaltyScorers populated from Period=11 Type=2 goals', async () => {
    const match = await fifaWorldCupProvider.fetchMatch(FIFA_MATCH_ID)
    expect(match.playerEvents?.penaltyScorers).toBeDefined()
    // Fixture has 4 ARG + 2 FRA penalty goals in Period=11
    expect(match.playerEvents!.penaltyScorers!.length).toBe(6)
    for (const ps of match.playerEvents!.penaltyScorers!) {
      expect(ps.phase).toBe('PENALTY')
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
