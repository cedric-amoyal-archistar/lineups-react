import { memo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Play } from 'lucide-react'
import type { Match } from '@/types/match'
import { getProvider } from '@/providers/registry'
import { cn } from '@/lib/utils'
import {
  formatTime,
  formatRound,
  extraInfo,
  isToday,
  isTomorrow,
  formatDateShort,
  getWinnerSide,
} from '@/lib/formatters'

function getRedCardCount(match: Match, teamId: string): number {
  return match.playerEvents?.redCards?.filter((rc) => rc.teamId === teamId).length ?? 0
}

function buildYouTubeSearchUrl(match: Match): string {
  const home = match.homeTeam.internationalName
  const away = match.awayTeam.internationalName
  const competition = match.competition.metaData.name
  const d = new Date(match.kickOffTime.dateTime)
  const date = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const q = encodeURIComponent(`${home} vs ${away} highlights ${competition} ${date}`)
  return `https://www.youtube.com/results?search_query=${q}`
}

function RightColumn({ match }: { match: Match }) {
  const isFinished = match.status === 'FINISHED'
  const today = isToday(match.kickOffTime.dateTime)
  const tomorrow = isTomorrow(match.kickOffTime.dateTime)

  if (match.status === 'LIVE') {
    const minuteStr = match.minute != null ? `${match.minute}'` : null
    return (
      <div className="flex flex-col items-center justify-center gap-1">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-sm font-bold text-emerald-500 uppercase tracking-wide">Live</span>
        </div>
        {minuteStr && (
          <span
            className="text-sm font-medium text-emerald-500/80 tabular-nums"
            aria-label={`${match.minute} minutes played`}
          >
            {minuteStr}
          </span>
        )}
      </div>
    )
  }

  if (isFinished) {
    const dateLabel = today ? 'Today' : formatDateShort(match.kickOffTime.dateTime)
    return (
      <div className="flex flex-col items-center justify-center gap-1">
        <span className="text-[13px] font-bold text-foreground">FT</span>
        <span className="text-xs text-muted-foreground">{dateLabel}</span>
        {!today && (
          <button
            type="button"
            aria-label="Search highlights on YouTube"
            className="mt-1 flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[10px] font-medium
              text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              window.open(buildYouTubeSearchUrl(match), '_blank', 'noopener,noreferrer')
            }}
          >
            <Play className="h-2.5 w-2.5" />
            Highlights
          </button>
        )}
      </div>
    )
  }

  // UPCOMING
  if (tomorrow) {
    return (
      <div className="flex flex-col items-center justify-center gap-0.5">
        <span className="text-xs font-medium text-muted-foreground">Tomorrow</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatTime(match.kickOffTime.dateTime)}
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-0.5">
      <span className="text-xs font-medium text-muted-foreground">
        {formatDateShort(match.kickOffTime.dateTime)}
      </span>
      <span className="text-xs text-muted-foreground tabular-nums">
        {formatTime(match.kickOffTime.dateTime)}
      </span>
    </div>
  )
}

interface MatchCardProps {
  match: Match
}

export const MatchCard = memo(function MatchCard({ match }: MatchCardProps) {
  const { providerId } = useParams<{ providerId: string }>()
  const [searchParams] = useSearchParams()
  const isFinished = match.status === 'FINISHED'
  const isLive = match.status === 'LIVE'
  const hasScore = isFinished || isLive
  const info = extraInfo(match)
  const penalty = match.score?.penalty
  const aggregate = match.score?.aggregate
  const qs = searchParams.toString()
  const matchUrl = `/competition/${providerId}/match/${match.id}${qs ? `?${qs}` : ''}`
  const winner = hasScore ? getWinnerSide(match) : null
  const homeRedCards = getRedCardCount(match, match.homeTeam.id)
  const awayRedCards = getRedCardCount(match, match.awayTeam.id)
  const competitionType = providerId ? getProvider(providerId).competitionType : 'club-cup'
  const logoClass = cn(
    'shrink-0',
    competitionType === 'national' ? 'h-4 w-6 rounded-sm' : 'h-7 w-7',
  )

  return (
    <div className="flex flex-col gap-1.5">
      <Link to={matchUrl} className="block group">
        <div
          className="rounded-xl border bg-card shadow-sm transition-all overflow-hidden
            group-hover:shadow-md group-hover:border-border/80 group-active:scale-[0.99]"
        >
          {/* Aggregate strip — only for 2nd leg with known aggregate */}
          {match.type === 'SECOND_LEG' && aggregate && (
            <div className="border-b border-border/40 px-4 py-1.5">
              <span className="text-xs text-muted-foreground/70">
                Aggregate: {aggregate.home} - {aggregate.away}
              </span>
            </div>
          )}

          {/* Two-column body */}
          <div className="flex items-stretch">
            {/* Left column: stacked team rows */}
            <div className="flex flex-1 flex-col min-w-0 py-3 px-4 gap-2.5">
              {/* Home team row */}
              <div className="relative flex items-center gap-3 min-w-0">
                <img
                  src={match.homeTeam.logoUrl}
                  alt={match.homeTeam.internationalName}
                  className={logoClass}
                />
                <span className="truncate text-[13px] font-medium">
                  {match.homeTeam.internationalName}
                </span>
                {homeRedCards > 0 && (
                  <span
                    className="flex items-center gap-0.5 shrink-0"
                    aria-label={`${homeRedCards} red card${homeRedCards > 1 ? 's' : ''}`}
                  >
                    {Array.from({ length: homeRedCards }, (_, i) => (
                      <span key={i} className="inline-block w-2.5 h-3.5 rounded-[2px] bg-red-600" />
                    ))}
                  </span>
                )}
                {hasScore && (
                  <span className="ml-auto shrink-0 text-[17px] font-bold tabular-nums">
                    {match.score?.total.home}
                  </span>
                )}
                {winner === 'home' && (
                  <span
                    className="absolute -right-4 shrink-0 text-xs text-muted-foreground/70"
                    aria-label="winner"
                  >
                    ◄
                  </span>
                )}
              </div>

              {/* Away team row */}
              <div className="relative flex items-center gap-3 min-w-0">
                <img
                  src={match.awayTeam.logoUrl}
                  alt={match.awayTeam.internationalName}
                  className={logoClass}
                />
                <span className="truncate text-[13px] font-medium">
                  {match.awayTeam.internationalName}
                </span>
                {awayRedCards > 0 && (
                  <span
                    className="flex items-center gap-0.5 shrink-0"
                    aria-label={`${awayRedCards} red card${awayRedCards > 1 ? 's' : ''}`}
                  >
                    {Array.from({ length: awayRedCards }, (_, i) => (
                      <span key={i} className="inline-block w-2.5 h-3.5 rounded-[2px] bg-red-600" />
                    ))}
                  </span>
                )}
                {hasScore && (
                  <span className="ml-auto shrink-0 text-[17px] font-bold tabular-nums">
                    {match.score?.total.away}
                  </span>
                )}
                {winner === 'away' && (
                  <span
                    className="absolute -right-4 shrink-0 text-xs text-muted-foreground/70"
                    aria-label="winner"
                  >
                    ◄
                  </span>
                )}
              </div>

              {/* Penalty score */}
              {penalty && (
                <span className="text-[10px] font-medium text-muted-foreground/70 ml-11">
                  ({penalty.home}-{penalty.away} pen)
                </span>
              )}
            </div>

            {/* Right column: status */}
            <div className="flex w-28 shrink-0 items-center justify-center border-l border-border/40 px-3 py-3">
              <RightColumn match={match} />
            </div>
          </div>
        </div>
      </Link>

      {/* Round + extra info below card — hidden for gameweek competitions */}
      {match.round.metaData.type !== 'MATCHDAY' && (
        <div className="flex items-center justify-center gap-2 px-1">
          <span className="text-[10px] font-medium text-muted-foreground/60 tracking-wide">
            {formatRound(match)}
          </span>
          {info && (
            <>
              <span className="text-[10px] text-muted-foreground/60">·</span>
              <span className="text-[10px] font-medium text-muted-foreground/60 tracking-wide">
                {info}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  )
})
