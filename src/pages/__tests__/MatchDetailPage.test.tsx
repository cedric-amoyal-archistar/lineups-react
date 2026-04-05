import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { LayoutProvider } from '@/contexts/LayoutContext'
import { MatchDetailPage } from '../MatchDetailPage'
import { server } from '@/test/msw/server'
import { matchFixture, lineupsFixture, MATCH_ID, MATCH_ID_STR } from '@/test/msw/fixtures'

// ---------------------------------------------------------------------------
// Wrapper — renders the page at /match/:id
// ---------------------------------------------------------------------------

function renderPage(matchId: string | number = MATCH_ID_STR) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={[`/competition/uefa-ucl/match/${matchId}`]}>
          <LayoutProvider>
            <Routes>
              <Route path="/competition/:providerId/match/:id" element={children} />
            </Routes>
          </LayoutProvider>
        </MemoryRouter>
      </QueryClientProvider>
    )
  }

  render(<MatchDetailPage />, { wrapper: Wrapper })
}

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------

describe('MatchDetailPage — loading state', () => {
  it('shows a spinner while match data is loading', () => {
    renderPage()
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Scoreboard
// ---------------------------------------------------------------------------

describe('MatchDetailPage — scoreboard', () => {
  it('renders home and away team codes', async () => {
    renderPage()
    await waitFor(() => screen.getByText('RMA'))
    expect(screen.getByText('RMA')).toBeInTheDocument()
    expect(screen.getByText('BAR')).toBeInTheDocument()
  })

  it('renders home and away team logos', async () => {
    renderPage()
    await waitFor(() => screen.getAllByAltText('Real Madrid'))
    // The scoreboard logo uses mediumLogoUrl; PitchView also renders a logo — pick the first
    const homeImgs = screen.getAllByAltText('Real Madrid')
    expect(homeImgs.length).toBeGreaterThan(0)
    // The scoreboard img (first one) should use mediumLogoUrl
    const scoreboardImg = homeImgs.find(
      (img) => img.getAttribute('src') === matchFixture.homeTeam.mediumLogoUrl,
    )
    expect(scoreboardImg).toBeInTheDocument()
  })

  it('renders the score', async () => {
    renderPage()
    // Match fixture has score 2-1
    await waitFor(() => screen.getByText('2'))
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('renders "(pen)" score when penalty data is present', async () => {
    server.use(
      http.get(`/uefa-api/v5/matches/${MATCH_ID_STR}`, () =>
        HttpResponse.json({
          ...matchFixture,
          score: {
            total: { home: 1, away: 1 },
            regular: { home: 1, away: 1 },
            penalty: { home: 5, away: 4 },
          },
        }),
      ),
    )
    renderPage()
    await waitFor(() => screen.getByText('(5-4 pen)'))
    expect(screen.getByText('(5-4 pen)')).toBeInTheDocument()
  })

  it('renders round/leg info above the scoreboard', async () => {
    renderPage()
    // matchFixture.type = 'FIRST_LEG', round = 'Quarter-finals'
    await waitFor(() => screen.getByText(/Quarter-finals/))
    expect(screen.getByText(/Quarter-finals/)).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// UEFA link
// ---------------------------------------------------------------------------

describe('MatchDetailPage — external link', () => {
  it('renders "View match details" link', async () => {
    renderPage()
    await waitFor(() => screen.getByText('View match details'))
    const link = screen.getByRole('link', { name: /view match details/i })
    expect(link).toBeInTheDocument()
  })

  it('external link points to the correct URL with slugified team names', async () => {
    renderPage()
    await waitFor(() => screen.getByText('View match details'))
    const link = screen.getByRole('link', { name: /view match details/i })
    const href = link.getAttribute('href') ?? ''
    expect(href).toContain(`/match/${MATCH_ID}--real-madrid-vs-fc-barcelona/`)
    expect(href).toContain('https://www.uefa.com/uefachampionsleague/')
  })

  it('external link opens in new tab with noopener noreferrer', async () => {
    renderPage()
    await waitFor(() => screen.getByText('View match details'))
    const link = screen.getByRole('link', { name: /view match details/i })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
})

// ---------------------------------------------------------------------------
// Lineup section
// ---------------------------------------------------------------------------

describe('MatchDetailPage — lineup section', () => {
  it('renders "Lineups not available yet" when lineups have no field players', async () => {
    server.use(
      http.get(`/uefa-api/v5/matches/${MATCH_ID_STR}/lineups`, () =>
        HttpResponse.json({
          ...lineupsFixture,
          homeTeam: { ...lineupsFixture.homeTeam, field: [] },
        }),
      ),
    )
    renderPage()
    await waitFor(() =>
      expect(screen.getByText(/lineups not available yet/i)).toBeInTheDocument(),
    )
  })

  it('renders pitch view when lineups have field players', async () => {
    renderPage()
    // BenchList renders "Substitutes" — both home and away benches appear
    await waitFor(() => screen.getAllByText('Substitutes'))
    expect(screen.getAllByText('Substitutes').length).toBeGreaterThan(0)
  })

  it('renders bench player names', async () => {
    renderPage()
    // lineupsFixture homeTeam bench has 'Brahim'
    await waitFor(() => screen.getByText('Brahim'))
    expect(screen.getByText('Brahim')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

describe('MatchDetailPage — error state', () => {
  it('shows error message when match fetch returns 404', async () => {
    server.use(
      http.get(`/uefa-api/v5/matches/${MATCH_ID_STR}`, () =>
        HttpResponse.json({ error: 'Not found' }, { status: 404 }),
      ),
    )
    renderPage()
    await waitFor(() =>
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument(),
    )
    // Error text from the hook: "UEFA API error: 404 ..."
    expect(screen.getByText(/UEFA API error/i)).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Not found / unknown id
// ---------------------------------------------------------------------------

describe('MatchDetailPage — unknown id', () => {
  it('shows an error message for an id that returns 404', async () => {
    // id=99999 is not in the MSW handler -> returns 404 -> hook sets error
    renderPage('99999')
    await waitFor(() =>
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument(),
    )
    // Error state renders the error message text
    expect(screen.getByText(/UEFA API error/i)).toBeInTheDocument()
  })
})
