import { useQuery } from '@tanstack/react-query'
import type { Match, MatchLineups } from '@/types/match'

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`UEFA API error: ${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

function matchesUrl(seasonYear: number, offset: number, limit: number): string {
  const params = new URLSearchParams({
    competitionId: '1',
    seasonYear: String(seasonYear),
    offset: String(offset),
    limit: String(limit),
    order: 'DESC',
  })
  return `/uefa-api/v5/matches?${params.toString()}`
}

export function useMatches(seasonYear: number, offset = 0, limit = 50) {
  return useQuery<Match[], Error>({
    queryKey: ['matches', seasonYear, offset, limit],
    queryFn: ({ signal }) => fetchJson<Match[]>(matchesUrl(seasonYear, offset, limit), signal),
  })
}

export function useMatch(matchId: number) {
  return useQuery<Match, Error>({
    queryKey: ['match', matchId],
    queryFn: ({ signal }) => fetchJson<Match>(`/uefa-api/v5/matches/${matchId}`, signal),
    enabled: matchId > 0,
  })
}

export function useMatchLineups(matchId: number) {
  return useQuery<MatchLineups, Error>({
    queryKey: ['matchLineups', matchId],
    queryFn: ({ signal }) => fetchJson<MatchLineups>(`/uefa-api/v5/matches/${matchId}/lineups`, signal),
    enabled: matchId > 0,
    retry: false,
  })
}
