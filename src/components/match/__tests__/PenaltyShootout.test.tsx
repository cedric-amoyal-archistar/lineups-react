import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PenaltyShootout } from '../PenaltyShootout'
import type { Match, PenaltyEvent } from '@/types/match'

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function makePenalty(overrides: Partial<PenaltyEvent>): PenaltyEvent {
  return {
    id: 'pen-1',
    penaltyType: 'SCORED',
    phase: 'PENALTY_SHOOTOUT',
    teamId: 'h1',
    player: { clubShirtName: 'Bellingham', internationalName: 'J. Bellingham' },
    ...overrides,
  }
}

function makeMatch(
  penaltyScorers: PenaltyEvent[],
  penaltyScore?: { home: number; away: number },
): Match {
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
    kickOffTime: { date: '2025-04-01', dateTime: '2025-04-01T19:00:00Z', utcOffsetInHours: 0 },
    status: 'FINISHED',
    round: { metaData: { name: 'QF', type: 'KNOCKOUT' }, phase: 'KNOCKOUT' },
    matchday: { longName: 'MD6', name: 'MD6', dateFrom: '', dateTo: '' },
    competition: { id: '1', metaData: { name: 'UCL' } },
    score: penaltyScore
      ? { total: { home: 1, away: 1 }, regular: { home: 1, away: 1 }, penalty: penaltyScore }
      : undefined,
    playerEvents: { penaltyScorers },
  }
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

describe('PenaltyShootout — empty state', () => {
  it('renders nothing when no penalty scorers', () => {
    const { container } = render(<PenaltyShootout match={makeMatch([])} />)
    expect(container.firstChild).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Basic rendering
// ---------------------------------------------------------------------------

describe('PenaltyShootout — rendering', () => {
  it('renders the "Penalty Shootout" heading', () => {
    const match = makeMatch([
      makePenalty({ teamId: 'h1', player: { clubShirtName: 'Bellingham' } }),
    ])
    render(<PenaltyShootout match={match} />)
    expect(screen.getByText('Penalty Shootout')).toBeInTheDocument()
  })

  it('renders player names', () => {
    const match = makeMatch([
      makePenalty({ id: 'p1', teamId: 'h1', player: { clubShirtName: 'Bellingham' } }),
      makePenalty({ id: 'p2', teamId: 'a1', player: { clubShirtName: 'Yamal' } }),
    ])
    render(<PenaltyShootout match={match} />)
    expect(screen.getByText('Bellingham')).toBeInTheDocument()
    expect(screen.getByText('Yamal')).toBeInTheDocument()
  })

  it('falls back to internationalName when clubShirtName absent', () => {
    const match = makeMatch([
      makePenalty({ id: 'p1', teamId: 'h1', player: { internationalName: 'J. Bellingham' } }),
    ])
    render(<PenaltyShootout match={match} />)
    expect(screen.getByText('J. Bellingham')).toBeInTheDocument()
  })

  it('displays penalty total score in the totals row', () => {
    const match = makeMatch(
      [
        makePenalty({ id: 'p1', teamId: 'h1', penaltyType: 'SCORED' }),
        makePenalty({ id: 'p2', teamId: 'a1', penaltyType: 'SCORED' }),
        makePenalty({ id: 'p3', teamId: 'h1', penaltyType: 'MISSED' }),
        makePenalty({ id: 'p4', teamId: 'a1', penaltyType: 'SCORED' }),
      ],
      { home: 1, away: 2 },
    )
    const { container } = render(<PenaltyShootout match={match} />)
    // The totals row is the last child div (border-t section)
    const totalsRow = container.querySelector('.border-t') as HTMLElement
    expect(totalsRow).toBeInTheDocument()
    expect(totalsRow.textContent).toContain('1')
    expect(totalsRow.textContent).toContain('2')
  })
})

// ---------------------------------------------------------------------------
// Asymmetric round counts (P1 analysis item)
// ---------------------------------------------------------------------------

describe('PenaltyShootout — asymmetric round counts', () => {
  it('handles more home penalties than away', () => {
    // 3 home, 2 away — away round 3 should be empty slot
    const match = makeMatch([
      makePenalty({ id: 'h1', teamId: 'h1', player: { clubShirtName: 'Bellingham' } }),
      makePenalty({ id: 'h2', teamId: 'h1', player: { clubShirtName: 'Vinicius Jr' } }),
      makePenalty({ id: 'h3', teamId: 'h1', player: { clubShirtName: 'Modric' } }),
      makePenalty({ id: 'a1', teamId: 'a1', player: { clubShirtName: 'Yamal' } }),
      makePenalty({ id: 'a2', teamId: 'a1', player: { clubShirtName: 'Pedri' } }),
    ])
    // Should not throw — renders 3 rounds
    render(<PenaltyShootout match={match} />)
    expect(screen.getByText('Bellingham')).toBeInTheDocument()
    expect(screen.getByText('Modric')).toBeInTheDocument()
    expect(screen.getByText('Yamal')).toBeInTheDocument()
  })

  it('handles more away penalties than home', () => {
    const match = makeMatch([
      makePenalty({ id: 'h1', teamId: 'h1', player: { clubShirtName: 'Bellingham' } }),
      makePenalty({ id: 'a1', teamId: 'a1', player: { clubShirtName: 'Yamal' } }),
      makePenalty({ id: 'a2', teamId: 'a1', player: { clubShirtName: 'Pedri' } }),
    ])
    render(<PenaltyShootout match={match} />)
    expect(screen.getByText('Bellingham')).toBeInTheDocument()
    expect(screen.getByText('Pedri')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// SCORED / MISSED visual distinction
// ---------------------------------------------------------------------------

describe('PenaltyShootout — scored/missed styling', () => {
  it('applies line-through to missed penalties', () => {
    const match = makeMatch([
      makePenalty({
        id: 'p1',
        teamId: 'h1',
        penaltyType: 'MISSED',
        player: { clubShirtName: 'Vinicius Jr' },
      }),
    ])
    const { container } = render(<PenaltyShootout match={match} />)
    const missedSpan = container.querySelector('.line-through')
    expect(missedSpan).toBeInTheDocument()
    expect(missedSpan?.textContent).toBe('Vinicius Jr')
  })

  it('does not apply line-through to scored penalties', () => {
    const match = makeMatch([
      makePenalty({
        id: 'p1',
        teamId: 'h1',
        penaltyType: 'SCORED',
        player: { clubShirtName: 'Bellingham' },
      }),
    ])
    const { container } = render(<PenaltyShootout match={match} />)
    // The player name text should exist but NOT have line-through
    const allLineThrough = container.querySelectorAll('.line-through')
    expect(allLineThrough).toHaveLength(0)
  })
})
