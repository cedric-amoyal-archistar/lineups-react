import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  formatTime,
  localDate,
  formatDate,
  matchInfo,
  extraInfo,
  getUefaUrl,
  getPlayerName,
  formatMinute,
  goalLabel,
  seasonLabel,
  formatRound,
  currentSeason,
} from './formatters'
import type { Match, MatchEvent } from '@/types/match'

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 1,
    homeTeam: {
      id: 'h1',
      internationalName: 'Real Madrid',
      logoUrl: '',
      mediumLogoUrl: '',
      bigLogoUrl: '',
      countryCode: 'ESP',
      teamCode: 'RMA',
      translations: { displayName: {}, displayOfficialName: {} },
    },
    awayTeam: {
      id: 'a1',
      internationalName: 'FC Barcelona',
      logoUrl: '',
      mediumLogoUrl: '',
      bigLogoUrl: '',
      countryCode: 'ESP',
      teamCode: 'BAR',
      translations: { displayName: {}, displayOfficialName: {} },
    },
    kickOffTime: {
      date: '2025-04-01',
      dateTime: '2025-04-01T19:00:00Z',
      utcOffsetInHours: 0,
    },
    status: 'FINISHED',
    round: {
      metaData: { name: 'Quarter-finals', type: 'KNOCKOUT' },
      phase: 'KNOCKOUT',
    },
    matchday: { longName: 'Matchday 6', name: 'MD6', dateFrom: '', dateTo: '' },
    competition: { id: '1', metaData: { name: 'UEFA Champions League' } },
    ...overrides,
  }
}

function makeEvent(overrides: Partial<MatchEvent> = {}): MatchEvent {
  return {
    id: 'evt-1',
    phase: 'FIRST_HALF',
    teamId: 'h1',
    time: { minute: 45, second: 0 },
    goalType: 'NORMAL',
    player: {
      clubShirtName: 'Vinicius Jr',
      internationalName: 'V. Junior',
      countryCode: 'BRA',
    },
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// formatTime
// ---------------------------------------------------------------------------

describe('formatTime', () => {
  it('formats midnight as 12:00 am', () => {
    // ISO string at UTC midnight
    expect(formatTime('2025-01-01T00:00:00')).toBe('12:00 am')
  })

  it('formats noon as 12:00 pm', () => {
    expect(formatTime('2025-01-01T12:00:00')).toBe('12:00 pm')
  })

  it('pads minutes with leading zero', () => {
    expect(formatTime('2025-01-01T14:05:00')).toBe('2:05 pm')
  })

  it('formats 1 am correctly', () => {
    expect(formatTime('2025-01-01T01:30:00')).toBe('1:30 am')
  })

  it('formats 11 pm correctly', () => {
    expect(formatTime('2025-01-01T23:59:00')).toBe('11:59 pm')
  })
})

// ---------------------------------------------------------------------------
// localDate
// ---------------------------------------------------------------------------

describe('localDate', () => {
  it('returns YYYY-MM-DD from a datetime string', () => {
    const result = localDate('2025-04-01T19:00:00')
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(result).toBe('2025-04-01')
  })

  it('pads month and day', () => {
    expect(localDate('2025-01-05T00:00:00')).toBe('2025-01-05')
  })
})

// ---------------------------------------------------------------------------
// formatDate
// ---------------------------------------------------------------------------

describe('formatDate', () => {
  it('returns a non-empty human-readable date string', () => {
    const result = formatDate('2025-04-01')
    // Exact output depends on locale, but must contain the year
    expect(result).toContain('2025')
    expect(result.length).toBeGreaterThan(5)
  })
})

// ---------------------------------------------------------------------------
// matchInfo
// ---------------------------------------------------------------------------

describe('matchInfo', () => {
  it('includes round name', () => {
    const match = makeMatch({ type: 'GROUP_STAGE' })
    expect(matchInfo(match)).toContain('Quarter-finals')
  })

  it('includes matchday long name for GROUP_STAGE', () => {
    const match = makeMatch({ type: 'GROUP_STAGE' })
    expect(matchInfo(match)).toContain('Matchday 6')
  })

  it('includes "1st leg" for FIRST_LEG', () => {
    const match = makeMatch({ type: 'FIRST_LEG' })
    expect(matchInfo(match)).toContain('1st leg')
  })

  it('includes "2nd leg" for SECOND_LEG', () => {
    const match = makeMatch({ type: 'SECOND_LEG' })
    expect(matchInfo(match)).toContain('2nd leg')
  })

  it('includes aggregate score in 2nd leg', () => {
    const match = makeMatch({
      type: 'SECOND_LEG',
      score: {
        total: { home: 1, away: 0 },
        regular: { home: 1, away: 0 },
        aggregate: { home: 3, away: 1 },
      },
    })
    expect(matchInfo(match)).toContain('Agg: 3-1')
  })
})

// ---------------------------------------------------------------------------
// extraInfo
// ---------------------------------------------------------------------------

describe('extraInfo', () => {
  it('returns matchday name for GROUP_STAGE', () => {
    const match = makeMatch({ type: 'GROUP_STAGE' })
    expect(extraInfo(match)).toBe('Matchday 6')
  })

  it('returns "1st leg" for FIRST_LEG', () => {
    const match = makeMatch({ type: 'FIRST_LEG' })
    expect(extraInfo(match)).toBe('1st leg')
  })

  it('returns empty string for unknown type', () => {
    const match = makeMatch({ type: 'FINAL' })
    expect(extraInfo(match)).toBe('')
  })

  it('includes aggregate for SECOND_LEG', () => {
    const match = makeMatch({
      type: 'SECOND_LEG',
      score: {
        total: { home: 1, away: 0 },
        regular: { home: 1, away: 0 },
        aggregate: { home: 2, away: 1 },
      },
    })
    const result = extraInfo(match)
    expect(result).toContain('2nd leg')
    expect(result).toContain('Agg: 2-1')
  })

  it('includes penalty score for SECOND_LEG', () => {
    const match = makeMatch({
      type: 'SECOND_LEG',
      score: {
        total: { home: 1, away: 1 },
        regular: { home: 1, away: 1 },
        penalty: { home: 4, away: 3 },
      },
    })
    const result = extraInfo(match)
    expect(result).toContain('(4-3 pen)')
  })

  it('includes "(aet)" when winner is on extra time', () => {
    const match = makeMatch({
      type: 'SECOND_LEG',
      winner: { aggregate: { reason: 'WIN_ON_EXTRA_TIME' } },
    })
    const result = extraInfo(match)
    expect(result).toContain('(aet)')
  })
})

// ---------------------------------------------------------------------------
// getUefaUrl
// ---------------------------------------------------------------------------

describe('getUefaUrl', () => {
  it('generates a url with match id and slugified team names', () => {
    const match = makeMatch()
    const url = getUefaUrl(match)
    expect(url).toContain('/1--real-madrid-vs-fc-barcelona/')
    expect(url.startsWith('https://www.uefa.com/uefachampionsleague/match/')).toBe(true)
  })

  it('replaces spaces with hyphens', () => {
    const match = makeMatch()
    const url = getUefaUrl(match)
    expect(url).not.toContain(' ')
  })

  it('lowercases team names', () => {
    const match = makeMatch()
    const url = getUefaUrl(match)
    expect(url).toBe(url.toLowerCase())
  })
})

// ---------------------------------------------------------------------------
// getPlayerName
// ---------------------------------------------------------------------------

describe('getPlayerName', () => {
  it('prefers clubShirtName when set', () => {
    expect(getPlayerName({ clubShirtName: 'Vini Jr', internationalName: 'V. Junior' })).toBe(
      'Vini Jr',
    )
  })

  it('falls back to internationalName when clubShirtName is empty', () => {
    expect(getPlayerName({ clubShirtName: '', internationalName: 'V. Junior' })).toBe('V. Junior')
  })
})

// ---------------------------------------------------------------------------
// formatMinute
// ---------------------------------------------------------------------------

describe('formatMinute', () => {
  it('formats a regular minute', () => {
    const event = makeEvent({ time: { minute: 45, second: 0 } })
    expect(formatMinute(event)).toBe("45'")
  })

  it('includes injury time when present', () => {
    const event = makeEvent({ time: { minute: 90, second: 0, injuryMinute: 3 } })
    expect(formatMinute(event)).toBe("90'+3")
  })

  it('does not include "+0" when injuryMinute is undefined', () => {
    const event = makeEvent({ time: { minute: 30, second: 0 } })
    expect(formatMinute(event)).toBe("30'")
    expect(formatMinute(event)).not.toContain('+')
  })
})

// ---------------------------------------------------------------------------
// goalLabel
// ---------------------------------------------------------------------------

describe('goalLabel', () => {
  it('returns plain minute for normal goal', () => {
    const event = makeEvent({ time: { minute: 22, second: 0 }, goalType: 'NORMAL' })
    expect(goalLabel(event)).toBe("22'")
  })

  it('appends (P) for penalty', () => {
    const event = makeEvent({ time: { minute: 55, second: 0 }, goalType: 'PENALTY' })
    expect(goalLabel(event)).toBe("55' (P)")
  })

  it('appends (OG) for own goal', () => {
    const event = makeEvent({ time: { minute: 10, second: 0 }, goalType: 'OWN_GOAL' })
    expect(goalLabel(event)).toBe("10' (OG)")
  })

  it('includes injury time in penalty label', () => {
    const event = makeEvent({
      time: { minute: 45, second: 0, injuryMinute: 2 },
      goalType: 'PENALTY',
    })
    expect(goalLabel(event)).toBe("45'+2 (P)")
  })
})

// ---------------------------------------------------------------------------
// seasonLabel
// ---------------------------------------------------------------------------

describe('seasonLabel', () => {
  it('formats 2024 as 2023/24', () => {
    expect(seasonLabel(2024)).toBe('2023/24')
  })

  it('formats 2025 as 2024/25', () => {
    expect(seasonLabel(2025)).toBe('2024/25')
  })

  it('formats 2010 as 2009/10', () => {
    expect(seasonLabel(2010)).toBe('2009/10')
  })

  it('formats pre-2008 years in reverse direction', () => {
    // year < 2008: format is year/year+1
    expect(seasonLabel(2007)).toBe('2007/08')
  })
})

// ---------------------------------------------------------------------------
// formatRound
// ---------------------------------------------------------------------------

describe('formatRound', () => {
  it('returns the round metaData name', () => {
    const match = makeMatch({
      round: { metaData: { name: 'Semi-finals', type: 'KNOCKOUT' }, phase: 'KNOCKOUT' },
    })
    expect(formatRound(match)).toBe('Semi-finals')
  })

  it('returns group stage round name', () => {
    const match = makeMatch({
      round: { metaData: { name: 'League Phase', type: 'GROUP' }, phase: 'GROUP' },
    })
    expect(formatRound(match)).toBe('League Phase')
  })
})

// ---------------------------------------------------------------------------
// currentSeason
// ---------------------------------------------------------------------------

describe('currentSeason', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns current year + 1 when month is July or later (season started)', () => {
    // July = month index 6
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-07-01T12:00:00Z'))
    expect(currentSeason()).toBe(2026)
  })

  it('returns current year when month is before July (still previous season)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-06-30T12:00:00Z'))
    expect(currentSeason()).toBe(2025)
  })

  it('returns current year + 1 in December', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-12-01T12:00:00Z'))
    expect(currentSeason()).toBe(2026)
  })

  it('returns current year in January', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'))
    expect(currentSeason()).toBe(2026)
  })
})
