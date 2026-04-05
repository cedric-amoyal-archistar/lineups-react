import type { CompetitionProvider } from '../types'
import type { Match, MatchLineups } from '@/types/match'

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`UEFA API error: ${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

function computeCurrentSeason(): number {
  const now = new Date()
  return now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear()
}

export const uefaProvider: CompetitionProvider = {
  id: 'uefa-ucl',
  name: 'UEFA Champions League',
  proxyPath: '/uefa-api',

  async fetchMatches(seasonYear, offset, limit, signal) {
    const params = new URLSearchParams({
      competitionId: '1',
      seasonYear: String(seasonYear),
      offset: String(offset),
      limit: String(limit),
      order: 'DESC',
    })
    return fetchJson<Match[]>(`/uefa-api/v5/matches?${params.toString()}`, signal)
  },

  async fetchMatch(matchId, signal) {
    return fetchJson<Match>(`/uefa-api/v5/matches/${matchId}`, signal)
  },

  async fetchMatchLineups(matchId, signal) {
    return fetchJson<MatchLineups>(`/uefa-api/v5/matches/${matchId}/lineups`, signal)
  },

  getExternalUrl(match) {
    const slug = (name: string) => name.toLowerCase().replace(/\s+/g, '-')
    const home = slug(match.homeTeam.internationalName)
    const away = slug(match.awayTeam.internationalName)
    return `https://www.uefa.com/uefachampionsleague/match/${match.id}--${home}-vs-${away}/`
  },

  getSeasons() {
    const current = computeCurrentSeason()
    return Array.from({ length: current - 1955 }, (_, i) => current + 1 - i).filter(
      (y) => y !== 2007,
    )
  },

  getDefaultSeason() {
    return computeCurrentSeason()
  },

  seasonLabel(year) {
    if (year >= 2008) return `${year - 1}/${String(year).slice(2)}`
    return `${year}/${String(year + 1).slice(2)}`
  },
}
