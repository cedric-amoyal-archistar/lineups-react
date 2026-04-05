import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LayoutProvider } from '@/contexts/LayoutContext'
import { DefaultLayout } from '../DefaultLayout'

function renderLayout(props?: { showSeason?: boolean; showDisplay?: boolean }) {
  function Inner() {
    const { useLayout } = require('@/contexts/LayoutContext')
    const ctx = useLayout()
    if (props?.showSeason) ctx.setShowSeasonSelect(true)
    if (props?.showDisplay) ctx.setShowDisplaySelect(true)
    return null
  }

  return render(
    <MemoryRouter>
      <LayoutProvider>
        <DefaultLayout>
          <div data-testid="child-content">Page content</div>
          <Inner />
        </DefaultLayout>
      </LayoutProvider>
    </MemoryRouter>,
  )
}

function renderLayoutSimple() {
  return render(
    <MemoryRouter>
      <LayoutProvider>
        <DefaultLayout>
          <div data-testid="child-content">Page content</div>
        </DefaultLayout>
      </LayoutProvider>
    </MemoryRouter>,
  )
}

describe('DefaultLayout', () => {
  it('renders the app title "Lineups"', () => {
    renderLayoutSimple()
    expect(screen.getByText('Lineups')).toBeInTheDocument()
  })

  it('renders children in the main area', () => {
    renderLayoutSimple()
    expect(screen.getByTestId('child-content')).toBeInTheDocument()
    expect(screen.getByText('Page content')).toBeInTheDocument()
  })

  it('renders the logo link pointing to "/"', () => {
    renderLayoutSimple()
    const link = screen.getByText('Lineups').closest('a')
    expect(link).toHaveAttribute('href', '/')
  })

  it('renders a sticky header', () => {
    const { container } = renderLayoutSimple()
    const header = container.querySelector('header')
    expect(header).toBeInTheDocument()
    expect(header?.className).toContain('sticky')
  })

  it('does not render season selector by default (showSeasonSelect is false)', () => {
    renderLayoutSimple()
    // Season options like "2024/25" should not be visible
    expect(screen.queryByText(/\d{4}\/\d{2}/)).not.toBeInTheDocument()
  })

  it('does not render display mode selector by default (showDisplaySelect is false)', () => {
    renderLayoutSimple()
    // Display options like "Flag", "Number" etc should not be present as buttons
    expect(screen.queryByText('Flag')).not.toBeInTheDocument()
  })
})
