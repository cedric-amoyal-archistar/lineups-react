import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { LayoutProvider } from '@/contexts/LayoutContext'
import { useMatches, useMatch, useMatchLineups } from './useApi'
import { server } from '@/test/msw/server'
import {
  MATCH_ID,
  SEASON_YEAR,
  matchListFixture,
  matchFixture,
  lineupsFixture,
} from '@/test/msw/fixtures'

// ---------------------------------------------------------------------------
// Test wrapper — fresh QueryClient per test + LayoutProvider for useApi hooks
// ---------------------------------------------------------------------------

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <LayoutProvider>{children}</LayoutProvider>
      </QueryClientProvider>
    )
  }
}

// ---------------------------------------------------------------------------
// useMatches
// ---------------------------------------------------------------------------

describe('useMatches', () => {
  it('returns match list for a valid season', async () => {
    const { result } = renderHook(() => useMatches(Number(SEASON_YEAR)), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toHaveLength(matchListFixture.length)
    expect(result.current.data![0].id).toBe(MATCH_ID)
  })

  it('returns empty array for unknown season', async () => {
    server.use(http.get('/uefa-api/v5/matches', () => HttpResponse.json([])))

    const { result } = renderHook(() => useMatches(1900), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toHaveLength(0)
  })

  it('sends correct query params to the API', async () => {
    let capturedUrl: string | null = null

    server.use(
      http.get('/uefa-api/v5/matches', ({ request }) => {
        capturedUrl = request.url
        return HttpResponse.json(matchListFixture)
      }),
    )

    const { result } = renderHook(() => useMatches(2024, 0, 50), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(capturedUrl).not.toBeNull()
    const params = new URL(capturedUrl!).searchParams
    expect(params.get('competitionId')).toBe('1')
    expect(params.get('seasonYear')).toBe('2024')
    expect(params.get('offset')).toBe('0')
    expect(params.get('limit')).toBe('50')
    expect(params.get('order')).toBe('DESC')
  })

  it('exposes error state on network failure', async () => {
    server.use(http.get('/uefa-api/v5/matches', () => HttpResponse.error()))

    const { result } = renderHook(() => useMatches(2024), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeInstanceOf(Error)
  })

  it('starts in loading state', () => {
    const { result } = renderHook(() => useMatches(2024), {
      wrapper: makeWrapper(),
    })

    expect(result.current.isPending).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// useMatch
// ---------------------------------------------------------------------------

describe('useMatch', () => {
  it('returns match detail for valid id', async () => {
    const { result } = renderHook(() => useMatch(MATCH_ID), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.id).toBe(matchFixture.id)
    expect(result.current.data?.homeTeam.internationalName).toBe('Real Madrid')
    expect(result.current.data?.awayTeam.internationalName).toBe('FC Barcelona')
  })

  it('exposes error state for 404', async () => {
    const { result } = renderHook(() => useMatch(99999), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error?.message).toContain('404')
  })

  it('is disabled when matchId is 0', () => {
    const { result } = renderHook(() => useMatch(0), {
      wrapper: makeWrapper(),
    })

    expect(result.current.isPending).toBe(true)
    expect(result.current.isFetching).toBe(false)
  })

  it('is disabled for empty string matchId', () => {
    const { result } = renderHook(() => useMatch(''), {
      wrapper: makeWrapper(),
    })

    expect(result.current.isPending).toBe(true)
    expect(result.current.isFetching).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// useMatchLineups
// ---------------------------------------------------------------------------

describe('useMatchLineups', () => {
  it('returns lineups for valid match id', async () => {
    const { result } = renderHook(() => useMatchLineups(MATCH_ID), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.matchId).toBe(lineupsFixture.matchId)
    expect(result.current.data?.homeTeam.field).toHaveLength(lineupsFixture.homeTeam.field.length)
    expect(result.current.data?.awayTeam.field).toHaveLength(lineupsFixture.awayTeam.field.length)
  })

  it('exposes error state for 404', async () => {
    const { result } = renderHook(() => useMatchLineups(99999), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('is disabled when matchId is 0', () => {
    const { result } = renderHook(() => useMatchLineups(0), {
      wrapper: makeWrapper(),
    })

    expect(result.current.isPending).toBe(true)
    expect(result.current.isFetching).toBe(false)
  })

  it('does not retry on failure (retry: false)', async () => {
    let callCount = 0

    server.use(
      http.get('/uefa-api/v5/matches/:id/lineups', () => {
        callCount++
        return HttpResponse.error()
      }),
    )

    const { result } = renderHook(() => useMatchLineups(MATCH_ID), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(callCount).toBe(1)
  })
})
