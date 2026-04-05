import type { Match, MatchLineups } from '@/types/match'

export interface CompetitionProvider {
  /** Unique key, used in registry and query cache keys */
  id: string
  /** Display name for the UI */
  name: string
  /** Base path for the Vite dev proxy (e.g. '/uefa-api') */
  proxyPath: string

  fetchMatches(
    seasonYear: number,
    offset: number,
    limit: number,
    signal?: AbortSignal,
  ): Promise<Match[]>

  fetchMatch(matchId: number, signal?: AbortSignal): Promise<Match>

  fetchMatchLineups(matchId: number, signal?: AbortSignal): Promise<MatchLineups>

  /** Build an external URL for a match (e.g. UEFA.com link) */
  getExternalUrl(match: Match): string

  /** Ordered list of available season years (newest first) */
  getSeasons(): number[]

  /** The season that should be selected by default (the current active season) */
  getDefaultSeason(): number

  /** Human-readable season label (e.g. "2024/25") */
  seasonLabel(year: number): string
}
