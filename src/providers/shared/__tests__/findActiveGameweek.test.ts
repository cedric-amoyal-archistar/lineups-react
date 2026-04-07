import { describe, it, expect } from 'vitest'
import { findActiveGameweek } from '../findActiveGameweek'
import type { Match } from '@/types/match'

describe('findActiveGameweek', () => {
  const mockMatch = (status: Match['status']): Match => ({ status }) as Match

  function mockFetch(gameweekMap: Record<number, Match['status'][]>) {
    return (_seasonYear: number, gameweek: number): Promise<Match[]> =>
      Promise.resolve((gameweekMap[gameweek] ?? []).map(mockMatch))
  }

  it('returns current gameweek when a match is LIVE', async () => {
    const fetch = mockFetch({ 5: ['LIVE', 'LIVE'] })
    expect(await findActiveGameweek(fetch, 2025, 5, 34)).toBe(5)
  })

  it('advances past all-FINISHED gameweek to next UPCOMING one', async () => {
    const fetch = mockFetch({ 5: ['FINISHED', 'FINISHED'], 6: ['UPCOMING', 'UPCOMING'] })
    expect(await findActiveGameweek(fetch, 2025, 5, 34)).toBe(6)
  })

  it('returns current gameweek when all matches are UPCOMING', async () => {
    const fetch = mockFetch({ 5: ['UPCOMING', 'UPCOMING'] })
    expect(await findActiveGameweek(fetch, 2025, 5, 34)).toBe(5)
  })

  it('skips partial gameweek when next has started (postponement)', async () => {
    const fetch = mockFetch({
      5: ['FINISHED', 'UPCOMING'],
      6: ['FINISHED', 'FINISHED'],
      7: ['UPCOMING', 'UPCOMING'],
    })
    expect(await findActiveGameweek(fetch, 2025, 5, 34)).toBe(7)
  })

  it('returns partial gameweek when next is all UPCOMING (genuinely active)', async () => {
    const fetch = mockFetch({
      5: ['FINISHED', 'UPCOMING'],
      6: ['UPCOMING', 'UPCOMING'],
    })
    expect(await findActiveGameweek(fetch, 2025, 5, 34)).toBe(5)
  })

  it('returns partial last gameweek (no next to peek at)', async () => {
    const fetch = mockFetch({ 10: ['FINISHED', 'UPCOMING'] })
    expect(await findActiveGameweek(fetch, 2025, 10, 10)).toBe(10)
  })

  it('advances through multiple consecutive finished gameweeks', async () => {
    const fetch = mockFetch({
      3: ['FINISHED'],
      4: ['FINISHED'],
      5: ['UPCOMING'],
    })
    expect(await findActiveGameweek(fetch, 2025, 3, 34)).toBe(5)
  })

  it('returns totalGameweeks when all gameweeks are finished (season over)', async () => {
    const fetch = mockFetch({
      1: ['FINISHED'],
      2: ['FINISHED'],
      3: ['FINISHED'],
    })
    expect(await findActiveGameweek(fetch, 2025, 1, 3)).toBe(3)
  })

  it('returns totalGameweeks when startGameweek exceeds total', async () => {
    const fetch = mockFetch({})
    expect(await findActiveGameweek(fetch, 2025, 35, 34)).toBe(34)
  })
})
