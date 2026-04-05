import { memo } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Match } from '@/types/match'

function formatTime(dateTime: string): string {
  const d = new Date(dateTime)
  const h = d.getHours()
  const m = d.getMinutes()
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${h >= 12 ? 'pm' : 'am'}`
}

function formatRound(match: Match): string {
  return match.round.metaData.name
}

function extraInfo(match: Match): string {
  if (match.type === 'GROUP_STAGE') {
    return match.matchday?.longName ?? ''
  }
  if (match.type === 'FIRST_LEG') {
    return '1st leg'
  }
  if (match.type === 'SECOND_LEG') {
    const agg = match.score?.aggregate
    const parts = ['2nd leg']
    if (agg) parts.push(`Agg: ${agg.home}-${agg.away}`)
    const pen = match.score?.penalty
    if (pen) {
      parts.push(`(${pen.home}-${pen.away} pen)`)
    } else if (match.winner?.aggregate?.reason === 'WIN_ON_EXTRA_TIME') {
      parts.push('(aet)')
    }
    return parts.join(' · ')
  }
  return ''
}

interface MatchCardProps {
  match: Match
}

export const MatchCard = memo(function MatchCard({ match }: MatchCardProps) {
  const { providerId } = useParams<{ providerId: string }>()
  const isFinished = match.status === 'FINISHED'
  const isLive = match.status === 'LIVE'
  const info = extraInfo(match)
  const penalty = match.score?.penalty

  return (
    <Link to={`/competition/${providerId}/match/${match.id}`} className="block group">
      <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm transition-all group-hover:shadow-md group-hover:border-border/80 group-active:scale-[0.99]">
        {/* Home team */}
        <div className="flex flex-1 items-center justify-end gap-2.5 min-w-0">
          <span className="truncate text-sm font-medium text-right">
            {match.homeTeam.internationalName}
          </span>
          <img
            src={match.homeTeam.logoUrl}
            alt={match.homeTeam.internationalName}
            className="h-8 w-8 shrink-0"
          />
        </div>

        {/* Score / Time */}
        <div className="flex flex-col items-center shrink-0 w-20">
          {isFinished || isLive ? (
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tabular-nums">{match.score?.total.home}</span>
              <span className="text-muted-foreground text-xs">-</span>
              <span className="text-lg font-bold tabular-nums">{match.score?.total.away}</span>
            </div>
          ) : (
            <span className="text-xs font-medium text-muted-foreground">
              {formatTime(match.kickOffTime.dateTime)}
            </span>
          )}
          {penalty && (
            <span className="text-[10px] font-medium text-muted-foreground/70">
              ({penalty.home}-{penalty.away} pen)
            </span>
          )}
          {isLive ? (
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide">
              Live
            </span>
          ) : isFinished ? (
            <span className="text-[10px] font-medium text-muted-foreground/70">FT</span>
          ) : null}
        </div>

        {/* Away team */}
        <div className="flex flex-1 items-center gap-2.5 min-w-0">
          <img
            src={match.awayTeam.logoUrl}
            alt={match.awayTeam.internationalName}
            className="h-8 w-8 shrink-0"
          />
          <span className="truncate text-sm font-medium">
            {match.awayTeam.internationalName}
          </span>
        </div>
      </div>

      {/* Round + extra info */}
      <div className="mt-1.5 flex items-center justify-center gap-2">
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
    </Link>
  )
})
