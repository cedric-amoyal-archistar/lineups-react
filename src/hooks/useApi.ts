import { useQuery } from '@tanstack/react-query'
import type { Match, MatchLineups } from '@/types/match'
import { useLayout } from '@/contexts/LayoutContext'
import { getProvider } from '@/providers/registry'
import type { CompetitionProvider } from '@/providers/types'

function useProvider(): CompetitionProvider {
  const { selectedProvider } = useLayout()
  return getProvider(selectedProvider)
}

export function useMatches(seasonYear: number, offset = 0, limit = 50) {
  const provider = useProvider()
  return useQuery<Match[], Error>({
    queryKey: ['matches', provider.id, seasonYear, offset, limit],
    queryFn: ({ signal }) => provider.fetchMatches(seasonYear, offset, limit, signal),
  })
}

export function useMatchesByGameweek(seasonYear: number, gameweek: number) {
  const provider = useProvider()
  return useQuery<Match[], Error>({
    queryKey: ['matches', provider.id, seasonYear, 'gw', gameweek],
    queryFn: ({ signal }) => provider.fetchMatchesByGameweek!(seasonYear, gameweek, signal),
    enabled: provider.paginationMode === 'gameweek' && gameweek > 0,
  })
}

export function useDefaultGameweek(seasonYear: number) {
  const provider = useProvider()
  return useQuery<number, Error>({
    queryKey: ['defaultGameweek', provider.id, seasonYear],
    queryFn: ({ signal }) => provider.getDefaultGameweek!(seasonYear, signal),
    enabled: provider.paginationMode === 'gameweek' && !!provider.getDefaultGameweek,
    staleTime: 5 * 60 * 1000,
  })
}

export function useMatch(matchId: number | string) {
  const provider = useProvider()
  return useQuery<Match, Error>({
    queryKey: ['match', provider.id, matchId],
    queryFn: ({ signal }) => provider.fetchMatch(matchId, signal),
    enabled: !!matchId,
  })
}

export function useMatchLineups(matchId: number | string) {
  const provider = useProvider()
  return useQuery<MatchLineups, Error>({
    queryKey: ['matchLineups', provider.id, matchId],
    queryFn: ({ signal }) => provider.fetchMatchLineups(matchId, signal),
    enabled: !!matchId,
    retry: false,
  })
}
