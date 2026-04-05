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

export function useMatch(matchId: number) {
  const provider = useProvider()
  return useQuery<Match, Error>({
    queryKey: ['match', provider.id, matchId],
    queryFn: ({ signal }) => provider.fetchMatch(matchId, signal),
    enabled: matchId > 0,
  })
}

export function useMatchLineups(matchId: number) {
  const provider = useProvider()
  return useQuery<MatchLineups, Error>({
    queryKey: ['matchLineups', provider.id, matchId],
    queryFn: ({ signal }) => provider.fetchMatchLineups(matchId, signal),
    enabled: matchId > 0,
    retry: false,
  })
}
