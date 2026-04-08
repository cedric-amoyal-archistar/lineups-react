import { http, HttpResponse } from 'msw'
import {
  MATCH_ID,
  MATCH_ID_STR,
  matchListFixture,
  matchFixture,
  lineupsFixture,
  LIGUE1_MATCH_ID,
  ligue1MatchListFixture,
  ligue1MatchDetailFixture,
  ligue1StandingsFixture,
  PL_MATCH_ID,
  plMatchListFixture,
  plMatchDetailFixture,
  plLineupsFixture,
  plEventsFixture,
  plTeamsFixture,
  plSquadFixture,
} from './fixtures'

/**
 * MSW request handlers for competition API proxies.
 *
 * UEFA API: /uefa-api/v5/...
 * Ligue 1 API: /ligue1-api/...
 */
export const handlers = [
  // ---- UEFA ----
  http.get('/uefa-api/v5/matches', () => {
    return HttpResponse.json(matchListFixture)
  }),

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

  // ---- Ligue 1 ----
  http.get('/ligue1-api/championship-matches/championship/1/game-week/:gw', () => {
    return HttpResponse.json(ligue1MatchListFixture)
  }),

  http.get('/ligue1-api/championship-match/:id', ({ params }) => {
    if (params['id'] !== LIGUE1_MATCH_ID) {
      return HttpResponse.json({ error: 'Match not found' }, { status: 404 })
    }
    return HttpResponse.json(ligue1MatchDetailFixture)
  }),

  http.get('/ligue1-api/championship-standings/1/general', () => {
    return HttpResponse.json(ligue1StandingsFixture)
  }),

  // ---- Premier League ----
  http.get('/pl-api/api/v1/competitions/8/seasons/:season/matchweeks/:gw/matches', () => {
    return HttpResponse.json(plMatchListFixture)
  }),

  http.get('/pl-api/api/v2/matches/:id', ({ params }) => {
    if (params['id'] !== PL_MATCH_ID) {
      return HttpResponse.json({ error: 'Match not found' }, { status: 404 })
    }
    return HttpResponse.json(plMatchDetailFixture)
  }),

  http.get('/pl-api/api/v3/matches/:id/lineups', ({ params }) => {
    if (params['id'] !== PL_MATCH_ID) {
      return HttpResponse.json({ error: 'Match not found' }, { status: 404 })
    }
    return HttpResponse.json(plLineupsFixture)
  }),

  http.get('/pl-api/api/v1/matches/:id/events', ({ params }) => {
    if (params['id'] !== PL_MATCH_ID) {
      return HttpResponse.json({ error: 'Match not found' }, { status: 404 })
    }
    return HttpResponse.json(plEventsFixture)
  }),

  http.get('/pl-api/api/v1/competitions/8/seasons/:season/teams', () => {
    return HttpResponse.json(plTeamsFixture)
  }),

  http.get('/pl-api/api/v2/competitions/8/seasons/:season/teams/:teamId/squad', () => {
    return HttpResponse.json(plSquadFixture)
  }),
]
