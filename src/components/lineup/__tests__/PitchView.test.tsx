import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PitchView } from '../PitchView'
import { lineupsFixture } from '@/test/msw/fixtures'

describe('PitchView', () => {
  it('renders both team names', () => {
    render(<PitchView lineups={lineupsFixture} displayMode="countryCode" />)
    expect(screen.getByText('Real Madrid')).toBeInTheDocument()
    expect(screen.getByText('FC Barcelona')).toBeInTheDocument()
  })

  it('renders team logos for both teams', () => {
    render(<PitchView lineups={lineupsFixture} displayMode="countryCode" />)
    const homeLogos = screen.getAllByAltText('Real Madrid')
    const awayLogos = screen.getAllByAltText('FC Barcelona')
    expect(homeLogos.length).toBeGreaterThanOrEqual(1)
    expect(awayLogos.length).toBeGreaterThanOrEqual(1)
  })

  it('renders all field players from both teams', () => {
    render(<PitchView lineups={lineupsFixture} displayMode="countryCode" />)
    // Home: Courtois, Vinicius Jr | Away: Szczesny, Yamal
    expect(screen.getByText('Courtois')).toBeInTheDocument()
    expect(screen.getByText('Vinicius Jr')).toBeInTheDocument()
    expect(screen.getByText('Szczesny')).toBeInTheDocument()
    expect(screen.getByText('Yamal')).toBeInTheDocument()
  })

  it('renders pitch markings', () => {
    const { container } = render(<PitchView lineups={lineupsFixture} displayMode="countryCode" />)
    // Pitch markings container
    const markings = container.querySelector('.pointer-events-none')
    expect(markings).toBeInTheDocument()
    // Center circle
    const circle = container.querySelector('.rounded-full.border.border-emerald-700\\/20')
    expect(circle).toBeInTheDocument()
  })

  it('renders coach name when available', () => {
    const lineupsWithCoach = {
      ...lineupsFixture,
      homeTeam: {
        ...lineupsFixture.homeTeam,
        coaches: [
          {
            person: {
              id: 'c1',
              countryCode: 'ITA',
              translations: {
                name: { EN: 'Carlo Ancelotti' },
                shortName: { EN: 'Ancelotti' },
              },
            },
            imageUrl: '',
          },
        ],
      },
    }
    render(<PitchView lineups={lineupsWithCoach} displayMode="countryCode" />)
    expect(screen.getByText('Carlo Ancelotti')).toBeInTheDocument()
  })

  it('does not render coach when coaches array is empty', () => {
    render(<PitchView lineups={lineupsFixture} displayMode="countryCode" />)
    // No coach elements — no italic text
    const italicElements = document.querySelectorAll('.italic')
    expect(italicElements).toHaveLength(0)
  })

  it('has the green pitch background', () => {
    const { container } = render(<PitchView lineups={lineupsFixture} displayMode="countryCode" />)
    const pitch = container.firstChild as HTMLElement
    expect(pitch.style.background).toBe('rgb(232, 252, 243)')
  })
})
