import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { ExternalLink, Loader2 } from 'lucide-react'
import { useLayout } from '@/contexts/LayoutContext'
import { useMatch, useMatchLineups } from '@/hooks/useApi'
import { getProvider } from '@/providers/registry'
import { MatchEvents } from '@/components/match/MatchEvents'
import { PenaltyShootout } from '@/components/match/PenaltyShootout'
import { PitchView } from '@/components/lineup/PitchView'
import { fixInvalidCoordinates } from '@/lib/lineupCoordinates'
import { BenchList } from '@/components/lineup/BenchList'
import type { Match } from '@/types/match'

function formatTime(dateTime: string): string {
  const d = new Date(dateTime)
  const h = d.getHours()
  const m = d.getMinutes()
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${h >= 12 ? 'pm' : 'am'}`
}

function matchInfo(match: Match): string {
  const parts = [match.round.metaData.name]
  if (match.type === 'GROUP_STAGE' && match.matchday?.longName) {
    parts.push(match.matchday.longName)
  } else if (match.type === 'FIRST_LEG') {
    parts.push('1st leg')
  } else if (match.type === 'SECOND_LEG') {
    const agg = match.score?.aggregate
    parts.push('2nd leg')
    if (agg) parts.push(`Agg: ${agg.home}-${agg.away}`)
  }
  return parts.join('  ·  ')
}

export function MatchDetailPage() {
  const { id, providerId } = useParams<{ id: string; providerId: string }>()
  const matchId = Number(id)
  const provider = getProvider(providerId!)

  const { displayMode, setShowDisplaySelect, selectedProvider, setSelectedProvider } = useLayout()

  const matchQuery = useMatch(matchId)
  const lineupsQuery = useMatchLineups(matchId)

  const match = matchQuery.data
  const lineupsRaw = lineupsQuery.data
  const lineups = lineupsRaw?.homeTeam?.field?.length
    ? {
        ...lineupsRaw,
        homeTeam: {
          ...lineupsRaw.homeTeam,
          field: fixInvalidCoordinates(lineupsRaw.homeTeam.field),
        },
        awayTeam: {
          ...lineupsRaw.awayTeam,
          field: fixInvalidCoordinates(lineupsRaw.awayTeam.field),
        },
      }
    : null

  const loading = matchQuery.isLoading
  const error = matchQuery.error

  useEffect(() => {
    if (providerId && providerId !== selectedProvider) {
      setSelectedProvider(providerId)
    }
  }, [providerId, selectedProvider, setSelectedProvider])

  useEffect(() => {
    setShowDisplaySelect(true)
    return () => setShowDisplaySelect(false)
  }, [setShowDisplaySelect])

  return (
    <div className="mx-auto max-w-lg px-0 py-6">
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-5 text-center text-sm text-destructive">
          {error.message}
        </div>
      ) : match ? (
        <>
          {/* Round / Leg info + date */}
          <div className="mx-auto max-w-sm text-center mb-3 space-y-0.5">
            <div className="text-xs font-medium text-muted-foreground/60 tracking-wide">
              {matchInfo(match)}
            </div>
            <div className="text-[11px] text-muted-foreground/50">
              {new Date(match.kickOffTime.dateTime).toLocaleDateString(undefined, {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
              {' · '}
              {formatTime(match.kickOffTime.dateTime)}
            </div>
          </div>

          {/* Scoreboard */}
          <div className="mx-auto max-w-sm flex items-center justify-center gap-5 mb-2 py-4 px-6 rounded-2xl bg-card border shadow-sm">
            {/* Home team */}
            <div className="flex flex-col items-center gap-1.5">
              <img
                src={match.homeTeam.mediumLogoUrl}
                alt={match.homeTeam.internationalName}
                className="h-10 w-10"
              />
              <span className="text-xs font-semibold tracking-tight">
                {match.homeTeam.teamCode}
              </span>
            </div>

            {/* Score */}
            <div className="flex flex-col items-center">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-extrabold tabular-nums">
                  {match.score?.total.home ?? '-'}
                </span>
                <span className="text-lg text-muted-foreground/50 font-light">-</span>
                <span className="text-4xl font-extrabold tabular-nums">
                  {match.score?.total.away ?? '-'}
                </span>
              </div>
              {match.score?.penalty ? (
                <span className="text-xs text-muted-foreground mt-1">
                  ({match.score.penalty.home}-{match.score.penalty.away} pen)
                </span>
              ) : match.winner?.aggregate?.reason === 'WIN_ON_EXTRA_TIME' ||
                (match.score?.total.home === match.score?.total.away &&
                  match.score?.regular.home !== match.score?.total.home) ? (
                <span className="text-xs text-muted-foreground mt-1">(aet)</span>
              ) : null}
            </div>

            {/* Away team */}
            <div className="flex flex-col items-center gap-1.5">
              <img
                src={match.awayTeam.mediumLogoUrl}
                alt={match.awayTeam.internationalName}
                className="h-10 w-10"
              />
              <span className="text-xs font-semibold tracking-tight">
                {match.awayTeam.teamCode}
              </span>
            </div>
          </div>

          {/* Scorers & red cards */}
          <MatchEvents match={match} />

          {/* Penalty shootout */}
          {(match.playerEvents?.penaltyScorers?.length ?? 0) > 0 && (
            <div className="mt-4">
              <PenaltyShootout match={match} />
            </div>
          )}

          {/* Pitch */}
          {lineups ? (
            <>
              <div className="mt-4">
                <PitchView
                  lineups={lineups}
                  displayMode={displayMode}
                  matchDate={match.kickOffTime.dateTime}
                />
              </div>
              <div className="mt-5 space-y-3">
                <BenchList
                  lineup={lineups.homeTeam}
                  displayMode={displayMode}
                  matchDate={match.kickOffTime.dateTime}
                />
                <BenchList
                  lineup={lineups.awayTeam}
                  displayMode={displayMode}
                  matchDate={match.kickOffTime.dateTime}
                />
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-muted-foreground text-sm">
              Lineups not available yet for this match.
            </div>
          )}

          {/* UEFA link */}
          <div className="mt-5 mb-8 mx-auto max-w-sm">
            <a
              href={provider.getExternalUrl(match)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              View match details
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </>
      ) : (
        <div className="py-24 text-center text-muted-foreground text-sm">Match not found.</div>
      )}
    </div>
  )
}
