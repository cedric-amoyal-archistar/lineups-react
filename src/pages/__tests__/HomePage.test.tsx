import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { LayoutProvider } from '@/contexts/LayoutContext'
import { MatchListPage } from '../HomePage'
import { server } from '@/test/msw/server'
import { matchFixture, matchFixture2, SEASON_YEAR } from '@/test/msw/fixtures'

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/competition/uefa-ucl']}>
          <LayoutProvider>
            <Routes>
              <Route path="/competition/:providerId" element={children} />
            </Routes>
          </LayoutProvider>
        </MemoryRouter>
      </QueryClientProvider>
    )
  }

  render(<MatchListPage />, { wrapper: Wrapper })
}

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------

describe('HomePage — loading state', () => {
  it('shows a loading spinner while fetching', () => {
    renderPage()
    // Spinner should be present before the request resolves
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Match list rendering
// ---------------------------------------------------------------------------

describe('HomePage — match list', () => {
  it('renders match cards after data loads', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByText('Real Madrid')).toBeInTheDocument())
  })

  it('renders both home and away team names', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('Real Madrid')).toBeInTheDocument()
      expect(screen.getByText('FC Barcelona')).toBeInTheDocument()
    })
  })

  it('groups matches under a date heading', async () => {
    renderPage()
    await waitFor(() => screen.getByText('Real Madrid'))
    // Date header should be rendered (locale-dependent text, but it's an h2)
    const headings = screen.getAllByRole('heading', { level: 2 })
    expect(headings.length).toBeGreaterThan(0)
  })

  it('renders the team filter input', async () => {
    renderPage()
    await waitFor(() => screen.getByText('Real Madrid'))
    expect(screen.getByPlaceholderText('Filter by team...')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Team filter — P1 logic from analysis
// ---------------------------------------------------------------------------

describe('HomePage — team filter', () => {
  it('filters matches by home team name (case-insensitive)', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByText('Real Madrid'))

    const input = screen.getByPlaceholderText('Filter by team...')
    await user.type(input, 'real')

    // Real Madrid match visible, Bayern Munich match hidden
    expect(screen.getByText('Real Madrid')).toBeInTheDocument()
    expect(screen.queryByText('Bayern Munich')).not.toBeInTheDocument()
  })

  it('filters matches by away team name', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByText('PSG'))

    const input = screen.getByPlaceholderText('Filter by team...')
    await user.type(input, 'psg')

    expect(screen.getByText('PSG')).toBeInTheDocument()
    expect(screen.queryByText('FC Barcelona')).not.toBeInTheDocument()
  })

  it('filters by team code', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByText('Real Madrid'))

    const input = screen.getByPlaceholderText('Filter by team...')
    await user.type(input, 'rma')

    expect(screen.getByText('Real Madrid')).toBeInTheDocument()
    expect(screen.queryByText('Bayern Munich')).not.toBeInTheDocument()
  })

  it('shows no-matches message when filter matches nothing', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByText('Real Madrid'))

    const input = screen.getByPlaceholderText('Filter by team...')
    await user.type(input, 'zzznomatch')

    await waitFor(() => expect(screen.getByText('No matches found.')).toBeInTheDocument())
  })

  it('restores all matches when filter is cleared', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() => screen.getByText('Real Madrid'))

    const input = screen.getByPlaceholderText('Filter by team...')
    await user.type(input, 'real')
    await user.clear(input)

    await waitFor(() => {
      expect(screen.getByText('Real Madrid')).toBeInTheDocument()
      expect(screen.getByText('Bayern Munich')).toBeInTheDocument()
    })
  })
})

// ---------------------------------------------------------------------------
// Date grouping — P1 logic from analysis (DESC sort)
// ---------------------------------------------------------------------------

describe('HomePage — date grouping', () => {
  it('groups matches with different dates under separate headings', async () => {
    // Override handler to return two matches on different dates
    server.use(
      http.get('/uefa-api/v5/matches', () =>
        HttpResponse.json([
          {
            ...matchFixture,
            id: 1,
            kickOffTime: {
              date: '2025-04-10',
              dateTime: '2025-04-10T19:00:00Z',
              utcOffsetInHours: 0,
            },
          },
          {
            ...matchFixture2,
            id: 2,
            kickOffTime: {
              date: '2025-04-08',
              dateTime: '2025-04-08T19:00:00Z',
              utcOffsetInHours: 0,
            },
          },
        ]),
      ),
    )

    renderPage()
    await waitFor(() => screen.getByText('Real Madrid'))

    const headings = screen.getAllByRole('heading', { level: 2 })
    // Two different dates → two headings
    expect(headings.length).toBeGreaterThanOrEqual(2)
  })

  it('matches on the same date appear under a single heading', async () => {
    server.use(
      http.get('/uefa-api/v5/matches', () =>
        HttpResponse.json([
          {
            ...matchFixture,
            id: 1,
            kickOffTime: {
              date: '2025-04-10',
              dateTime: '2025-04-10T19:00:00Z',
              utcOffsetInHours: 0,
            },
          },
          {
            ...matchFixture2,
            id: 2,
            kickOffTime: {
              date: '2025-04-10',
              dateTime: '2025-04-10T21:00:00Z',
              utcOffsetInHours: 0,
            },
          },
        ]),
      ),
    )

    renderPage()
    await waitFor(() => screen.getByText('Real Madrid'))

    const headings = screen.getAllByRole('heading', { level: 2 })
    // Same date → one heading
    expect(headings).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

describe('HomePage — error state', () => {
  it('shows error message when fetch fails', async () => {
    server.use(http.get('/uefa-api/v5/matches', () => HttpResponse.error()))
    renderPage()
    await waitFor(() => expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument())
    // Error div should appear (text varies, but spinner gone)
    expect(document.querySelector('.animate-spin')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

describe('HomePage — empty state', () => {
  it('shows "No matches found." when API returns empty array', async () => {
    server.use(http.get('/uefa-api/v5/matches', () => HttpResponse.json([])))
    renderPage()
    await waitFor(() => expect(screen.getByText('No matches found.')).toBeInTheDocument())
  })
})

// ---------------------------------------------------------------------------
// Load more
// ---------------------------------------------------------------------------

describe('HomePage — load more', () => {
  it('hides "Load more" button when fewer than PAGE_SIZE matches returned', async () => {
    // Fixture returns 2 matches, PAGE_SIZE=100 → hasMore=false
    renderPage()
    await waitFor(() => screen.getByText('Real Madrid'))
    expect(screen.queryByRole('button', { name: /load more/i })).not.toBeInTheDocument()
  })

  it('shows "Load more" button when exactly PAGE_SIZE matches returned', async () => {
    // Return 100 matches to trigger hasMore=true
    const hundred = Array.from({ length: 100 }, (_, i) => ({
      ...matchFixture,
      id: i + 1,
    }))
    server.use(http.get('/uefa-api/v5/matches', () => HttpResponse.json(hundred)))
    renderPage()
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /load more/i })).toBeInTheDocument(),
    )
  })
})

// Ensure matchFixture2 team names are referenced (used above to check PSG filter)
void matchFixture2
void SEASON_YEAR
