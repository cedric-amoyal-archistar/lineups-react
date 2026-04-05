import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MatchEvents } from '../MatchEvents'
import type { Match, MatchEvent } from '@/types/match'

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function makeEvent(overrides: Partial<MatchEvent>): MatchEvent {
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

function makeMatch(scorers: MatchEvent[] = [], redCards: MatchEvent[] = []): Match {
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
    playerEvents: { scorers, redCards },
  }
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

describe('MatchEvents — empty state', () => {
  it('renders nothing when no scorers and no red cards', () => {
    const { container } = render(<MatchEvents match={makeMatch()} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when playerEvents is absent', () => {
    const match = { ...makeMatch(), playerEvents: undefined }
    const { container } = render(<MatchEvents match={match} />)
    expect(container.firstChild).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Goals on correct sides
// ---------------------------------------------------------------------------

describe('MatchEvents — goal rendering', () => {
  it('renders home goal scorer name', () => {
    const match = makeMatch([
      makeEvent({
        teamId: 'h1',
        player: {
          clubShirtName: 'Vinicius Jr',
          internationalName: 'V. Junior',
          countryCode: 'BRA',
        },
      }),
    ])
    render(<MatchEvents match={match} />)
    expect(screen.getByText('Vinicius Jr')).toBeInTheDocument()
  })

  it('renders away goal scorer name', () => {
    const match = makeMatch([
      makeEvent({
        id: 'evt-away',
        teamId: 'a1',
        player: { clubShirtName: 'Yamal', internationalName: 'L. Yamal', countryCode: 'ESP' },
      }),
    ])
    render(<MatchEvents match={match} />)
    expect(screen.getByText('Yamal')).toBeInTheDocument()
  })

  it('renders multiple goals', () => {
    const match = makeMatch([
      makeEvent({
        id: 'e1',
        teamId: 'h1',
        player: {
          clubShirtName: 'Bellingham',
          internationalName: 'J. Bellingham',
          countryCode: 'ENG',
        },
      }),
      makeEvent({
        id: 'e2',
        teamId: 'a1',
        player: { clubShirtName: 'Yamal', internationalName: 'L. Yamal', countryCode: 'ESP' },
      }),
    ])
    render(<MatchEvents match={match} />)
    expect(screen.getByText('Bellingham')).toBeInTheDocument()
    expect(screen.getByText('Yamal')).toBeInTheDocument()
  })

  it('falls back to internationalName when clubShirtName is empty', () => {
    const match = makeMatch([
      makeEvent({
        player: { clubShirtName: '', internationalName: 'V. Junior', countryCode: 'BRA' },
      }),
    ])
    render(<MatchEvents match={match} />)
    expect(screen.getByText('V. Junior')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Goal labels (minute, penalty, own goal)
// ---------------------------------------------------------------------------

describe('MatchEvents — goal labels', () => {
  it('renders plain minute for normal goal', () => {
    const match = makeMatch([makeEvent({ time: { minute: 22, second: 0 }, goalType: 'NORMAL' })])
    render(<MatchEvents match={match} />)
    expect(screen.getByText("22'")).toBeInTheDocument()
  })

  it('renders injury time correctly', () => {
    const match = makeMatch([
      makeEvent({ time: { minute: 90, second: 0, injuryMinute: 3 }, goalType: 'NORMAL' }),
    ])
    render(<MatchEvents match={match} />)
    expect(screen.getByText("90'+3")).toBeInTheDocument()
  })

  it('renders "(P)" label for penalty goal', () => {
    const match = makeMatch([makeEvent({ time: { minute: 55, second: 0 }, goalType: 'PENALTY' })])
    render(<MatchEvents match={match} />)
    expect(screen.getByText("55' (P)")).toBeInTheDocument()
  })

  it('renders "(OG)" label for own goal', () => {
    const match = makeMatch([makeEvent({ time: { minute: 10, second: 0 }, goalType: 'OWN_GOAL' })])
    render(<MatchEvents match={match} />)
    expect(screen.getByText("10' (OG)")).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Red cards
// ---------------------------------------------------------------------------

describe('MatchEvents — red cards', () => {
  it('renders red card player name', () => {
    const match = makeMatch(
      [],
      [
        makeEvent({
          id: 'rc-1',
          teamId: 'h1',
          player: {
            clubShirtName: 'Carvajal',
            internationalName: 'D. Carvajal',
            countryCode: 'ESP',
          },
        }),
      ],
    )
    render(<MatchEvents match={match} />)
    expect(screen.getByText('Carvajal')).toBeInTheDocument()
  })

  it('renders red card minute', () => {
    const match = makeMatch(
      [],
      [makeEvent({ id: 'rc-1', teamId: 'h1', time: { minute: 73, second: 0 } })],
    )
    render(<MatchEvents match={match} />)
    expect(screen.getByText("73'")).toBeInTheDocument()
  })

  it('renders red card visual indicator (red square)', () => {
    const match = makeMatch([], [makeEvent({ id: 'rc-1', teamId: 'h1' })])
    const { container } = render(<MatchEvents match={match} />)
    // The red card indicator is a span with bg-red-500
    const redIndicator = container.querySelector('.bg-red-500')
    expect(redIndicator).toBeInTheDocument()
  })

  it('renders component when only red cards exist (no goals)', () => {
    const match = makeMatch([], [makeEvent({ id: 'rc-1', teamId: 'h1' })])
    const { container } = render(<MatchEvents match={match} />)
    expect(container.firstChild).not.toBeNull()
  })
})
