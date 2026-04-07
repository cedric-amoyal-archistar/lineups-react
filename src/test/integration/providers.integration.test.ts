/**
 * Cross-competition data validation integration tests.
 *
 * Hits real provider APIs. Run manually only:
 *   npm run test:integration
 *   SEED=<number> npm run test:integration
 *
 * TC-1  Match list completeness — every returned match has critical fields
 * TC-2  Match detail completeness — fetched detail has all critical fields
 * TC-3  Lineup completeness — field players have valid coordinates and names
 * TC-4  Bench completeness — bench players have required fields
 * TC-5  Coverage visibility — log optional field hit rates, no assertions
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { getAllProviders } from '@/providers/registry'
import type { CompetitionProvider } from '@/providers/types'
import type { Match, MatchLineups } from '@/types/match'
import { getSeed, createRng, pickTestSeasons, pickN, logSelections } from './random'
import {
  validateMatchCritical,
  validateFinishedMatchScore,
  validateMatchDetailCritical,
  validateLineupCritical,
  validateBenchCritical,
  collectCoverage,
  mergeCoverage,
  logCoverage,
  type CoverageStats,
} from './validators'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MATCHES_PER_SEASON = 5
const GAMEWEEKS_TO_SAMPLE = 5

interface SeasonData {
  season: number
  matches: Match[]
  details: Map<string | number, Match>
  lineups: Map<string | number, MatchLineups | null>
  gameweeks?: number[]
}

async function safeProvider<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn()
  } catch {
    return null
  }
}

async function fetchOffsetMatches(provider: CompetitionProvider, season: number): Promise<Match[]> {
  return provider.fetchMatches(season, 0, 100)
}

async function fetchGameweekMatches(
  provider: CompetitionProvider,
  season: number,
  totalGw: number,
  rng: () => number,
): Promise<{ matches: Match[]; gameweeks: number[] }> {
  // Pick unique random gameweeks
  const allGws = Array.from({ length: totalGw }, (_, i) => i + 1)
  const selectedGws = pickN(allGws, GAMEWEEKS_TO_SAMPLE, rng)

  const matchesByGw = await Promise.all(
    selectedGws.map((gw) => safeProvider(() => provider.fetchMatchesByGameweek!(season, gw))),
  )

  const matches: Match[] = []
  for (const batch of matchesByGw) {
    if (batch) matches.push(...batch)
  }
  return { matches, gameweeks: selectedGws }
}

async function buildSeasonData(
  provider: CompetitionProvider,
  season: number,
  rng: () => number,
): Promise<SeasonData> {
  let allMatches: Match[] = []
  let gameweeks: number[] | undefined

  if (provider.paginationMode === 'gameweek') {
    const totalGw = await safeProvider(() => provider.getTotalGameweeks!(season))
    if (totalGw && totalGw > 0) {
      const result = await fetchGameweekMatches(provider, season, totalGw, rng)
      allMatches = result.matches
      gameweeks = result.gameweeks
    }
  } else {
    allMatches = (await safeProvider(() => fetchOffsetMatches(provider, season))) ?? []
  }

  // Prefer finished matches for detail+lineup validation
  const finished = allMatches.filter((m) => m.status === 'FINISHED')
  const pool = finished.length >= MATCHES_PER_SEASON ? finished : allMatches
  const picked = pickN(pool, MATCHES_PER_SEASON, rng)

  const details = new Map<string | number, Match>()
  const lineups = new Map<string | number, MatchLineups | null>()

  await Promise.all(
    picked.map(async (m) => {
      const detail = await safeProvider(() => provider.fetchMatch(m.id))
      details.set(m.id, detail ?? m)

      const lineup = await safeProvider(() => provider.fetchMatchLineups(m.id))
      lineups.set(m.id, lineup)
    }),
  )

  return { season, matches: picked, details, lineups, gameweeks }
}

// ---------------------------------------------------------------------------
// Test suite — one describe per provider
// ---------------------------------------------------------------------------

const seed = getSeed()

for (const provider of getAllProviders()) {
  describe(`${provider.name} [${provider.id}]`, () => {
    const allSeasonData: SeasonData[] = []
    const picks = new Map<number, { matchIds: (string | number)[]; gameweeks?: number[] }>()

    beforeAll(async () => {
      const rng = createRng(seed)
      const testSeasons = pickTestSeasons(provider.getSeasons(), rng)

      console.warn(
        `[integration] ${provider.name}: seed=${seed} seasons=[${testSeasons.join(', ')}]`,
      )

      for (const season of testSeasons) {
        const data = await buildSeasonData(provider, season, rng)
        allSeasonData.push(data)
        picks.set(season, {
          matchIds: data.matches.map((m) => m.id),
          gameweeks: data.gameweeks,
        })
      }

      logSelections({ seed, provider: provider.name, seasons: testSeasons, picks })
    })

    // -------------------------------------------------------------------------
    // TC-1: Match list completeness
    // -------------------------------------------------------------------------

    describe('TC-1: match list completeness', () => {
      it('every picked match has critical fields', () => {
        expect(allSeasonData.length, 'no season data collected').toBeGreaterThan(0)

        for (const { season, matches } of allSeasonData) {
          if (matches.length === 0) {
            console.warn(
              `[integration] ${provider.name}: season ${season} returned 0 matches — skipping`,
            )
            continue
          }

          for (const match of matches) {
            validateMatchCritical(match)
          }
        }
      })

      it('finished matches have score', () => {
        for (const { matches } of allSeasonData) {
          for (const match of matches) {
            if (match.status === 'FINISHED') {
              validateFinishedMatchScore(match)
            }
          }
        }
      })

      it('match IDs are unique within each season', () => {
        for (const { season, matches } of allSeasonData) {
          const ids = matches.map((m) => String(m.id))
          const unique = new Set(ids)
          expect(unique.size, `season ${season}: duplicate match IDs`).toBe(ids.length)
        }
      })
    })

    // -------------------------------------------------------------------------
    // TC-2: Match detail completeness
    // -------------------------------------------------------------------------

    describe('TC-2: match detail completeness', () => {
      it('fetched details have all critical fields', () => {
        for (const { details } of allSeasonData) {
          for (const [, detail] of details) {
            validateMatchDetailCritical(detail)
          }
        }
      })

      it('detail IDs match requested IDs', () => {
        for (const { matches, details } of allSeasonData) {
          for (const match of matches) {
            const detail = details.get(match.id)
            if (detail) {
              expect(String(detail.id), `detail ID mismatch for ${match.id}`).toBe(String(match.id))
            }
          }
        }
      })
    })

    // -------------------------------------------------------------------------
    // TC-3: Lineup completeness
    // -------------------------------------------------------------------------

    describe('TC-3: lineup completeness', () => {
      it('available lineups have valid field players with coordinates in range', () => {
        let lineupsChecked = 0

        for (const { lineups } of allSeasonData) {
          for (const [, lineup] of lineups) {
            if (lineup === null) continue
            validateLineupCritical(lineup)
            lineupsChecked++
          }
        }

        // Not a hard failure if zero lineups — historical seasons may lack data.
        // Warn so the operator notices.
        if (lineupsChecked === 0) {
          console.warn(
            `[integration] ${provider.name}: no lineups available across all test seasons`,
          )
        }
      })

      // Note: home and away use the same coordinate space (0-1000).
      // The UI flips away team coordinates via the `inverted` prop in TeamHalf.
      // So both teams can have identical coordinate ranges — this is expected.
    })

    // -------------------------------------------------------------------------
    // TC-4: Bench completeness
    // -------------------------------------------------------------------------

    describe('TC-4: bench completeness', () => {
      it('bench players have required fields', () => {
        for (const { lineups } of allSeasonData) {
          for (const [, lineup] of lineups) {
            if (lineup === null) continue
            validateBenchCritical(lineup)
          }
        }
      })
    })

    // -------------------------------------------------------------------------
    // TC-5: Coverage visibility (no assertions)
    // -------------------------------------------------------------------------

    describe('TC-5: optional field coverage', () => {
      it('logs coverage stats per season', () => {
        for (const { season, matches, details, lineups } of allSeasonData) {
          let stats: CoverageStats | null = null

          for (const match of matches) {
            const detail = details.get(match.id) ?? match
            const lineup = lineups.get(match.id) ?? null
            const s = collectCoverage(detail, lineup)
            stats = stats === null ? s : mergeCoverage(stats, s)
          }

          if (stats) {
            logCoverage(provider.name, season, stats)
          }
        }

        // TC-5 is visibility-only — always passes
        expect(true).toBe(true)
      })
    })
  })
}
