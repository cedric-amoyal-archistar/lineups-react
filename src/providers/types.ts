import type { Match, MatchLineups } from '@/types/match'

export interface CompetitionProvider {
  /** Unique key, used in registry and query cache keys */
  id: string
  /** Display name for the UI */
  name: string
  /** Competition logo URL */
  logoUrl: string
  /** Base path for the Vite dev proxy (e.g. '/uefa-api') */
  proxyPath: string

  /** How this competition paginates match lists */
  paginationMode: 'offset' | 'gameweek'

  /** Offset-based fetching (UEFA-style) */
  fetchMatches(
    seasonYear: number,
    offset: number,
    limit: number,
    signal?: AbortSignal,
  ): Promise<Match[]>

  /** Gameweek-based fetching (national leagues) — only used when paginationMode is 'gameweek' */
  fetchMatchesByGameweek?(
    seasonYear: number,
    gameweek: number,
    signal?: AbortSignal,
  ): Promise<Match[]>

  /** Total gameweeks for a season — only for gameweek providers */
  getTotalGameweeks?(seasonYear: number, signal?: AbortSignal): Promise<number>

  /** Get the default (current/latest played) gameweek */
  getDefaultGameweek?(seasonYear: number, signal?: AbortSignal): Promise<number>

  fetchMatch(matchId: number | string, signal?: AbortSignal): Promise<Match>

  fetchMatchLineups(matchId: number | string, signal?: AbortSignal): Promise<MatchLineups>

  /** Build an external URL for a match (e.g. UEFA.com link) */
  getExternalUrl(match: Match): string

  /** Ordered list of available season years (newest first) */
  getSeasons(): number[]

  /** The season that should be selected by default (the current active season) */
  getDefaultSeason(): number

  /** Human-readable season label (e.g. "2024/25") */
  seasonLabel(year: number): string
}
