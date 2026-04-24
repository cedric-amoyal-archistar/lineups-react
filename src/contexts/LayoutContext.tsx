import { createContext, useContext, useState, type ReactNode } from 'react'
import type { DisplayMode } from '@/types/common'
import { defaultProviderId, getProvider } from '@/providers/registry'

interface LayoutContextValue {
  displayMode: DisplayMode
  setDisplayMode: (mode: DisplayMode) => void
  showDisplaySelect: boolean
  setShowDisplaySelect: (show: boolean) => void
  selectedSeason: string
  setSelectedSeason: (season: string) => void
  showSeasonSelect: boolean
  setShowSeasonSelect: (show: boolean) => void
  selectedProvider: string
  setSelectedProvider: (id: string) => void
}

const LayoutContext = createContext<LayoutContextValue | null>(null)

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [displayMode, setDisplayMode] = useState<DisplayMode>(
    () => getProvider(defaultProviderId).defaultDisplayMode ?? 'countryCode',
  )
  const [showDisplaySelect, setShowDisplaySelect] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState(defaultProviderId)
  const [selectedSeason, setSelectedSeason] = useState(() =>
    String(getProvider(defaultProviderId).getDefaultSeason()),
  )
  const [showSeasonSelect, setShowSeasonSelect] = useState(false)

  function handleSetSelectedProvider(id: string) {
    const nextProvider = getProvider(id)
    setDisplayMode(nextProvider.defaultDisplayMode ?? 'countryCode')
    setSelectedProvider(id)
  }

  return (
    <LayoutContext.Provider
      value={{
        displayMode,
        setDisplayMode,
        showDisplaySelect,
        setShowDisplaySelect,
        selectedSeason,
        setSelectedSeason,
        showSeasonSelect,
        setShowSeasonSelect,
        selectedProvider,
        setSelectedProvider: handleSetSelectedProvider,
      }}
    >
      {children}
    </LayoutContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLayout(): LayoutContextValue {
  const ctx = useContext(LayoutContext)
  if (!ctx) throw new Error('useLayout must be used within LayoutProvider')
  return ctx
}
