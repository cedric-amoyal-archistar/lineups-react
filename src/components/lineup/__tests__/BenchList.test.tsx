import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BenchList } from '../BenchList'
import { lineupsFixture } from '@/test/msw/fixtures'

describe('BenchList', () => {
  const homeLineup = lineupsFixture.homeTeam

  it('renders the team name', () => {
    render(<BenchList lineup={homeLineup} displayMode="countryCode" />)
    expect(screen.getByText('Real Madrid')).toBeInTheDocument()
  })

  it('renders the "Substitutes" label', () => {
    render(<BenchList lineup={homeLineup} displayMode="countryCode" />)
    expect(screen.getByText('Substitutes')).toBeInTheDocument()
  })

  it('renders team logo', () => {
    render(<BenchList lineup={homeLineup} displayMode="countryCode" />)
    expect(screen.getByAltText('Real Madrid')).toBeInTheDocument()
  })

  it('renders a PlayerNode for each bench player', () => {
    render(<BenchList lineup={homeLineup} displayMode="countryCode" />)
    // homeTeam has 1 bench player: Brahim
    expect(screen.getByText('Brahim')).toBeInTheDocument()
  })

  it('renders nothing in grid when bench is empty', () => {
    const emptyBenchLineup = { ...homeLineup, bench: [] }
    const { container } = render(<BenchList lineup={emptyBenchLineup} displayMode="countryCode" />)
    const grid = container.querySelector('.grid')
    expect(grid).toBeInTheDocument()
    expect(grid?.children).toHaveLength(0)
  })

  it('passes displayMode to PlayerNode', () => {
    render(<BenchList lineup={homeLineup} displayMode="clubJerseyNumber" />)
    // Brahim's jersey number is 21
    expect(screen.getByText('21')).toBeInTheDocument()
  })

  it('uses clubShirtName when available, falls back to internationalName', () => {
    const lineupWithEmptyShirtName = {
      ...homeLineup,
      bench: [
        {
          ...homeLineup.bench[0],
          player: { ...homeLineup.bench[0].player, clubShirtName: '' },
        },
      ],
    }
    render(<BenchList lineup={lineupWithEmptyShirtName} displayMode="countryCode" />)
    // Falls back to internationalName "Brahim"
    expect(screen.getByText('Brahim')).toBeInTheDocument()
  })
})
