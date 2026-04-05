import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PlayerNode } from '../PlayerNode'

// ---------------------------------------------------------------------------
// Default props
// ---------------------------------------------------------------------------

const defaultProps = {
  jerseyNumber: 7,
  name: 'Vini Jr',
  fullName: 'Vinicius Junior',
  countryCode: 'BRA',
  age: 24,
  height: 176,
  imageUrl: 'https://img.uefa.com/vini.jpg',
  shirtColor: '#1a2a4a',
  displayMode: 'countryCode' as const,
}

// ---------------------------------------------------------------------------
// Google search link
// ---------------------------------------------------------------------------

describe('PlayerNode — search link', () => {
  it('links to Google search for the player full name', () => {
    render(<PlayerNode {...defaultProps} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute(
      'href',
      `https://www.google.com/search?q=${encodeURIComponent('Vinicius Junior')}`,
    )
  })

  it('uses encodeURIComponent — spaces become %20', () => {
    render(<PlayerNode {...defaultProps} fullName="Lamine Yamal" />)
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toContain('Lamine%20Yamal')
  })

  it('uses encodeURIComponent — special chars encoded', () => {
    render(<PlayerNode {...defaultProps} fullName="Wojciech Szczęsny" />)
    const link = screen.getByRole('link')
    // The href must not contain raw non-ASCII chars
    const href = link.getAttribute('href') ?? ''
    // eslint-disable-next-line no-control-regex
    expect(href).not.toMatch(/[^\x00-\x7F]/)
  })

  it('opens in a new tab with noopener noreferrer', () => {
    render(<PlayerNode {...defaultProps} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders the short name below the circle', () => {
    render(<PlayerNode {...defaultProps} name="Vini Jr" />)
    expect(screen.getByText('Vini Jr')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Display modes
// ---------------------------------------------------------------------------

describe('PlayerNode — display modes', () => {
  it('renders flag image for countryCode mode when countryCode is set', () => {
    render(<PlayerNode {...defaultProps} displayMode="countryCode" countryCode="BRA" />)
    // Flag img has alt=countryCode
    const flagImg = screen.getByAltText('BRA')
    expect(flagImg).toBeInTheDocument()
    expect(flagImg).toHaveAttribute('src', expect.stringContaining('br.png'))
  })

  it('renders jersey number for countryCode mode when no countryCode', () => {
    render(<PlayerNode {...defaultProps} displayMode="countryCode" countryCode={undefined} />)
    // No flag img, shows jersey number
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('renders jersey number for clubJerseyNumber mode', () => {
    render(<PlayerNode {...defaultProps} displayMode="clubJerseyNumber" />)
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('renders age for age mode', () => {
    render(<PlayerNode {...defaultProps} displayMode="age" age={24} />)
    expect(screen.getByText('24')).toBeInTheDocument()
  })

  it('renders "-" when age is undefined in age mode', () => {
    render(<PlayerNode {...defaultProps} displayMode="age" age={undefined} />)
    expect(screen.getByText('-')).toBeInTheDocument()
  })

  it('renders height for height mode', () => {
    render(<PlayerNode {...defaultProps} displayMode="height" height={176} />)
    expect(screen.getByText('176')).toBeInTheDocument()
  })

  it('renders "-" when height is undefined in height mode', () => {
    render(<PlayerNode {...defaultProps} displayMode="height" height={undefined} />)
    expect(screen.getByText('-')).toBeInTheDocument()
  })

  it('renders player photo for imageUrl mode when imageUrl is set', () => {
    render(
      <PlayerNode
        {...defaultProps}
        displayMode="imageUrl"
        imageUrl="https://img.uefa.com/vini.jpg"
      />,
    )
    const photoImg = screen.getByAltText('Vinicius Junior')
    expect(photoImg).toBeInTheDocument()
    expect(photoImg).toHaveAttribute('src', 'https://img.uefa.com/vini.jpg')
  })

  it('renders jersey number as fallback for imageUrl mode with no imageUrl', () => {
    render(<PlayerNode {...defaultProps} displayMode="imageUrl" imageUrl={undefined} />)
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('renders jersey number for unknown/undefined display mode', () => {
    render(<PlayerNode {...defaultProps} displayMode={undefined} />)
    expect(screen.getByText('7')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Background color
// ---------------------------------------------------------------------------

describe('PlayerNode — background color', () => {
  // The circle div has an inline style={{ backgroundColor: ... }}
  // React serialises this as "background-color" in the DOM attribute.
  function getCircle(container: HTMLElement): HTMLElement {
    // The circle is the first div inside the <a> link
    return container.querySelector('a > div') as HTMLElement
  }

  it('uses light grey background for countryCode mode (flag display)', () => {
    const { container } = render(<PlayerNode {...defaultProps} displayMode="countryCode" />)
    const circle = getCircle(container)
    expect(circle).toBeInTheDocument()
    expect(circle.style.backgroundColor).toBe('rgb(229, 231, 235)') // #e5e7eb
  })

  it('uses shirt color for clubJerseyNumber mode', () => {
    const { container } = render(
      <PlayerNode {...defaultProps} displayMode="clubJerseyNumber" shirtColor="#003399" />,
    )
    const circle = getCircle(container)
    expect(circle).toBeInTheDocument()
    expect(circle.style.backgroundColor).toBe('rgb(0, 51, 153)') // #003399
  })

  it('uses default dark color when no shirtColor provided', () => {
    const { container } = render(
      <PlayerNode {...defaultProps} displayMode="clubJerseyNumber" shirtColor={undefined} />,
    )
    const circle = getCircle(container)
    expect(circle).toBeInTheDocument()
    expect(circle.style.backgroundColor).toBe('rgb(26, 42, 74)') // #1a2a4a
  })
})
