import { describe, it, expect } from 'vitest'
import { ligue1Provider } from '../index'
import { LIGUE1_MATCH_ID, ligue1MatchListFixture } from '@/test/msw/fixtures'

// MSW server is started globally via src/test/setup.ts

describe('ligue1Provider', () => {
  // ---------------------------------------------------------------------------
  // Provider metadata
  // ---------------------------------------------------------------------------

  it('has paginationMode "gameweek"', () => {
    expect(ligue1Provider.paginationMode).toBe('gameweek')
  })

  it('returns descending season years from getSeasons()', () => {
    const seasons = ligue1Provider.getSeasons()
    expect(seasons[0]).toBeGreaterThanOrEqual(2025)
    expect(seasons[seasons.length - 1]).toBe(2015)
    // Verify descending order
    for (let i = 1; i < seasons.length; i++) {
      expect(seasons[i]).toBeLessThan(seasons[i - 1])
    }
  })

  it('formats season label correctly', () => {
    expect(ligue1Provider.seasonLabel(2024)).toBe('2024/25')
    expect(ligue1Provider.seasonLabel(2025)).toBe('2025/26')
  })

  it('builds correct external URL', () => {
    const url = ligue1Provider.getExternalUrl({ id: 'l1_match_123' } as Parameters<
      typeof ligue1Provider.getExternalUrl
    >[0])
    expect(url).toBe('https://ligue1.com/fr/match-sheet/l1_match_123/summary')
  })

  // ---------------------------------------------------------------------------
  // fetchMatchesByGameweek — match list mapping
  // ---------------------------------------------------------------------------

  describe('fetchMatchesByGameweek', () => {
    it('returns canonical Match array', async () => {
      const matches = await ligue1Provider.fetchMatchesByGameweek!(2025, 28)
      expect(matches).toHaveLength(ligue1MatchListFixture.matches.length)
    })

    it('preserves string match IDs', async () => {
      const matches = await ligue1Provider.fetchMatchesByGameweek!(2025, 28)
      expect(matches[0].id).toBe(LIGUE1_MATCH_ID)
      expect(typeof matches[0].id).toBe('string')
    })

    it('maps fullTime to FINISHED status', async () => {
      const matches = await ligue1Provider.fetchMatchesByGameweek!(2025, 28)
      expect(matches[0].status).toBe('FINISHED')
    })

    it('maps preMatch to UPCOMING status', async () => {
      const matches = await ligue1Provider.fetchMatchesByGameweek!(2025, 28)
      expect(matches[1].status).toBe('UPCOMING')
    })

    it('includes score for finished matches', async () => {
      const matches = await ligue1Provider.fetchMatchesByGameweek!(2025, 28)
      expect(matches[0].score).toEqual({
        total: { home: 3, away: 1 },
        regular: { home: 3, away: 1 },
      })
    })

    it('has no score for upcoming matches', async () => {
      const matches = await ligue1Provider.fetchMatchesByGameweek!(2025, 28)
      expect(matches[1].score).toBeUndefined()
    })

    it('maps team identity correctly', async () => {
      const matches = await ligue1Provider.fetchMatchesByGameweek!(2025, 28)
      const home = matches[0].homeTeam
      expect(home.internationalName).toBe('Paris Saint-Germain')
      expect(home.teamCode).toBe('PSG')
      expect(home.logoUrl).toContain('PSG')
    })

    it('sets round name to "Matchday N"', async () => {
      const matches = await ligue1Provider.fetchMatchesByGameweek!(2025, 28)
      expect(matches[0].round.metaData.name).toBe('Matchday 28')
    })

    it('sets competition name to Ligue 1', async () => {
      const matches = await ligue1Provider.fetchMatchesByGameweek!(2025, 28)
      expect(matches[0].competition.metaData.name).toBe('Ligue 1')
    })
  })

  // ---------------------------------------------------------------------------
  // fetchMatch — match detail mapping
  // ---------------------------------------------------------------------------

  describe('fetchMatch', () => {
    it('returns canonical Match with scorers', async () => {
      const match = await ligue1Provider.fetchMatch(LIGUE1_MATCH_ID)
      expect(match.id).toBe(LIGUE1_MATCH_ID)
      expect(match.playerEvents?.scorers).toBeDefined()
      expect(match.playerEvents!.scorers!.length).toBeGreaterThan(0)
    })

    it('maps goal types correctly', async () => {
      const match = await ligue1Provider.fetchMatch(LIGUE1_MATCH_ID)
      const scorers = match.playerEvents!.scorers!
      const regular = scorers.find((s) => s.player.internationalName.includes('Dembele'))
      const penalty = scorers.find((s) => s.player.internationalName.includes('Kolo Muani'))
      expect(regular?.goalType).toBe('REGULAR')
      expect(penalty?.goalType).toBe('PENALTY')
    })

    it('sorts scorers by minute', async () => {
      const match = await ligue1Provider.fetchMatch(LIGUE1_MATCH_ID)
      const scorers = match.playerEvents!.scorers!
      for (let i = 1; i < scorers.length; i++) {
        expect(scorers[i].time.minute).toBeGreaterThanOrEqual(scorers[i - 1].time.minute)
      }
    })

    it('maps stadium when present', async () => {
      const match = await ligue1Provider.fetchMatch(LIGUE1_MATCH_ID)
      expect(match.stadium?.translations.officialName?.EN).toBe('PARC DES PRINCES')
    })

    it('includes red cards in playerEvents', async () => {
      const match = await ligue1Provider.fetchMatch(LIGUE1_MATCH_ID)
      expect(match.playerEvents?.redCards).toBeDefined()
      // Our fixture has one red card for p12
      expect(match.playerEvents!.redCards!.length).toBe(1)
      expect(match.playerEvents!.redCards![0].player.internationalName).toContain('Navas')
    })
  })

  // ---------------------------------------------------------------------------
  // fetchMatchLineups — lineup mapping
  // ---------------------------------------------------------------------------

  describe('fetchMatchLineups', () => {
    it('returns canonical MatchLineups', async () => {
      const lineups = await ligue1Provider.fetchMatchLineups(LIGUE1_MATCH_ID)
      expect(lineups.matchId).toBe(LIGUE1_MATCH_ID)
      expect(lineups.homeTeam).toBeDefined()
      expect(lineups.awayTeam).toBeDefined()
    })

    it('splits starters into field and subs into bench', async () => {
      const lineups = await ligue1Provider.fetchMatchLineups(LIGUE1_MATCH_ID)
      expect(lineups.homeTeam.field).toHaveLength(11)
      expect(lineups.homeTeam.bench).toHaveLength(1) // p12
    })

    it('assigns coordinates from formation mapping', async () => {
      const lineups = await ligue1Provider.fetchMatchLineups(LIGUE1_MATCH_ID)
      for (const player of lineups.homeTeam.field) {
        expect(player.fieldCoordinate.x).toBeGreaterThanOrEqual(0)
        expect(player.fieldCoordinate.x).toBeLessThanOrEqual(1000)
        expect(player.fieldCoordinate.y).toBeGreaterThanOrEqual(0)
        expect(player.fieldCoordinate.y).toBeLessThanOrEqual(1000)
      }
    })

    it('maps position numbers to field position strings', async () => {
      const lineups = await ligue1Provider.fetchMatchLineups(LIGUE1_MATCH_ID)
      const gk = lineups.homeTeam.field.find((p) => p.jerseyNumber === 1)
      const def = lineups.homeTeam.field.find((p) => p.jerseyNumber === 2)
      const mid = lineups.homeTeam.field.find((p) => p.jerseyNumber === 33)
      const fwd = lineups.homeTeam.field.find((p) => p.jerseyNumber === 10)
      expect(gk?.type).toBe('GOALKEEPER')
      expect(def?.type).toBe('DEFENDER')
      expect(mid?.type).toBe('MIDFIELDER')
      expect(fwd?.type).toBe('FORWARD')
    })

    it('maps player names correctly', async () => {
      const lineups = await ligue1Provider.fetchMatchLineups(LIGUE1_MATCH_ID)
      const dembele = lineups.homeTeam.field.find((p) => p.jerseyNumber === 10)
      expect(dembele?.player.internationalName).toBe('Ousmane Dembele')
      expect(dembele?.player.clubShirtName).toBe('Dembele')
    })

    it('marks booked players with isBooked', async () => {
      const lineups = await ligue1Provider.fetchMatchLineups(LIGUE1_MATCH_ID)
      const zaire = lineups.homeTeam.field.find((p) => p.jerseyNumber === 33)
      expect(zaire?.isBooked).toBe(true)
      // Bench player with red card
      const navas = lineups.homeTeam.bench.find((p) => p.jerseyNumber === 30)
      expect(navas?.isBooked).toBe(true)
    })

    it('maps coach from manager data', async () => {
      const lineups = await ligue1Provider.fetchMatchLineups(LIGUE1_MATCH_ID)
      const coach = lineups.homeTeam.coaches?.[0]
      expect(coach?.person.translations.name.EN).toBe('Luis Enrique Martinez')
    })

    it('handles away team with different formation (3421)', async () => {
      const lineups = await ligue1Provider.fetchMatchLineups(LIGUE1_MATCH_ID)
      expect(lineups.awayTeam.field).toHaveLength(11)
      expect(lineups.awayTeam.bench).toHaveLength(1)
    })
  })

  // ---------------------------------------------------------------------------
  // Gameweek helpers
  // ---------------------------------------------------------------------------

  describe('getDefaultGameweek', () => {
    it('returns the max played value from standings', async () => {
      const gw = await ligue1Provider.getDefaultGameweek!(2025)
      expect(gw).toBe(28) // 10 teams with 28, 8 with 27
    })
  })

  describe('getTotalGameweeks', () => {
    it('returns (numTeams - 1) * 2', async () => {
      const total = await ligue1Provider.getTotalGameweeks!(2025)
      expect(total).toBe(34) // 18 teams
    })
  })
})
