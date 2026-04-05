import { http, HttpResponse } from 'msw'
import { MATCH_ID, MATCH_ID_STR, matchListFixture, matchFixture, lineupsFixture } from './fixtures'

/**
 * MSW request handlers for the UEFA Match API proxy.
 * All requests go through the /uefa-api prefix (Vite dev proxy -> match.uefa.com).
 *
 * The UEFA API returns:
 *   GET /v5/matches         -> Match[]  (bare array)
 *   GET /v5/matches/:id     -> Match
 *   GET /v5/matches/:id/lineups -> MatchLineups
 *
 * Default handler returns fixture data for ANY seasonYear so tests that use
 * LayoutProvider (which computes the current season from today's date) don't
 * need to know which specific year is computed at runtime.
 */
export const handlers = [
  // GET /uefa-api/v5/matches  -- match list by season, returns Match[]
  http.get('/uefa-api/v5/matches', () => {
    return HttpResponse.json(matchListFixture)
  }),

  // GET /uefa-api/v5/matches/:id  -- single match detail
  // NOTE: must be ordered AFTER the lineups handler because MSW matches greedily.
  // The lineups handler uses /matches/:id/lineups which is more specific and registered first.
  http.get('/uefa-api/v5/matches/:id/lineups', ({ params }) => {
    const id = Number(params['id'])
    if (id !== MATCH_ID) {
      return HttpResponse.json({ error: 'Match not found' }, { status: 404 })
    }
    return HttpResponse.json(lineupsFixture)
  }),

  http.get('/uefa-api/v5/matches/:id', ({ params }) => {
    const id = Number(params['id'])
    if (String(id) !== MATCH_ID_STR) {
      return HttpResponse.json({ error: 'Match not found' }, { status: 404 })
    }
    return HttpResponse.json(matchFixture)
  }),
]
