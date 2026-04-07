import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GameweekSelector } from '../GameweekSelector'

function renderSelector(props: Partial<Parameters<typeof GameweekSelector>[0]> = {}) {
  const defaultProps = {
    gameweek: 15,
    totalGameweeks: 34,
    onChange: vi.fn(),
    loading: false,
    ...props,
  }
  render(<GameweekSelector {...defaultProps} />)
  return { onChange: defaultProps.onChange }
}

describe('GameweekSelector', () => {
  it('renders the matchday label', () => {
    renderSelector({ gameweek: 28 })
    expect(screen.getByText('Matchday 28')).toBeInTheDocument()
  })

  it('calls onChange with previous gameweek when clicking previous', async () => {
    const { onChange } = renderSelector({ gameweek: 15 })
    await userEvent.click(screen.getByLabelText('Previous matchday'))
    expect(onChange).toHaveBeenCalledWith(14)
  })

  it('calls onChange with next gameweek when clicking next', async () => {
    const { onChange } = renderSelector({ gameweek: 15 })
    await userEvent.click(screen.getByLabelText('Next matchday'))
    expect(onChange).toHaveBeenCalledWith(16)
  })

  it('disables previous button at gameweek 1', () => {
    renderSelector({ gameweek: 1 })
    expect(screen.getByLabelText('Previous matchday')).toBeDisabled()
  })

  it('disables next button at the last gameweek', () => {
    renderSelector({ gameweek: 34, totalGameweeks: 34 })
    expect(screen.getByLabelText('Next matchday')).toBeDisabled()
  })

  it('enables both buttons for a middle gameweek', () => {
    renderSelector({ gameweek: 15 })
    expect(screen.getByLabelText('Previous matchday')).toBeEnabled()
    expect(screen.getByLabelText('Next matchday')).toBeEnabled()
  })

  it('disables both buttons when loading', () => {
    renderSelector({ gameweek: 15, loading: true })
    expect(screen.getByLabelText('Previous matchday')).toBeDisabled()
    expect(screen.getByLabelText('Next matchday')).toBeDisabled()
  })

  it('does not call onChange when clicking disabled previous (gameweek 1)', async () => {
    const { onChange } = renderSelector({ gameweek: 1 })
    await userEvent.click(screen.getByLabelText('Previous matchday'))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('does not call onChange when clicking disabled next (last gameweek)', async () => {
    const { onChange } = renderSelector({ gameweek: 34, totalGameweeks: 34 })
    await userEvent.click(screen.getByLabelText('Next matchday'))
    expect(onChange).not.toHaveBeenCalled()
  })
})
