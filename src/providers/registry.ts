import type { CompetitionProvider } from './types'
import { uefaUclProvider, uefaUelProvider, uefaUeclProvider } from './uefa'

const providers: Record<string, CompetitionProvider> = {
  [uefaUclProvider.id]: uefaUclProvider,
  [uefaUelProvider.id]: uefaUelProvider,
  [uefaUeclProvider.id]: uefaUeclProvider,
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
