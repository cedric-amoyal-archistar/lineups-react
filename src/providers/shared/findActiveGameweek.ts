import type { Match } from '@/types/match'

export async function findActiveGameweek(
  fetchGameweek: (seasonYear: number, gameweek: number, signal?: AbortSignal) => Promise<Match[]>,
  seasonYear: number,
  startGameweek: number,
  totalGameweeks: number,
  signal?: AbortSignal,
): Promise<number> {
  let gameweek = startGameweek

  while (gameweek <= totalGameweeks) {
    const matches = await fetchGameweek(seasonYear, gameweek, signal)

    const hasLive = matches.some((m) => m.status === 'LIVE')
    if (hasLive) return gameweek

    const allFinished = matches.every((m) => m.status === 'FINISHED')
    if (allFinished) {
      gameweek++
      continue
    }

    const allUpcoming = matches.every((m) => m.status === 'UPCOMING')
    if (allUpcoming) return gameweek

    // Partial: mix of FINISHED + UPCOMING, no LIVE — possible postponement
    // Peek at next gameweek to disambiguate
    if (gameweek < totalGameweeks) {
      const nextMatches = await fetchGameweek(seasonYear, gameweek + 1, signal)
      const nextHasPlayed = nextMatches.some((m) => m.status === 'FINISHED' || m.status === 'LIVE')
      if (nextHasPlayed) {
        // Next gameweek already started — this partial gameweek has postponements, skip it
        gameweek++
        continue
      }
    }

    // Next gameweek is all upcoming or doesn't exist — this is the active gameweek
    return gameweek
  }

  // Exceeded totalGameweeks — season is over
  return totalGameweeks
}
