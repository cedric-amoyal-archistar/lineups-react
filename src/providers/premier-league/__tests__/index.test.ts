import { describe, it, expect } from 'vitest'
import { premierLeagueProvider } from '../index'
import { PL_MATCH_ID, plMatchListFixture, plLineupsFixture } from '@/test/msw/fixtures'

// MSW server is started globally via src/test/setup.ts

describe('premierLeagueProvider', () => {
  // ---------------------------------------------------------------------------
  // Provider metadata
  // ---------------------------------------------------------------------------

  it('has paginationMode "gameweek"', () => {
    expect(premierLeagueProvider.paginationMode).toBe('gameweek')
  })

  it('returns descending season years from getSeasons()', () => {
    const seasons = premierLeagueProvider.getSeasons()
    expect(seasons[0]).toBeGreaterThanOrEqual(2025)
    expect(seasons[seasons.length - 1]).toBe(2008)
    for (let i = 1; i < seasons.length; i++) {
      expect(seasons[i]).toBeLessThan(seasons[i - 1])
    }
  })

  it('formats season label correctly', () => {
    expect(premierLeagueProvider.seasonLabel(2024)).toBe('2024/25')
    expect(premierLeagueProvider.seasonLabel(2025)).toBe('2025/26')
  })

  it('builds correct external URL', () => {
    const url = premierLeagueProvider.getExternalUrl({ id: '2562195' } as Parameters<
      typeof premierLeagueProvider.getExternalUrl
    >[0])
    expect(url).toBe('https://www.premierleague.com/en/match/2562195')
  })

  // ---------------------------------------------------------------------------
  // fetchMatchesByGameweek — match list mapping
  // ---------------------------------------------------------------------------

  describe('fetchMatchesByGameweek', () => {
    it('returns canonical Match array', async () => {
      const matches = await premierLeagueProvider.fetchMatchesByGameweek!(2025, 31)
      expect(matches).toHaveLength(plMatchListFixture.data.length)
    })

    it('preserves string match IDs', async () => {
      const matches = await premierLeagueProvider.fetchMatchesByGameweek!(2025, 31)
      expect(matches[0].id).toBe(PL_MATCH_ID)
      expect(typeof matches[0].id).toBe('string')
    })

    it('maps FullTime to FINISHED status', async () => {
      const matches = await premierLeagueProvider.fetchMatchesByGameweek!(2025, 31)
      expect(matches[0].status).toBe('FINISHED')
    })

    it('maps PreMatch to UPCOMING status', async () => {
      const matches = await premierLeagueProvider.fetchMatchesByGameweek!(2025, 31)
      expect(matches[1].status).toBe('UPCOMING')
    })

    it('includes score for finished matches', async () => {
      const matches = await premierLeagueProvider.fetchMatchesByGameweek!(2025, 31)
      expect(matches[0].score).toEqual({
        total: { home: 2, away: 2 },
        regular: { home: 2, away: 2 },
      })
    })

    it('has no score for upcoming matches', async () => {
      const matches = await premierLeagueProvider.fetchMatchesByGameweek!(2025, 31)
      expect(matches[1].score).toBeUndefined()
    })

    it('maps team identity correctly', async () => {
      const matches = await premierLeagueProvider.fetchMatchesByGameweek!(2025, 31)
      const home = matches[0].homeTeam
      expect(home.internationalName).toBe('Bournemouth')
      expect(home.teamCode).toBe('BOU')
      expect(home.logoUrl).toContain('t91')
    })

    it('generates correct badge URLs', async () => {
      const matches = await premierLeagueProvider.fetchMatchesByGameweek!(2025, 31)
      const home = matches[0].homeTeam
      expect(home.logoUrl).toBe(
        'https://resources.premierleague.com/premierleague/badges/50/t91.png',
      )
      expect(home.mediumLogoUrl).toBe(
        'https://resources.premierleague.com/premierleague/badges/100/t91.png',
      )
      expect(home.bigLogoUrl).toBe(
        'https://resources.premierleague.com/premierleague/badges/rb/t91.svg',
      )
    })

    it('sets round name to "Matchday N"', async () => {
      const matches = await premierLeagueProvider.fetchMatchesByGameweek!(2025, 31)
      expect(matches[0].round.metaData.name).toBe('Matchday 31')
    })

    it('sets competition name to Premier League', async () => {
      const matches = await premierLeagueProvider.fetchMatchesByGameweek!(2025, 31)
      expect(matches[0].competition.metaData.name).toBe('Premier League')
    })

    it('parses ground into stadium', async () => {
      const matches = await premierLeagueProvider.fetchMatchesByGameweek!(2025, 31)
      expect(matches[0].stadium?.translations.officialName?.EN).toBe('Vitality Stadium')
      expect(matches[0].stadium?.city.translations.name.EN).toBe('Bournemouth')
    })
  })

  // ---------------------------------------------------------------------------
  // fetchMatch — match detail mapping
  // ---------------------------------------------------------------------------

  describe('fetchMatch', () => {
    it('returns canonical Match with scorers', async () => {
      const match = await premierLeagueProvider.fetchMatch(PL_MATCH_ID)
      expect(match.id).toBe(PL_MATCH_ID)
      expect(match.playerEvents?.scorers).toBeDefined()
      expect(match.playerEvents!.scorers!.length).toBeGreaterThan(0)
    })

    it('maps goal types correctly', async () => {
      const match = await premierLeagueProvider.fetchMatch(PL_MATCH_ID)
      const scorers = match.playerEvents!.scorers!
      const regular = scorers.find((s) => s.goalType === 'REGULAR')
      const penalty = scorers.find((s) => s.goalType === 'PENALTY')
      const ownGoal = scorers.find((s) => s.goalType === 'OWN_GOAL')
      expect(regular).toBeDefined()
      expect(penalty).toBeDefined()
      expect(ownGoal).toBeDefined()
    })

    it('sorts scorers by minute', async () => {
      const match = await premierLeagueProvider.fetchMatch(PL_MATCH_ID)
      const scorers = match.playerEvents!.scorers!
      for (let i = 1; i < scorers.length; i++) {
        expect(scorers[i].time.minute).toBeGreaterThanOrEqual(scorers[i - 1].time.minute)
      }
    })

    it('resolves player names from lineups data', async () => {
      const match = await premierLeagueProvider.fetchMatch(PL_MATCH_ID)
      const scorers = match.playerEvents!.scorers!
      // Bruno Fernandes scored a penalty — should use knownName
      const bruno = scorers.find((s) => s.player.internationalName.includes('Bruno'))
      expect(bruno).toBeDefined()
    })

    it('includes red cards in playerEvents', async () => {
      const match = await premierLeagueProvider.fetchMatch(PL_MATCH_ID)
      expect(match.playerEvents?.redCards).toBeDefined()
      expect(match.playerEvents!.redCards!.length).toBe(1)
    })

    it('maps stadium from ground string', async () => {
      const match = await premierLeagueProvider.fetchMatch(PL_MATCH_ID)
      expect(match.stadium?.translations.officialName?.EN).toBe('Vitality Stadium')
    })
  })

  // ---------------------------------------------------------------------------
  // fetchMatchLineups — lineup mapping
  // ---------------------------------------------------------------------------

  describe('fetchMatchLineups', () => {
    it('returns canonical MatchLineups', async () => {
      const lineups = await premierLeagueProvider.fetchMatchLineups(PL_MATCH_ID)
      expect(lineups.matchId).toBe(PL_MATCH_ID)
      expect(lineups.homeTeam).toBeDefined()
      expect(lineups.awayTeam).toBeDefined()
    })

    it('splits starters into field and subs into bench', async () => {
      const lineups = await premierLeagueProvider.fetchMatchLineups(PL_MATCH_ID)
      expect(lineups.homeTeam.field).toHaveLength(11)
      expect(lineups.homeTeam.bench).toHaveLength(2)
    })

    it('assigns coordinates from formation mapping', async () => {
      const lineups = await premierLeagueProvider.fetchMatchLineups(PL_MATCH_ID)
      for (const player of lineups.homeTeam.field) {
        expect(player.fieldCoordinate.x).toBeGreaterThanOrEqual(0)
        expect(player.fieldCoordinate.x).toBeLessThanOrEqual(1000)
        expect(player.fieldCoordinate.y).toBeGreaterThanOrEqual(0)
        expect(player.fieldCoordinate.y).toBeLessThanOrEqual(1000)
      }
    })

    it('maps position strings to field position constants', async () => {
      const lineups = await premierLeagueProvider.fetchMatchLineups(PL_MATCH_ID)
      const gk = lineups.homeTeam.field.find((p) => p.jerseyNumber === 1)
      const def = lineups.homeTeam.field.find((p) => p.jerseyNumber === 15)
      const mid = lineups.homeTeam.field.find((p) => p.jerseyNumber === 10)
      const fwd = lineups.homeTeam.field.find((p) => p.jerseyNumber === 9)
      expect(gk?.type).toBe('GOALKEEPER')
      expect(def?.type).toBe('DEFENDER')
      expect(mid?.type).toBe('MIDFIELDER')
      expect(fwd?.type).toBe('FORWARD')
    })

    it('prefers knownName over firstName+lastName', async () => {
      const lineups = await premierLeagueProvider.fetchMatchLineups(PL_MATCH_ID)
      // Evanilson has knownName in home team
      const evanilson = lineups.homeTeam.field.find((p) => p.jerseyNumber === 9)
      expect(evanilson?.player.internationalName).toBe('Evanilson')
      expect(evanilson?.player.clubShirtName).toBe('Evanilson')
      // Dalot has knownName "Diogo Dalot" in away team
      const dalot = lineups.awayTeam.field.find((p) => p.jerseyNumber === 2)
      expect(dalot?.player.internationalName).toBe('Diogo Dalot')
    })

    it('marks booked players with isBooked', async () => {
      const lineups = await premierLeagueProvider.fetchMatchLineups(PL_MATCH_ID)
      // Adam Smith (551483) got a yellow card
      const smith = lineups.homeTeam.field.find((p) => p.jerseyNumber === 15)
      expect(smith?.isBooked).toBe(true)
      // Casemiro (61256) got a yellow card
      const casemiro = lineups.awayTeam.field.find((p) => p.player.internationalName === 'Casemiro')
      expect(casemiro?.isBooked).toBe(true)
      // Maguire (95658) got a red card
      const maguire = lineups.awayTeam.field.find((p) => p.jerseyNumber === 5)
      expect(maguire?.isBooked).toBe(true)
    })

    it('generates correct player image URLs', async () => {
      const lineups = await premierLeagueProvider.fetchMatchLineups(PL_MATCH_ID)
      const gk = lineups.homeTeam.field.find((p) => p.jerseyNumber === 1)
      expect(gk?.player.imageUrl).toBe(
        'https://resources.premierleague.com/premierleague25/photos/players/40x40/457569.png',
      )
    })

    it('generates correct team badge URLs', async () => {
      const lineups = await premierLeagueProvider.fetchMatchLineups(PL_MATCH_ID)
      expect(lineups.homeTeam.team.logoUrl).toContain('t91')
      expect(lineups.awayTeam.team.logoUrl).toContain('t1')
    })

    it('populates countryCode from squad data', async () => {
      const lineups = await premierLeagueProvider.fetchMatchLineups(PL_MATCH_ID)
      // Djordje Petrovic is Serbian (RS)
      const gk = lineups.homeTeam.field.find((p) => p.jerseyNumber === 1)
      expect(gk?.player.countryCode).toBe('RS')
      // Bruno Fernandes is Portuguese (PT)
      const bruno = lineups.awayTeam.field.find(
        (p) => p.player.internationalName === 'Bruno Fernandes',
      )
      expect(bruno?.player.countryCode).toBe('PT')
    })

    it('handles away team with different formation (433)', async () => {
      const lineups = await premierLeagueProvider.fetchMatchLineups(PL_MATCH_ID)
      expect(lineups.awayTeam.field).toHaveLength(11)
      expect(lineups.awayTeam.bench).toHaveLength(1)
    })

    it('references the correct fixture data shape', () => {
      // Ensure fixture has 11 starters + 2 subs for home team
      const homeStarters = plLineupsFixture.home_team.formation.lineup.flat()
      expect(homeStarters).toHaveLength(11)
      expect(plLineupsFixture.home_team.formation.subs).toHaveLength(2)
    })
  })

  // ---------------------------------------------------------------------------
  // Gameweek helpers
  // ---------------------------------------------------------------------------

  describe('getTotalGameweeks', () => {
    it('returns (numTeams - 1) * 2', async () => {
      const total = await premierLeagueProvider.getTotalGameweeks!(2025)
      expect(total).toBe(38) // 20 teams
    })
  })
})
