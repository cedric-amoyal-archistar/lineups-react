import { Check, X } from 'lucide-react'
import type { Match, PenaltyEvent } from '@/types/match'

interface PenaltyRound {
  home?: PenaltyEvent
  away?: PenaltyEvent
}

function buildRounds(match: Match): PenaltyRound[] {
  const penalties = match.playerEvents?.penaltyScorers ?? []
  const homeId = match.homeTeam.id
  const homePens = penalties.filter((p) => p.teamId === homeId)
  const awayPens = penalties.filter((p) => p.teamId !== homeId)
  const maxRounds = Math.max(homePens.length, awayPens.length)
  const rounds: PenaltyRound[] = []
  for (let i = 0; i < maxRounds; i++) {
    rounds.push({ home: homePens[i], away: awayPens[i] })
  }
  return rounds
}

function playerName(p?: PenaltyEvent): string {
  if (!p) return ''
  return p.player.clubShirtName ?? p.player.internationalName ?? '—'
}

interface PenaltyShootoutProps {
  match: Match
}

export function PenaltyShootout({ match }: PenaltyShootoutProps) {
  const penalties = match.playerEvents?.penaltyScorers ?? []
  if (!penalties.length) return null

  const rounds = buildRounds(match)

  return (
    <div className="mx-auto max-w-sm rounded-2xl border bg-card p-4 shadow-sm">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center mb-3">
        Penalty Shootout
      </h3>

      <div className="space-y-1.5">
        {rounds.map((round, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            {/* Home */}
            <div className="flex-1 flex items-center justify-end gap-1.5">
              <span
                className={`truncate text-right ${round.home?.penaltyType === 'MISSED' ? 'text-muted-foreground/50 line-through' : ''}`}
              >
                {playerName(round.home)}
              </span>
              {round.home && (
                <div
                  className={`shrink-0 flex items-center justify-center h-5 w-5 rounded-full ${
                    round.home.penaltyType === 'SCORED'
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-red-100 text-red-500'
                  }`}
                >
                  {round.home.penaltyType === 'SCORED' ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                </div>
              )}
            </div>

            {/* Round number */}
            <span className="shrink-0 w-5 text-center text-[10px] text-muted-foreground/50 font-medium">
              {i + 1}
            </span>

            {/* Away */}
            <div className="flex-1 flex items-center gap-1.5">
              {round.away && (
                <div
                  className={`shrink-0 flex items-center justify-center h-5 w-5 rounded-full ${
                    round.away.penaltyType === 'SCORED'
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-red-100 text-red-500'
                  }`}
                >
                  {round.away.penaltyType === 'SCORED' ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                </div>
              )}
              <span
                className={`truncate ${round.away?.penaltyType === 'MISSED' ? 'text-muted-foreground/50 line-through' : ''}`}
              >
                {playerName(round.away)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t text-sm font-bold">
        <span>{match.score?.penalty?.home}</span>
        <span className="text-muted-foreground/50 text-xs">-</span>
        <span>{match.score?.penalty?.away}</span>
      </div>
    </div>
  )
}
