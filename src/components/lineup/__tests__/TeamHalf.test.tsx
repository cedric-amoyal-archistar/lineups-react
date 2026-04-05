import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TeamHalf } from '../TeamHalf'
import { lineupsFixture } from '@/test/msw/fixtures'

describe('TeamHalf', () => {
  const homeLineup = lineupsFixture.homeTeam

  it('renders a PlayerNode for each field player', () => {
    render(<TeamHalf lineup={homeLineup} displayMode="countryCode" />)
    // homeTeam has 2 field players: Courtois and Vinicius Jr
    expect(screen.getByText('Courtois')).toBeInTheDocument()
    expect(screen.getByText('Vinicius Jr')).toBeInTheDocument()
  })

  it('positions players based on fieldCoordinate', () => {
    const { container } = render(<TeamHalf lineup={homeLineup} displayMode="countryCode" />)
    const positioned = container.querySelectorAll('.absolute.z-10')
    expect(positioned).toHaveLength(2)

    // First player (Courtois): x=50, y=5 → left: 5%, top: 0.5%
    const gk = positioned[0] as HTMLElement
    expect(gk.style.left).toBe('5%')
    expect(gk.style.top).toBe('0.5%')
  })

  it('inverts Y-coordinate when inverted prop is true', () => {
    const { container } = render(
      <TeamHalf lineup={homeLineup} displayMode="countryCode" inverted />,
    )
    const positioned = container.querySelectorAll('.absolute.z-10')
    // Courtois: y=5, inverted → (1000-5)/10 = 99.5%
    const gk = positioned[0] as HTMLElement
    expect(gk.style.top).toBe('99.5%')
  })

  it('uses clubShirtName when available, falls back to internationalName', () => {
    const lineupWithEmptyShirtName = {
      ...homeLineup,
      field: [
        {
          ...homeLineup.field[0],
          player: { ...homeLineup.field[0].player, clubShirtName: '' },
        },
      ],
    }
    render(<TeamHalf lineup={lineupWithEmptyShirtName} displayMode="countryCode" />)
    // Falls back to internationalName
    expect(screen.getByText('Courtois')).toBeInTheDocument()
  })

  it('passes shirtColor to PlayerNode', () => {
    const { container } = render(<TeamHalf lineup={homeLineup} displayMode="clubJerseyNumber" />)
    // shirtColor is #FFFFFF — circle should use it
    const circle = container.querySelector('a > div') as HTMLElement
    expect(circle.style.backgroundColor).toBe('rgb(255, 255, 255)')
  })

  it('renders with different display modes', () => {
    render(<TeamHalf lineup={homeLineup} displayMode="clubJerseyNumber" />)
    // Jersey numbers should appear: 1 (Courtois) and 7 (Vinicius Jr)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
  })
})
