/**
 * Smoke tests for the test infrastructure itself.
 * Verifies that MSW, jsdom, and @testing-library/jest-dom are wired correctly.
 * These tests have no application dependencies — they always run.
 */
import { describe, it, expect } from 'vitest'
import { matchListFixture, matchFixture, lineupsFixture, MATCH_ID } from './msw/fixtures'

describe('Test infrastructure', () => {
  it('MSW match list fixture is a non-empty array', () => {
    expect(Array.isArray(matchListFixture)).toBe(true)
    expect(matchListFixture.length).toBeGreaterThan(0)
    expect(matchListFixture[0].id).toBe(MATCH_ID)
  })

  it('matchFixture has the expected shape', () => {
    expect(matchFixture.id).toBe(MATCH_ID)
    expect(matchFixture.homeTeam.internationalName).toBe('Real Madrid')
    expect(matchFixture.awayTeam.internationalName).toBe('FC Barcelona')
    expect(matchFixture.playerEvents?.scorers?.length).toBeGreaterThan(0)
  })

  it('lineupsFixture has homeTeam and awayTeam with field players', () => {
    expect(lineupsFixture.homeTeam.field.length).toBeGreaterThan(0)
    expect(lineupsFixture.awayTeam.field.length).toBeGreaterThan(0)
  })

  it('jest-dom matchers are available (document.createElement)', () => {
    const el = document.createElement('div')
    el.textContent = 'hello'
    document.body.appendChild(el)
    expect(el).toBeInTheDocument()
    el.remove()
  })
})
