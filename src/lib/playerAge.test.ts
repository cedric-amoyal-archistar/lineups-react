import { describe, it, expect } from 'vitest'
import { computeMatchDayAge } from './playerAge'

describe('computeMatchDayAge', () => {
  describe('with birthDate and matchDate (exact)', () => {
    it('computes exact age when birthday has passed', () => {
      // Born 1971-10-31, match 1993-05-27 → 21
      expect(
        computeMatchDayAge({ birthDate: '1971-10-31', matchDate: '1993-05-27T20:00:00Z' }),
      ).toBe(21)
    })

    it('computes exact age when birthday has not yet passed', () => {
      // Born March 15, match March 14 next year → birthday not reached
      expect(
        computeMatchDayAge({ birthDate: '1971-03-15', matchDate: '1993-03-14T20:00:00Z' }),
      ).toBe(21)
    })

    it('computes exact age on birthday', () => {
      // Born March 15, match on their 22nd birthday
      expect(
        computeMatchDayAge({ birthDate: '1971-03-15', matchDate: '1993-03-15T20:00:00Z' }),
      ).toBe(22)
    })
  })

  describe('with currentAge and matchDate (approximate)', () => {
    it('approximates age for an old match', () => {
      // Player is 54 today, match was ~33 years ago → ~21
      const age = computeMatchDayAge({ currentAge: 54, matchDate: '1993-05-27T20:00:00Z' })
      expect(age).toBeGreaterThanOrEqual(15)
      expect(age).toBeLessThanOrEqual(60)
    })

    it('returns current age for a recent match', () => {
      const recent = new Date()
      recent.setDate(recent.getDate() - 7)
      const age = computeMatchDayAge({ currentAge: 25, matchDate: recent.toISOString() })
      expect(age).toBe(25)
    })
  })

  describe('fallback to currentAge alone', () => {
    it('returns currentAge when no matchDate is provided', () => {
      expect(computeMatchDayAge({ currentAge: 30 })).toBe(30)
    })

    it('returns currentAge as string when no matchDate', () => {
      expect(computeMatchDayAge({ currentAge: '28' })).toBe('28')
    })

    it('returns undefined when nothing is provided', () => {
      expect(computeMatchDayAge({})).toBeUndefined()
    })
  })

  describe('age is always between 15 and 60', () => {
    it('clamps to 15 when birthDate calculation yields below 15', () => {
      // Born 2015, match 2020 → 5, clamped to 15
      expect(
        computeMatchDayAge({ birthDate: '2015-01-01', matchDate: '2020-06-01T20:00:00Z' }),
      ).toBe(15)
    })

    it('clamps to 60 when birthDate calculation yields above 60', () => {
      // Born 1930, match 2000 → 70, clamped to 60
      expect(
        computeMatchDayAge({ birthDate: '1930-01-01', matchDate: '2000-06-01T20:00:00Z' }),
      ).toBe(60)
    })

    it('clamps to 15 when approximate calculation yields below 15', () => {
      // Player is 20 today, match was 10 years ago → ~10, clamped to 15
      const tenYearsAgo = new Date()
      tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10)
      expect(
        computeMatchDayAge({ currentAge: 20, matchDate: tenYearsAgo.toISOString() }),
      ).toBe(15)
    })

    it('clamps to 60 when approximate calculation yields above 60', () => {
      // Player is 90 today, match was 5 years ago → ~85, clamped to 60
      const fiveYearsAgo = new Date()
      fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5)
      expect(
        computeMatchDayAge({ currentAge: 90, matchDate: fiveYearsAgo.toISOString() }),
      ).toBe(60)
    })
  })
})
