import type { Match, MatchEvent } from '@/types/match'

function formatMinute(event: MatchEvent): string {
  const min = `${event.time.minute}'`
  if (event.time.injuryMinute) return `${min}+${event.time.injuryMinute}`
  return min
}

function goalLabel(event: MatchEvent): string {
  const min = formatMinute(event)
  if (event.goalType === 'PENALTY') return `${min} (P)`
  if (event.goalType === 'OWN_GOAL') return `${min} (OG)`
  return min
}

interface MatchEventsProps {
  match: Match
}

export function MatchEvents({ match }: MatchEventsProps) {
  const homeId = match.homeTeam.id
  const scorers = match.playerEvents?.scorers ?? []
  const redCards = match.playerEvents?.redCards ?? []

  const homeGoals = scorers.filter((s) => s.teamId === homeId)
  const awayGoals = scorers.filter((s) => s.teamId !== homeId)
  const homeReds = redCards.filter((r) => r.teamId === homeId)
  const awayReds = redCards.filter((r) => r.teamId !== homeId)

  if (!scorers.length && !redCards.length) return null

  return (
    <div className="mx-auto max-w-sm px-6 py-3">
      <div className="flex gap-3">
        {/* Home events */}
        <div className="flex-1 text-right space-y-1">
          {homeGoals.map((goal) => (
            <div key={goal.id} className="text-xs text-muted-foreground leading-relaxed">
              <span>{goal.player.clubShirtName || goal.player.internationalName}</span>
              <span className="font-semibold text-foreground/70 ml-1">{goalLabel(goal)}</span>
            </div>
          ))}
          {homeReds.map((red) => (
            <div key={red.id} className="text-xs text-muted-foreground leading-relaxed">
              {red.player.clubShirtName || red.player.internationalName}
              <span className="font-semibold text-foreground/70 ml-1">{formatMinute(red)}</span>
              <span className="inline-block h-3 w-2 rounded-[2px] bg-red-500 ml-1 align-middle" />
            </div>
          ))}
        </div>

        {/* Center divider */}
        <div className="flex flex-col items-center pt-1 shrink-0 w-4">
          <div className="h-full w-px bg-border" />
        </div>

        {/* Away events */}
        <div className="flex-1 space-y-1">
          {awayGoals.map((goal) => (
            <div key={goal.id} className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground/70 mr-1">{goalLabel(goal)}</span>
              <span>{goal.player.clubShirtName || goal.player.internationalName}</span>
            </div>
          ))}
          {awayReds.map((red) => (
            <div key={red.id} className="text-xs text-muted-foreground leading-relaxed">
              <span className="inline-block h-3 w-2 rounded-[2px] bg-red-500 mr-1 align-middle" />
              <span className="font-semibold text-foreground/70 mr-1">{formatMinute(red)}</span>
              {red.player.clubShirtName || red.player.internationalName}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
