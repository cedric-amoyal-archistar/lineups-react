import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { uefaUclProvider } from '../index'
import { server } from '@/test/msw/server'
import { MATCH_ID, lineupsFixture } from '@/test/msw/fixtures'

// MSW server is started globally via src/test/setup.ts

// ---------------------------------------------------------------------------
// Raw UEFA API fixture shapes — these reflect the actual API response, NOT
// the canonical Match type. The minute field is an object {normal: N}.
// ---------------------------------------------------------------------------

const rawLiveMatch = {
  id: MATCH_ID,
  status: 'LIVE',
  minute: { normal: 86 },
  homeTeam: {
    id: 'h1',
    internationalName: 'Real Madrid',
    logoUrl: 'https://img.uefa.com/real.png',
    mediumLogoUrl: 'https://img.uefa.com/real-m.png',
    bigLogoUrl: 'https://img.uefa.com/real-l.png',
    countryCode: 'ESP',
    teamCode: 'RMA',
    translations: { displayName: {}, displayOfficialName: {} },
  },
  awayTeam: {
    id: 'a1',
    internationalName: 'FC Barcelona',
    logoUrl: 'https://img.uefa.com/barca.png',
    mediumLogoUrl: 'https://img.uefa.com/barca-m.png',
    bigLogoUrl: 'https://img.uefa.com/barca-l.png',
    countryCode: 'ESP',
    teamCode: 'BAR',
    translations: { displayName: {}, displayOfficialName: {} },
  },
  kickOffTime: { date: '2025-04-01', dateTime: '2025-04-01T19:00:00Z', utcOffsetInHours: 0 },
  score: { total: { home: 1, away: 0 }, regular: { home: 1, away: 0 } },
  round: { metaData: { name: 'Quarter-finals', type: 'KNOCKOUT' }, phase: 'KNOCKOUT' },
  matchday: { longName: 'Matchday 6', name: 'MD6', dateFrom: '', dateTo: '' },
  competition: { id: '1', metaData: { name: 'UEFA Champions League' } },
  type: 'FIRST_LEG',
}

const rawFinishedMatch = {
  ...rawLiveMatch,
  id: 9999999,
  status: 'FINISHED',
  minute: undefined,
  score: { total: { home: 2, away: 1 }, regular: { home: 2, away: 1 } },
}

const rawLiveMatchDetail = {
  ...rawLiveMatch,
  minute: { normal: 90 },
}

describe('uefaUclProvider', () => {
  // ---------------------------------------------------------------------------
  // Provider metadata
  // ---------------------------------------------------------------------------

  it('has paginationMode "offset"', () => {
    expect(uefaUclProvider.paginationMode).toBe('offset')
  })

  it('returns descending season years from getSeasons()', () => {
    const seasons = uefaUclProvider.getSeasons()
    expect(seasons[0]).toBeGreaterThanOrEqual(2025)
    expect(seasons[seasons.length - 1]).toBe(1957)
    for (let i = 1; i < seasons.length; i++) {
      expect(seasons[i]).toBeLessThan(seasons[i - 1])
    }
  })

  it('formats season label correctly', () => {
    expect(uefaUclProvider.seasonLabel(2025)).toBe('2024/25')
    expect(uefaUclProvider.seasonLabel(2026)).toBe('2025/26')
    // Pre-2008 format
    expect(uefaUclProvider.seasonLabel(2007)).toBe('2007/08')
  })

  it('builds correct external URL', () => {
    const url = uefaUclProvider.getExternalUrl({
      id: MATCH_ID,
      homeTeam: { internationalName: 'Real Madrid' },
      awayTeam: { internationalName: 'FC Barcelona' },
    } as Parameters<typeof uefaUclProvider.getExternalUrl>[0])
    expect(url).toBe(
      `https://www.uefa.com/uefachampionsleague/match/${MATCH_ID}--real-madrid-vs-fc-barcelona/`,
    )
  })

  // ---------------------------------------------------------------------------
  // fetchMatches — minute mapping from raw API shape
  // ---------------------------------------------------------------------------

  describe('fetchMatches — minute mapping', () => {
    it('maps minute: {normal: 86} to plain number 86 for LIVE match', async () => {
      server.use(http.get('/uefa-api/v5/matches', () => HttpResponse.json([rawLiveMatch])))
      const matches = await uefaUclProvider.fetchMatches(2025, 0, 10)
      expect(matches[0].minute).toBe(86)
    })

    it('maps minute: undefined to undefined for FINISHED match', async () => {
      server.use(http.get('/uefa-api/v5/matches', () => HttpResponse.json([rawFinishedMatch])))
      const matches = await uefaUclProvider.fetchMatches(2025, 0, 10)
      expect(matches[0].minute).toBeUndefined()
    })

    it('maps minute as a plain number passthrough (defensive)', async () => {
      server.use(
        http.get('/uefa-api/v5/matches', () =>
          HttpResponse.json([{ ...rawLiveMatch, minute: 72 }]),
        ),
      )
      const matches = await uefaUclProvider.fetchMatches(2025, 0, 10)
      expect(matches[0].minute).toBe(72)
    })

    it('returns multiple matches preserving status', async () => {
      server.use(
        http.get('/uefa-api/v5/matches', () => HttpResponse.json([rawLiveMatch, rawFinishedMatch])),
      )
      const matches = await uefaUclProvider.fetchMatches(2025, 0, 10)
      expect(matches).toHaveLength(2)
      expect(matches[0].status).toBe('LIVE')
      expect(matches[1].status).toBe('FINISHED')
    })
  })

  // ---------------------------------------------------------------------------
  // fetchMatch — minute mapping from raw API shape
  // ---------------------------------------------------------------------------

  describe('fetchMatch — minute mapping', () => {
    it('maps minute: {normal: 90} to plain number 90', async () => {
      server.use(
        http.get(`/uefa-api/v5/matches/${MATCH_ID}`, () => HttpResponse.json(rawLiveMatchDetail)),
      )
      const match = await uefaUclProvider.fetchMatch(MATCH_ID)
      expect(match.minute).toBe(90)
    })

    it('maps minute: {normal: 45} to plain number 45', async () => {
      server.use(
        http.get(`/uefa-api/v5/matches/${MATCH_ID}`, () =>
          HttpResponse.json({ ...rawLiveMatch, minute: { normal: 45 } }),
        ),
      )
      const match = await uefaUclProvider.fetchMatch(MATCH_ID)
      expect(match.minute).toBe(45)
    })

    it('maps missing minute to undefined for FINISHED match', async () => {
      server.use(
        http.get(`/uefa-api/v5/matches/${MATCH_ID}`, () =>
          HttpResponse.json({ ...rawFinishedMatch, id: MATCH_ID }),
        ),
      )
      const match = await uefaUclProvider.fetchMatch(MATCH_ID)
      expect(match.minute).toBeUndefined()
    })

    it('preserves all other match fields through mapping', async () => {
      server.use(
        http.get(`/uefa-api/v5/matches/${MATCH_ID}`, () => HttpResponse.json(rawLiveMatchDetail)),
      )
      const match = await uefaUclProvider.fetchMatch(MATCH_ID)
      expect(match.id).toBe(MATCH_ID)
      expect(match.status).toBe('LIVE')
      expect(match.homeTeam.internationalName).toBe('Real Madrid')
      expect(match.score?.total.home).toBe(1)
    })
  })

  // ---------------------------------------------------------------------------
  // fetchMatchLineups — pass-through (no mapping needed)
  // ---------------------------------------------------------------------------

  describe('fetchMatchLineups', () => {
    it('returns canonical MatchLineups unchanged', async () => {
      const lineups = await uefaUclProvider.fetchMatchLineups(MATCH_ID)
      expect(lineups.matchId).toBe(MATCH_ID)
      expect(lineups.homeTeam).toBeDefined()
      expect(lineups.awayTeam).toBeDefined()
    })

    it('returns the correct number of field players', async () => {
      const lineups = await uefaUclProvider.fetchMatchLineups(MATCH_ID)
      expect(lineups.homeTeam.field).toHaveLength(lineupsFixture.homeTeam.field.length)
    })
  })
})
