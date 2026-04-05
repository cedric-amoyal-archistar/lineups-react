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

interface UefaProviderConfig {
  id: string
  name: string
  logoUrl: string
  competitionId: string
  externalUrlPath: string
  firstSeason: number
}

function createUefaProvider(config: UefaProviderConfig): CompetitionProvider {
  return {
    id: config.id,
    name: config.name,
    logoUrl: config.logoUrl,
    proxyPath: '/uefa-api',

    async fetchMatches(seasonYear, offset, limit, signal) {
      const params = new URLSearchParams({
        competitionId: config.competitionId,
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
      return `https://www.uefa.com/${config.externalUrlPath}/match/${match.id}--${home}-vs-${away}/`
    },

    getSeasons() {
      const current = computeCurrentSeason()
      return Array.from({ length: current + 1 - config.firstSeason }, (_, i) => current + 1 - i)
    },

    getDefaultSeason() {
      return computeCurrentSeason()
    },

    seasonLabel(year) {
      if (year >= 2008) return `${year - 1}/${String(year).slice(2)}`
      return `${year}/${String(year + 1).slice(2)}`
    },
  }
}

export const uefaUclProvider = createUefaProvider({
  id: 'uefa-ucl',
  name: 'UEFA Champions League',
  logoUrl: '/logos/ucl.png',
  competitionId: '1',
  externalUrlPath: 'uefachampionsleague',
  firstSeason: 1956,
})

export const uefaUelProvider = createUefaProvider({
  id: 'uefa-uel',
  name: 'UEFA Europa League',
  logoUrl: '/logos/uel.svg',
  competitionId: '14',
  externalUrlPath: 'uefaeuropaleague',
  firstSeason: 1972,
})

export const uefaUeclProvider = createUefaProvider({
  id: 'uefa-uecl',
  name: 'UEFA Conference League',
  logoUrl: '/logos/uecl.svg',
  competitionId: '2019',
  externalUrlPath: 'uefaeuropaconferenceleague',
  firstSeason: 2022,
})

/** @deprecated Use uefaUclProvider instead */
export const uefaProvider = uefaUclProvider
