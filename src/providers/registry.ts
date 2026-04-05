import type { CompetitionProvider } from './types'
import { uefaProvider } from './uefa'

const providers: Record<string, CompetitionProvider> = {
  [uefaProvider.id]: uefaProvider,
}

export function getProvider(id: string): CompetitionProvider {
  const p = providers[id]
  if (!p) throw new Error(`Unknown provider: ${id}`)
  return p
}

export function getAllProviders(): CompetitionProvider[] {
  return Object.values(providers)
}

export const defaultProviderId = uefaProvider.id
