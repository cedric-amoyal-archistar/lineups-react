import type { CompetitionProvider } from './types'
import { uefaUclProvider, uefaUelProvider, uefaUeclProvider } from './uefa'
import { ligue1Provider } from './ligue1'
import { premierLeagueProvider } from './premier-league'

const providers: Record<string, CompetitionProvider> = {
  [uefaUclProvider.id]: uefaUclProvider,
  [uefaUelProvider.id]: uefaUelProvider,
  [uefaUeclProvider.id]: uefaUeclProvider,
  [ligue1Provider.id]: ligue1Provider,
  [premierLeagueProvider.id]: premierLeagueProvider,
}

export function getProvider(id: string): CompetitionProvider {
  const p = providers[id]
  if (!p) throw new Error(`Unknown provider: ${id}`)
  return p
}

export function getAllProviders(): CompetitionProvider[] {
  return Object.values(providers)
}

export const defaultProviderId = uefaUclProvider.id
