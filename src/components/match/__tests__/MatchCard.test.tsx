import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { MatchCard } from '../MatchCard'
import type { Match } from '@/types/match'

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
// Score / Time / Status
// ---------------------------------------------------------------------------

describe('MatchCard — score and status', () => {
  it('renders score for a finished match', () => {
    renderCard(makeMatch({ status: 'FINISHED', score: { total: { home: 3, away: 0 }, regular: { home: 3, away: 0 } } }))
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('shows FT label for finished match', () => {
    renderCard(makeMatch({ status: 'FINISHED' }))
    expect(screen.getByText('FT')).toBeInTheDocument()
  })

  it('shows Live label for live match', () => {
    renderCard(makeMatch({ status: 'LIVE', score: { total: { home: 1, away: 0 }, regular: { home: 1, away: 0 } } }))
    expect(screen.getByText('Live')).toBeInTheDocument()
  })

  it('does not show FT for live match', () => {
    renderCard(makeMatch({ status: 'LIVE', score: { total: { home: 1, away: 0 }, regular: { home: 1, away: 0 } } }))
    expect(screen.queryByText('FT')).not.toBeInTheDocument()
  })

  it('renders kickoff time for upcoming match', () => {
    renderCard(makeMatch({
      status: 'UPCOMING',
      score: undefined,
      kickOffTime: { date: '2025-04-01', dateTime: '2025-04-01T19:00:00', utcOffsetInHours: 0 },
    }))
    // Should show time string, not score
    expect(screen.queryByText('FT')).not.toBeInTheDocument()
    expect(screen.queryByText('Live')).not.toBeInTheDocument()
    // Time appears — exact format is locale-dependent but will contain colon
    const link = screen.getByRole('link')
    expect(link).toBeInTheDocument()
  })

  it('does not show FT or Live for upcoming match', () => {
    renderCard(makeMatch({ status: 'UPCOMING', score: undefined }))
    expect(screen.queryByText('FT')).not.toBeInTheDocument()
    expect(screen.queryByText('Live')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Penalty score display
// ---------------------------------------------------------------------------

describe('MatchCard — penalties', () => {
  it('shows penalty score when present', () => {
    renderCard(makeMatch({
      status: 'FINISHED',
      score: {
        total: { home: 1, away: 1 },
        regular: { home: 1, away: 1 },
        penalty: { home: 4, away: 3 },
      },
    }))
    expect(screen.getByText('(4-3 pen)')).toBeInTheDocument()
  })

  it('does not show penalty text when no penalty', () => {
    renderCard(makeMatch())
    expect(screen.queryByText(/pen/)).not.toBeInTheDocument()
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

  it('shows aggregate for SECOND_LEG', () => {
    renderCard(makeMatch({
      type: 'SECOND_LEG',
      score: { total: { home: 1, away: 0 }, regular: { home: 1, away: 0 }, aggregate: { home: 3, away: 1 } },
    }))
    expect(screen.getByText(/Agg: 3-1/)).toBeInTheDocument()
  })

  it('shows no extra info separator when extra info is empty', () => {
    renderCard(makeMatch({ type: 'FINAL' }))
    // Only the round name should be visible, no separator dot
    const separators = screen.queryAllByText('·')
    expect(separators).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Link routing
// ---------------------------------------------------------------------------

describe('MatchCard — link', () => {
  it('links to the correct match detail route', () => {
    renderCard(makeMatch({ id: 42 }))
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/competition/uefa-ucl/match/42')
  })
})
