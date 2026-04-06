import { ChevronLeft, ChevronRight } from 'lucide-react'

interface GameweekSelectorProps {
  gameweek: number
  totalGameweeks: number
  onChange: (gw: number) => void
  loading?: boolean
}

export function GameweekSelector({
  gameweek,
  totalGameweeks,
  onChange,
  loading,
}: GameweekSelectorProps) {
  const canPrev = gameweek > 1
  const canNext = gameweek < totalGameweeks

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => canPrev && onChange(gameweek - 1)}
        disabled={!canPrev || loading}
        className="flex items-center justify-center h-8 w-8 rounded-md border border-input bg-background text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous matchday"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-[120px] text-center text-sm font-medium text-foreground">
        Matchday {gameweek}
      </span>
      <button
        onClick={() => canNext && onChange(gameweek + 1)}
        disabled={!canNext || loading}
        className="flex items-center justify-center h-8 w-8 rounded-md border border-input bg-background text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Next matchday"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
