import { type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trophy, ChevronDown } from 'lucide-react'
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { useLayout } from '@/contexts/LayoutContext'
import { cn } from '@/lib/utils'
import type { DisplayMode } from '@/types/common'

function computeCurrentSeason(): number {
  const now = new Date()
  return now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear()
}

const currentSeason = computeCurrentSeason()

const seasons: number[] = Array.from(
  { length: currentSeason - 1955 },
  (_, i) => currentSeason + 1 - i,
).filter((y) => y !== 2007)

function seasonLabel(year: number): string {
  if (year >= 2008) return `${year - 1}/${String(year).slice(2)}`
  return `${year}/${String(year + 1).slice(2)}`
}

const displayOptions: { label: string; value: DisplayMode }[] = [
  { label: 'Flag', value: 'countryCode' },
  { label: 'Number', value: 'clubJerseyNumber' },
  { label: 'Age', value: 'age' },
  { label: 'Height', value: 'height' },
  { label: 'Photo', value: 'imageUrl' },
]

interface DefaultLayoutProps {
  children: ReactNode
}

export function DefaultLayout({ children }: DefaultLayoutProps) {
  const navigate = useNavigate()
  const {
    displayMode,
    setDisplayMode,
    showDisplaySelect,
    selectedSeason,
    setSelectedSeason,
    showSeasonSelect,
  } = useLayout()

  function handleLogoClick(e: React.MouseEvent) {
    e.preventDefault()
    void navigate('/')
  }

  const selectedDisplayOption =
    displayOptions.find((o) => o.value === displayMode) ?? displayOptions[0]

  const selectedSeasonYear = Number(selectedSeason)

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link
            to="/"
            onClick={handleLogoClick}
            className="flex items-center gap-2.5 font-semibold tracking-tight text-foreground hover:text-foreground/80 transition-colors shrink-0"
          >
            <Trophy className="h-5 w-5 text-primary" />
            <span>Lineups</span>
          </Link>

          <div>
            {showSeasonSelect && (
              <Listbox value={selectedSeasonYear} onChange={(y) => setSelectedSeason(String(y))}>
                <div className="relative">
                  <ListboxButton
                    className={cn(
                      'flex w-36 items-center justify-between rounded-md border border-input bg-background px-3 py-1.5',
                      'text-sm font-semibold text-foreground shadow-xs',
                      'hover:bg-accent hover:text-accent-foreground',
                      'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
                      'transition-colors',
                    )}
                  >
                    <span>{seasonLabel(selectedSeasonYear)}</span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
                  </ListboxButton>
                  <ListboxOptions
                    className={cn(
                      'absolute right-0 z-50 mt-1 max-h-60 w-36 overflow-auto rounded-md',
                      'border border-border bg-popover py-1 shadow-md',
                      'focus:outline-none',
                    )}
                  >
                    {seasons.map((year) => (
                      <ListboxOption
                        key={year}
                        value={year}
                        className={({ focus, selected }) =>
                          cn(
                            'relative cursor-pointer select-none px-3 py-1.5 text-sm',
                            focus && 'bg-accent text-accent-foreground',
                            selected && !focus && 'bg-accent/50',
                            !focus && !selected && 'text-popover-foreground',
                          )
                        }
                      >
                        {seasonLabel(year)}
                      </ListboxOption>
                    ))}
                  </ListboxOptions>
                </div>
              </Listbox>
            )}

            {showDisplaySelect && (
              <Listbox value={displayMode} onChange={setDisplayMode}>
                <div className="relative">
                  <ListboxButton
                    className={cn(
                      'flex w-36 items-center justify-between rounded-md border border-input bg-background px-3 py-1.5',
                      'text-xs text-foreground shadow-xs',
                      'hover:bg-accent hover:text-accent-foreground',
                      'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
                      'transition-colors',
                    )}
                  >
                    <span>{selectedDisplayOption.label}</span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
                  </ListboxButton>
                  <ListboxOptions
                    className={cn(
                      'absolute right-0 z-50 mt-1 w-36 overflow-auto rounded-md',
                      'border border-border bg-popover py-1 shadow-md',
                      'focus:outline-none',
                    )}
                  >
                    {displayOptions.map((opt) => (
                      <ListboxOption
                        key={opt.value}
                        value={opt.value}
                        className={({ focus, selected }) =>
                          cn(
                            'relative cursor-pointer select-none px-3 py-1.5 text-sm',
                            focus && 'bg-accent text-accent-foreground',
                            selected && !focus && 'bg-accent/50',
                            !focus && !selected && 'text-popover-foreground',
                          )
                        }
                      >
                        {opt.label}
                      </ListboxOption>
                    ))}
                  </ListboxOptions>
                </div>
              </Listbox>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4">{children}</main>
    </div>
  )
}
