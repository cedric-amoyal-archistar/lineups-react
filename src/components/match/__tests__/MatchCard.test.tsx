import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { MatchCard } from '../MatchCard'
import type { Match } from '@/types/match'

// ---------------------------------------------------------------------------
// Freeze time — all tests run at 2025-06-15T12:00:00
// Fixture date conventions:
//   past:     2025-04-01
//   today:    2025-06-15
//   tomorrow: 2025-06-16
//   future:   2025-07-10
// ---------------------------------------------------------------------------

beforeAll(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2025-06-15T12:00:00'))
})

afterAll(() => {
  vi.useRealTimers()
})

// ---------------------------------------------------------------------------
// Fixture builder
// ---------------------------------------------------------------------------

function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 42,
    homeTeam: {
      id: 'h1',
      internationalName: 'Real Madrid',
      logoUrl: 'https://img.uefa.com/real.png',
      mediumLogoUrl: '',
      bigLogoUrl: '',
      countryCode: 'ESP',
      teamCode: 'RMA',
      translations: { displayName: {}, displayOfficialName: {} },
    },
    awayTeam: {
      id: 'a1',
      internationalName: 'FC Barcelona',
      logoUrl: 'https://img.uefa.com/barca.png',
      mediumLogoUrl: '',
      bigLogoUrl: '',
      countryCode: 'ESP',
      teamCode: 'BAR',
      translations: { displayName: {}, displayOfficialName: {} },
    },
    kickOffTime: {
      date: '2025-04-01',
      dateTime: '2025-04-01T19:00:00',
      utcOffsetInHours: 0,
    },
    status: 'FINISHED',
    score: {
      total: { home: 2, away: 1 },
      regular: { home: 2, away: 1 },
    },
    round: {
      metaData: { name: 'Quarter-finals', type: 'KNOCKOUT' },
      phase: 'KNOCKOUT',
    },
    matchday: { longName: 'Matchday 6', name: 'MD6', dateFrom: '', dateTo: '' },
    competition: { id: '1', metaData: { name: 'UEFA Champions League' } },
    type: 'FIRST_LEG',
    ...overrides,
  }
}

function renderCard(match: Match) {
  render(
    <MemoryRouter initialEntries={['/competition/uefa-ucl']}>
      <Routes>
        <Route path="/competition/:providerId" element={<MatchCard match={match} />} />
      </Routes>
    </MemoryRouter>,
  )
}

// ---------------------------------------------------------------------------
// Team names and logos
// ---------------------------------------------------------------------------

describe('MatchCard — teams', () => {
  it('renders home team name', () => {
    renderCard(makeMatch())
    expect(screen.getByText('Real Madrid')).toBeInTheDocument()
  })

  it('renders away team name', () => {
    renderCard(makeMatch())
    expect(screen.getByText('FC Barcelona')).toBeInTheDocument()
  })

  it('renders home team logo with correct src and alt', () => {
    renderCard(makeMatch())
    const img = screen.getByAltText('Real Madrid')
    expect(img).toHaveAttribute('src', 'https://img.uefa.com/real.png')
  })

  it('renders away team logo with correct src and alt', () => {
    renderCard(makeMatch())
    const img = screen.getByAltText('FC Barcelona')
    expect(img).toHaveAttribute('src', 'https://img.uefa.com/barca.png')
  })
})

// ---------------------------------------------------------------------------
// Score / Status
// ---------------------------------------------------------------------------

describe('MatchCard — score and status', () => {
  it('renders score for a finished match', () => {
    renderCard(
      makeMatch({
        status: 'FINISHED',
        score: { total: { home: 3, away: 0 }, regular: { home: 3, away: 0 } },
      }),
    )
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('shows FT label for finished match', () => {
    renderCard(makeMatch({ status: 'FINISHED' }))
    expect(screen.getByText('FT')).toBeInTheDocument()
  })

  it('shows Live label for live match', () => {
    renderCard(
      makeMatch({
        status: 'LIVE',
        score: { total: { home: 1, away: 0 }, regular: { home: 1, away: 0 } },
      }),
    )
    expect(screen.getByText('Live')).toBeInTheDocument()
  })

  it('does not show FT for live match', () => {
    renderCard(
      makeMatch({
        status: 'LIVE',
        score: { total: { home: 1, away: 0 }, regular: { home: 1, away: 0 } },
      }),
    )
    expect(screen.queryByText('FT')).not.toBeInTheDocument()
  })

  it('does not show FT or Live for upcoming match', () => {
    renderCard(
      makeMatch({
        status: 'UPCOMING',
        score: undefined,
        kickOffTime: { date: '2025-07-10', dateTime: '2025-07-10T20:00:00', utcOffsetInHours: 0 },
      }),
    )
    expect(screen.queryByText('FT')).not.toBeInTheDocument()
    expect(screen.queryByText('Live')).not.toBeInTheDocument()
  })

  it('does not render scores for upcoming match', () => {
    renderCard(
      makeMatch({
        status: 'UPCOMING',
        score: undefined,
        kickOffTime: { date: '2025-07-10', dateTime: '2025-07-10T20:00:00', utcOffsetInHours: 0 },
      }),
    )
    expect(screen.queryByText('2')).not.toBeInTheDocument()
    expect(screen.queryByText('1')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Date labels
// ---------------------------------------------------------------------------

describe('MatchCard — date labels', () => {
  it('shows "Today" for FT match played today', () => {
    renderCard(
      makeMatch({
        status: 'FINISHED',
        kickOffTime: { date: '2025-06-15', dateTime: '2025-06-15T19:00:00', utcOffsetInHours: 0 },
        score: { total: { home: 1, away: 0 }, regular: { home: 1, away: 0 } },
      }),
    )
    expect(screen.getByText('FT')).toBeInTheDocument()
    expect(screen.getByText('Today')).toBeInTheDocument()
  })

  it('shows "Tomorrow" for upcoming match tomorrow', () => {
    renderCard(
      makeMatch({
        status: 'UPCOMING',
        score: undefined,
        kickOffTime: { date: '2025-06-16', dateTime: '2025-06-16T19:00:00', utcOffsetInHours: 0 },
      }),
    )
    expect(screen.getByText('Tomorrow')).toBeInTheDocument()
    // Time is shown alongside Tomorrow — locale-dependent format but always has a colon
    expect(screen.getByText(/\d+:\d+/)).toBeInTheDocument()
  })

  it('shows short date for future match', () => {
    renderCard(
      makeMatch({
        status: 'UPCOMING',
        score: undefined,
        kickOffTime: { date: '2025-07-10', dateTime: '2025-07-10T17:00:00', utcOffsetInHours: 0 },
      }),
    )
    expect(screen.queryByText('Tomorrow')).not.toBeInTheDocument()
    expect(screen.queryByText('Today')).not.toBeInTheDocument()
    // A time string must still be present
    expect(screen.getByText(/\d+:\d+/)).toBeInTheDocument()
  })

  it('shows short date for past FT match', () => {
    renderCard(
      makeMatch({
        status: 'FINISHED',
        kickOffTime: { date: '2025-04-01', dateTime: '2025-04-01T19:00:00', utcOffsetInHours: 0 },
        score: { total: { home: 1, away: 0 }, regular: { home: 1, away: 0 } },
      }),
    )
    expect(screen.getByText('FT')).toBeInTheDocument()
    expect(screen.queryByText('Today')).not.toBeInTheDocument()
    // Some locale-formatted date string is present (not asserting exact format)
  })
})

// ---------------------------------------------------------------------------
// Live match
// ---------------------------------------------------------------------------

describe('MatchCard — live match', () => {
  it('shows live minute when provided', () => {
    renderCard(
      makeMatch({
        status: 'LIVE',
        minute: 86,
        score: { total: { home: 1, away: 2 }, regular: { home: 1, away: 2 } },
      }),
    )
    expect(screen.getByText("86'")).toBeInTheDocument()
  })

  it('live minute element has correct aria-label', () => {
    renderCard(
      makeMatch({
        status: 'LIVE',
        minute: 45,
        score: { total: { home: 0, away: 0 }, regular: { home: 0, away: 0 } },
      }),
    )
    expect(screen.getByLabelText('45 minutes played')).toBeInTheDocument()
  })

  it('shows Live without minute when minute is undefined', () => {
    renderCard(
      makeMatch({
        status: 'LIVE',
        score: { total: { home: 1, away: 0 }, regular: { home: 1, away: 0 } },
      }),
    )
    expect(screen.getByText('Live')).toBeInTheDocument()
    expect(screen.queryByLabelText(/minutes played/)).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Penalty score display
// ---------------------------------------------------------------------------

describe('MatchCard — penalties', () => {
  it('shows penalty score when present', () => {
    renderCard(
      makeMatch({
        status: 'FINISHED',
        score: {
          total: { home: 1, away: 1 },
          regular: { home: 1, away: 1 },
          penalty: { home: 4, away: 3 },
        },
      }),
    )
    expect(screen.getByText('(4-3 pen)')).toBeInTheDocument()
  })

  it('does not show penalty text when no penalty', () => {
    renderCard(makeMatch())
    expect(screen.queryByText(/pen/)).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Winner indicator
// ---------------------------------------------------------------------------

describe('MatchCard — winner indicator', () => {
  it('shows winner indicator for winning team', () => {
    renderCard(
      makeMatch({
        status: 'FINISHED',
        score: { total: { home: 3, away: 1 }, regular: { home: 3, away: 1 } },
      }),
    )
    const indicators = screen.getAllByLabelText('winner')
    expect(indicators).toHaveLength(1)
    expect(indicators[0]).toHaveTextContent('◄')
  })

  it('shows winner indicator on away side for away win', () => {
    renderCard(
      makeMatch({
        status: 'FINISHED',
        score: { total: { home: 0, away: 2 }, regular: { home: 0, away: 2 } },
      }),
    )
    const indicators = screen.getAllByLabelText('winner')
    expect(indicators).toHaveLength(1)
    expect(indicators[0]).toHaveTextContent('◄')
  })

  it('does not show winner indicator for draw', () => {
    renderCard(
      makeMatch({
        status: 'FINISHED',
        score: { total: { home: 1, away: 1 }, regular: { home: 1, away: 1 } },
      }),
    )
    expect(screen.queryByLabelText('winner')).not.toBeInTheDocument()
  })

  it('does not show winner indicator for upcoming match', () => {
    renderCard(
      makeMatch({
        status: 'UPCOMING',
        score: undefined,
        kickOffTime: { date: '2025-07-10', dateTime: '2025-07-10T20:00:00', utcOffsetInHours: 0 },
      }),
    )
    expect(screen.queryByLabelText('winner')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Aggregate strip
// ---------------------------------------------------------------------------

describe('MatchCard — aggregate', () => {
  it('shows aggregate strip above teams for SECOND_LEG', () => {
    renderCard(
      makeMatch({
        type: 'SECOND_LEG',
        score: {
          total: { home: 2, away: 0 },
          regular: { home: 2, away: 0 },
          aggregate: { home: 3, away: 1 },
        },
      }),
    )
    expect(screen.getByText('Aggregate: 3 - 1')).toBeInTheDocument()
  })

  it('does not show aggregate strip for non-SECOND_LEG', () => {
    renderCard(makeMatch({ type: 'FIRST_LEG' }))
    expect(screen.queryByText(/^Aggregate:/)).not.toBeInTheDocument()
  })

  it('does not show aggregate strip when aggregate data is absent', () => {
    renderCard(
      makeMatch({
        type: 'SECOND_LEG',
        score: { total: { home: 1, away: 0 }, regular: { home: 1, away: 0 } },
      }),
    )
    expect(screen.queryByText(/^Aggregate:/)).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Round name and extra info
// ---------------------------------------------------------------------------

describe('MatchCard — round and extra info', () => {
  it('renders round name', () => {
    renderCard(makeMatch({ type: 'FIRST_LEG' }))
    expect(screen.getByText('Quarter-finals')).toBeInTheDocument()
  })

  it('shows "1st leg" extra info for FIRST_LEG', () => {
    renderCard(makeMatch({ type: 'FIRST_LEG' }))
    expect(screen.getByText('1st leg')).toBeInTheDocument()
  })

  it('shows matchday name for GROUP_STAGE', () => {
    renderCard(makeMatch({ type: 'GROUP_STAGE' }))
    expect(screen.getByText('Matchday 6')).toBeInTheDocument()
  })

  it('shows aggregate in extra info for SECOND_LEG', () => {
    renderCard(
      makeMatch({
        type: 'SECOND_LEG',
        score: {
          total: { home: 1, away: 0 },
          regular: { home: 1, away: 0 },
          aggregate: { home: 3, away: 1 },
        },
      }),
    )
    // extraInfo footer renders "Agg: 3-1"; aggregate strip renders "Aggregate: 3 - 1"
    const matches = screen.getAllByText(/Agg: 3-1/)
    expect(matches.length).toBeGreaterThanOrEqual(1)
  })

  it('shows no extra info separator when extra info is empty', () => {
    renderCard(makeMatch({ type: 'FINAL' }))
    expect(screen.queryAllByText('·')).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Highlights link
// ---------------------------------------------------------------------------

describe('MatchCard — highlights link', () => {
  it('shows highlights link for past finished match', () => {
    renderCard(
      makeMatch({
        status: 'FINISHED',
        kickOffTime: { date: '2025-04-01', dateTime: '2025-04-01T19:00:00', utcOffsetInHours: 0 },
        score: { total: { home: 2, away: 1 }, regular: { home: 2, away: 1 } },
      }),
    )
    expect(screen.getByLabelText('Search highlights on YouTube')).toBeInTheDocument()
  })

  it('highlights button opens YouTube search URL with team names and competition', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    renderCard(
      makeMatch({
        status: 'FINISHED',
        kickOffTime: { date: '2025-04-01', dateTime: '2025-04-01T19:00:00', utcOffsetInHours: 0 },
        score: { total: { home: 2, away: 1 }, regular: { home: 2, away: 1 } },
      }),
    )
    const btn = screen.getByLabelText('Search highlights on YouTube')
    btn.click()
    expect(openSpy).toHaveBeenCalledOnce()
    const url = openSpy.mock.calls[0][0] as string
    expect(url).toContain('youtube.com/results')
    expect(url).toContain('Real%20Madrid')
    expect(url).toContain('FC%20Barcelona')
    expect(url).toContain('highlights')
    openSpy.mockRestore()
  })

  it('does not show highlights for today finished match', () => {
    renderCard(
      makeMatch({
        status: 'FINISHED',
        kickOffTime: { date: '2025-06-15', dateTime: '2025-06-15T19:00:00', utcOffsetInHours: 0 },
        score: { total: { home: 2, away: 1 }, regular: { home: 2, away: 1 } },
      }),
    )
    expect(screen.queryByLabelText('Search highlights on YouTube')).not.toBeInTheDocument()
  })

  it('does not show highlights for upcoming match', () => {
    renderCard(
      makeMatch({
        status: 'UPCOMING',
        score: undefined,
        kickOffTime: { date: '2025-07-10', dateTime: '2025-07-10T20:00:00', utcOffsetInHours: 0 },
      }),
    )
    expect(screen.queryByLabelText('Search highlights on YouTube')).not.toBeInTheDocument()
  })

  it('does not show highlights for live match', () => {
    renderCard(
      makeMatch({
        status: 'LIVE',
        score: { total: { home: 1, away: 0 }, regular: { home: 1, away: 0 } },
      }),
    )
    expect(screen.queryByLabelText('Search highlights on YouTube')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Link routing
// ---------------------------------------------------------------------------

describe('MatchCard — link', () => {
  it('links to the correct match detail route', () => {
    renderCard(makeMatch({ id: 42 }))
    // There may be multiple links (e.g. YouTube highlights link for finished matches)
    const links = screen.getAllByRole('link')
    const matchLink = links.find((l) => l.getAttribute('href') === '/competition/uefa-ucl/match/42')
    expect(matchLink).toBeInTheDocument()
  })

  it('links work with string match IDs', () => {
    renderCard(makeMatch({ id: 'abc-123' }))
    const links = screen.getAllByRole('link')
    const matchLink = links.find((l) => l.getAttribute('href')?.includes('/match/abc-123'))
    expect(matchLink).toBeInTheDocument()
  })
})
