import { expect } from 'vitest'
import type { Match, MatchLineups, LineupPlayer, BenchPlayer } from '@/types/match'

// ---------------------------------------------------------------------------
// Match validators
// ---------------------------------------------------------------------------

export function validateMatchCritical(match: Match): void {
  const ctx = (field: string) => `Match ${match.id}: ${field}`

  expect(match.id, ctx('id')).toBeTruthy()
  expect(match.status, ctx('status')).toMatch(/^(UPCOMING|LIVE|FINISHED)$/)

  // Very old matches (pre-1990s) may not have kickoff times
  if (!match.kickOffTime?.dateTime) {
    console.warn(`[validator] ${ctx('kickOffTime.dateTime')} is missing — old data`)
  }

  for (const side of ['homeTeam', 'awayTeam'] as const) {
    const team = match[side]
    expect(team.id, ctx(`${side}.id`)).toBeTruthy()
    expect(team.internationalName, ctx(`${side}.internationalName`)).toBeTruthy()

    // Logo and teamCode may be missing in very old data — warn, don't fail
    if (!team.logoUrl) console.warn(`[validator] ${ctx(`${side}.logoUrl`)} is missing`)
    if (!team.teamCode) console.warn(`[validator] ${ctx(`${side}.teamCode`)} is missing`)
  }

  expect(match.round.metaData.name, ctx('round.metaData.name')).toBeTruthy()
}

export function validateFinishedMatchScore(match: Match): void {
  const ctx = (field: string) => `Match ${match.id}: ${field}`

  expect(match.score, ctx('score')).toBeDefined()
  expect(typeof match.score!.total.home, ctx('score.total.home type')).toBe('number')
  expect(typeof match.score!.total.away, ctx('score.total.away type')).toBe('number')
}

export function validateMatchDetailCritical(match: Match): void {
  validateMatchCritical(match)

  const ctx = (field: string) => `Match ${match.id}: ${field}`
  expect(match.homeTeam.mediumLogoUrl, ctx('homeTeam.mediumLogoUrl')).toBeTruthy()
  expect(match.awayTeam.mediumLogoUrl, ctx('awayTeam.mediumLogoUrl')).toBeTruthy()
}

// ---------------------------------------------------------------------------
// Lineup validators
// ---------------------------------------------------------------------------

function validateFieldPlayer(player: LineupPlayer, side: 'home' | 'away', matchId: string): void {
  const ctx = (field: string) => `Match ${matchId} ${side} player #${player.jerseyNumber}: ${field}`

  expect(player.player.id, ctx('player.id')).toBeTruthy()
  expect(player.jerseyNumber, ctx('jerseyNumber')).toBeGreaterThan(0)

  const hasName =
    (player.player.clubShirtName && player.player.clubShirtName.length > 0) ||
    (player.player.internationalName && player.player.internationalName.length > 0)
  expect(hasName, ctx('clubShirtName or internationalName')).toBe(true)

  // Coordinates can be missing (undefined) or invalid (-1) for old data.
  // The app's fixInvalidCoordinates() handles both cases at render time.
  const hasValidCoords =
    player.fieldCoordinate && player.fieldCoordinate.x >= 0 && player.fieldCoordinate.y >= 0

  if (hasValidCoords) {
    expect(player.fieldCoordinate.x, ctx('fieldCoordinate.x')).toBeLessThanOrEqual(1000)
    expect(player.fieldCoordinate.y, ctx('fieldCoordinate.y')).toBeLessThanOrEqual(1000)
  } else {
    console.warn(
      `[validator] ${ctx('fieldCoordinate')} is missing or invalid — will be fixed by fixInvalidCoordinates at render`,
    )
  }
}

function validateBenchPlayer(player: BenchPlayer, side: 'home' | 'away', matchId: string): void {
  const ctx = (field: string) => `Match ${matchId} ${side} bench #${player.jerseyNumber}: ${field}`

  expect(player.player.id, ctx('player.id')).toBeTruthy()
  expect(player.jerseyNumber, ctx('jerseyNumber')).toBeGreaterThan(0)

  const hasName =
    (player.player.clubShirtName && player.player.clubShirtName.length > 0) ||
    (player.player.internationalName && player.player.internationalName.length > 0)
  expect(hasName, ctx('clubShirtName or internationalName')).toBe(true)
}

export function validateLineupCritical(lineups: MatchLineups): void {
  const matchId = String(lineups.matchId)

  for (const side of ['home', 'away'] as const) {
    const teamLineup = lineups[`${side}Team`]
    const ctx = (field: string) => `Match ${matchId} ${side}: ${field}`

    expect(teamLineup.team.internationalName, ctx('team.internationalName')).toBeTruthy()
    expect(
      teamLineup.field.length,
      ctx(`field.length (got ${teamLineup.field.length})`),
    ).toBeGreaterThanOrEqual(10)
    expect(
      teamLineup.field.length,
      ctx(`field.length (got ${teamLineup.field.length})`),
    ).toBeLessThanOrEqual(11)

    for (const player of teamLineup.field) {
      validateFieldPlayer(player, side, matchId)
    }
  }
}

export function validateBenchCritical(lineups: MatchLineups): void {
  const matchId = String(lineups.matchId)

  for (const side of ['home', 'away'] as const) {
    const teamLineup = lineups[`${side}Team`]
    for (const player of teamLineup.bench) {
      validateBenchPlayer(player, side, matchId)
    }
  }
}

// ---------------------------------------------------------------------------
// Coverage stats — TC-5 visibility
// ---------------------------------------------------------------------------

export interface CoverageStats {
  matchesWithScore: number
  matchesWithScorers: number
  matchesWithLineups: number
  matchesWithBench: number
  matchesWithStadium: number
  totalMatches: number
  totalLineups: number
}

export function collectCoverage(match: Match, lineups?: MatchLineups | null): CoverageStats {
  return {
    matchesWithScore: match.score !== undefined ? 1 : 0,
    matchesWithScorers:
      match.playerEvents?.scorers && match.playerEvents.scorers.length > 0 ? 1 : 0,
    matchesWithLineups: lineups !== null && lineups !== undefined ? 1 : 0,
    matchesWithBench:
      lineups !== null && lineups !== undefined
        ? lineups.homeTeam.bench.length > 0 || lineups.awayTeam.bench.length > 0
          ? 1
          : 0
        : 0,
    matchesWithStadium: match.stadium !== undefined ? 1 : 0,
    totalMatches: 1,
    totalLineups: lineups !== null && lineups !== undefined ? 1 : 0,
  }
}

export function mergeCoverage(a: CoverageStats, b: CoverageStats): CoverageStats {
  return {
    matchesWithScore: a.matchesWithScore + b.matchesWithScore,
    matchesWithScorers: a.matchesWithScorers + b.matchesWithScorers,
    matchesWithLineups: a.matchesWithLineups + b.matchesWithLineups,
    matchesWithBench: a.matchesWithBench + b.matchesWithBench,
    matchesWithStadium: a.matchesWithStadium + b.matchesWithStadium,
    totalMatches: a.totalMatches + b.totalMatches,
    totalLineups: a.totalLineups + b.totalLineups,
  }
}

function pct(num: number, denom: number): string {
  if (denom === 0) return 'n/a'
  return `${Math.round((num / denom) * 100)}%`
}

export function logCoverage(provider: string, season: number, stats: CoverageStats): void {
  console.warn(
    `[coverage] ${provider} season=${season} | ` +
      `matches=${stats.totalMatches} ` +
      `score=${pct(stats.matchesWithScore, stats.totalMatches)} ` +
      `scorers=${pct(stats.matchesWithScorers, stats.totalMatches)} ` +
      `lineups=${pct(stats.matchesWithLineups, stats.totalMatches)} ` +
      `bench=${pct(stats.matchesWithBench, stats.totalLineups)} ` +
      `stadium=${pct(stats.matchesWithStadium, stats.totalMatches)}`,
  )
}
