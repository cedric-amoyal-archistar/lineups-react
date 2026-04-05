import type { Match, MatchEvent } from '@/types/match'

export function formatTime(dateTime: string): string {
  const d = new Date(dateTime)
  const h = d.getHours()
  const m = d.getMinutes()
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${h >= 12 ? 'pm' : 'am'}`
}

export function localDate(dateTime: string): string {
  const d = new Date(dateTime)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Full match info string: round · matchday/leg/aggregate */
export function matchInfo(match: Match): string {
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

/** Short extra info string used in MatchCard below the score */
export function extraInfo(match: Match): string {
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

export function getUefaUrl(match: Match): string {
  const slug = (name: string) => name.toLowerCase().replace(/\s+/g, '-')
  const home = slug(match.homeTeam.internationalName)
  const away = slug(match.awayTeam.internationalName)
  return `https://www.uefa.com/uefachampionsleague/match/${match.id}--${home}-vs-${away}/`
}

export function getPlayerName(player: {
  clubShirtName: string
  internationalName: string
}): string {
  return player.clubShirtName || player.internationalName
}

export function formatMinute(event: MatchEvent): string {
  const min = event.time.minute + "'"
  if (event.time.injuryMinute) return `${min}+${event.time.injuryMinute}`
  return min
}

export function goalLabel(event: MatchEvent): string {
  const min = formatMinute(event)
  if (event.goalType === 'PENALTY') return `${min} (P)`
  if (event.goalType === 'OWN_GOAL') return `${min} (OG)`
  return min
}

export function seasonLabel(year: number): string {
  if (year >= 2008) return `${year - 1}/${String(year).slice(2)}`
  return `${year}/${String(year + 1).slice(2)}`
}

export function formatRound(match: Match): string {
  return match.round.metaData.name
}

export function currentSeason(): number {
  const now = new Date()
  return now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear()
}
