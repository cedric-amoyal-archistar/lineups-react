import { useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useLayout } from '@/contexts/LayoutContext'
import { MatchCard } from '@/components/match/MatchCard'
import { GameweekSelector } from '@/components/match/GameweekSelector'
import { getProvider } from '@/providers/registry'
import { useMatchesByGameweek, useDefaultGameweek } from '@/hooks/useApi'
import type { Match } from '@/types/match'

const PAGE_SIZE = 100

function localDate(dateTime: string): string {
  const d = new Date(dateTime)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDate(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function groupByDate(matches: Match[]): [string, Match[]][] {
  const groups: Record<string, Match[]> = {}
  for (const match of matches) {
    const date = localDate(match.kickOffTime.dateTime)
    if (!groups[date]) groups[date] = []
    groups[date].push(match)
  }
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
}

function MatchListContent({ matches, teamFilter }: { matches: Match[]; teamFilter: string }) {
  const q = teamFilter.toLowerCase().trim()
  const filtered = q
    ? matches.filter(
        (m) =>
          m.homeTeam.internationalName.toLowerCase().includes(q) ||
          m.awayTeam.internationalName.toLowerCase().includes(q) ||
          m.homeTeam.teamCode.toLowerCase().includes(q) ||
          m.awayTeam.teamCode.toLowerCase().includes(q),
      )
    : matches

  const matchesByDate = groupByDate(filtered)

  if (matchesByDate.length === 0) {
    return <div className="py-24 text-center text-muted-foreground text-sm">No matches found.</div>
  }

  return (
    <div className="space-y-8">
      {matchesByDate.map(([date, dayMatches]) => (
        <section key={date}>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
            {formatDate(date)}
          </h2>
          <div className="space-y-2">
            {dayMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function useTotalGameweeks(provider: ReturnType<typeof getProvider>, seasonYear: number) {
  return useQuery<number, Error>({
    queryKey: ['totalGameweeks', provider.id, seasonYear],
    queryFn: ({ signal }) => provider.getTotalGameweeks!(seasonYear, signal),
    enabled: provider.paginationMode === 'gameweek' && !!provider.getTotalGameweeks,
    staleTime: 10 * 60 * 1000,
  })
}

function GameweekMatchList({ seasonYear, teamFilter }: { seasonYear: number; teamFilter: string }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const gwFromUrl = Number(searchParams.get('gw')) || 0
  const [prevSeason, setPrevSeason] = useState(seasonYear)

  const provider = getProvider(useParams<{ providerId: string }>().providerId!)
  const { data: defaultGw, isLoading: defaultLoading } = useDefaultGameweek(seasonYear)
  const { data: totalGameweeks } = useTotalGameweeks(provider, seasonYear)

  // Reset URL param when season changes
  if (seasonYear !== prevSeason) {
    setPrevSeason(seasonYear)
    if (gwFromUrl) setSearchParams({}, { replace: true })
  }

  const gameweek = gwFromUrl || defaultGw || 0
  const { data: matches, isLoading, error } = useMatchesByGameweek(seasonYear, gameweek)

  function handleGameweekChange(gw: number) {
    setSearchParams({ gw: String(gw) }, { replace: true })
  }

  const loading = defaultLoading || isLoading || gameweek === 0

  return (
    <>
      <div className="mb-4">
        {gameweek > 0 ? (
          <GameweekSelector
            gameweek={gameweek}
            totalGameweeks={totalGameweeks ?? 34}
            onChange={handleGameweekChange}
            loading={isLoading}
          />
        ) : (
          <div className="flex items-center justify-center h-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-5 text-center text-sm text-destructive">
          {error.message}
        </div>
      ) : (
        <MatchListContent matches={matches ?? []} teamFilter={teamFilter} />
      )}
    </>
  )
}

function OffsetMatchList({ seasonYear, teamFilter }: { seasonYear: number; teamFilter: string }) {
  const { providerId } = useParams<{ providerId: string }>()
  const provider = getProvider(providerId!)
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSeason = useCallback(
    async (year: number, signal?: AbortSignal) => {
      setLoading(true)
      setError(null)
      setMatches([])
      setHasMore(true)
      try {
        const data = await provider.fetchMatches(year, 0, PAGE_SIZE, signal)
        setMatches(data)
        setHasMore(data.length >= PAGE_SIZE)
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return
        setError(e instanceof Error ? e.message : 'Failed to load matches')
      } finally {
        if (!signal?.aborted) {
          setLoading(false)
        }
      }
    },
    [provider],
  )

  useEffect(() => {
    const controller = new AbortController()
    void fetchSeason(seasonYear, controller.signal)
    return () => controller.abort()
  }, [seasonYear, fetchSeason])

  async function loadMore() {
    setLoadingMore(true)
    try {
      const data = await provider.fetchMatches(seasonYear, matches.length, PAGE_SIZE)
      setMatches((prev) => [...prev, ...data])
      setHasMore(data.length >= PAGE_SIZE)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load more matches')
    } finally {
      setLoadingMore(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-5 text-center text-sm text-destructive">
        {error}
      </div>
    )
  }

  return (
    <>
      <MatchListContent matches={matches} teamFilter={teamFilter} />
      {hasMore && (
        <div className="flex justify-center pt-2 pb-8">
          <button
            onClick={() => void loadMore()}
            disabled={loadingMore}
            className="flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
            Load more
          </button>
        </div>
      )}
    </>
  )
}

export function MatchListPage() {
  const { providerId } = useParams<{ providerId: string }>()
  const provider = getProvider(providerId!)
  const {
    selectedSeason,
    setSelectedSeason,
    setShowSeasonSelect,
    selectedProvider,
    setSelectedProvider,
  } = useLayout()
  const [teamFilter, setTeamFilter] = useState('')

  const seasonYear = Number(selectedSeason)

  useEffect(() => {
    if (providerId && providerId !== selectedProvider) {
      setSelectedProvider(providerId)
      setSelectedSeason(String(provider.getDefaultSeason()))
    }
  }, [providerId, selectedProvider, setSelectedProvider, setSelectedSeason, provider])

  useEffect(() => {
    setShowSeasonSelect(true)
    return () => setShowSeasonSelect(false)
  }, [setShowSeasonSelect])

  return (
    <div className="mx-auto max-w-lg py-4 px-0">
      <div className="flex items-center gap-3 mb-6">
        <img
          src={provider.logoUrl}
          alt={provider.name}
          className="h-12 w-12 shrink-0 object-contain"
        />
        <p className="text-sm font-semibold text-foreground shrink-0">{provider.name}</p>
        <input
          type="text"
          placeholder="Filter by team..."
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          className="h-8 text-xs ml-auto w-36 rounded-md border border-input bg-background px-3 py-1 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
        />
      </div>

      {provider.paginationMode === 'gameweek' ? (
        <GameweekMatchList seasonYear={seasonYear} teamFilter={teamFilter} />
      ) : (
        <OffsetMatchList seasonYear={seasonYear} teamFilter={teamFilter} />
      )}
    </div>
  )
}
