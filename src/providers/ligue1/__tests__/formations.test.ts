import { describe, it, expect } from 'vitest'
import { getFormationCoordinates } from '../formations'

describe('getFormationCoordinates', () => {
  it('returns 11 positions for a 4-3-3 formation', () => {
    const map = getFormationCoordinates('433')
    expect(Object.keys(map)).toHaveLength(11)
  })

  it('returns 11 positions for a 3-4-2-1 formation', () => {
    const map = getFormationCoordinates('3421')
    expect(Object.keys(map)).toHaveLength(11)
  })

  it('returns 11 positions for a 4-2-3-1 formation', () => {
    const map = getFormationCoordinates('4231')
    expect(Object.keys(map)).toHaveLength(11)
  })

  it('places GK (position 1) at the lowest y value', () => {
    const map = getFormationCoordinates('433')
    const minY = Math.min(...Object.values(map).map((c) => c.y))
    expect(map[1].y).toBe(minY)
    expect(map[1].y).toBe(80)
  })

  it('places forwards at the highest y value', () => {
    const map = getFormationCoordinates('433')
    const maxY = Math.max(...Object.values(map).map((c) => c.y))
    // Positions 9, 10, 11 are the forward row in 4-3-3
    expect(map[9].y).toBe(maxY)
    expect(map[10].y).toBe(maxY)
    expect(map[11].y).toBe(maxY)
    expect(maxY).toBe(880)
  })

  it('distributes x coordinates evenly within a row of 4', () => {
    const map = getFormationCoordinates('433')
    // Positions 2-5 are the 4 defenders
    const defX = [map[2].x, map[3].x, map[4].x, map[5].x]
    expect(defX).toEqual([200, 400, 600, 800])
  })

  it('distributes x coordinates evenly within a row of 3', () => {
    const map = getFormationCoordinates('433')
    // Positions 6-8 are the 3 midfielders
    const midX = [map[6].x, map[7].x, map[8].x]
    expect(midX).toEqual([250, 500, 750])
  })

  it('centers GK at x=500', () => {
    const map = getFormationCoordinates('433')
    expect(map[1].x).toBe(500)
  })

  it('keeps all coordinates within the 0-1000 range', () => {
    const formations = ['433', '442', '4231', '352', '343', '3421', '532', '4141']
    for (const f of formations) {
      const map = getFormationCoordinates(f)
      for (const [place, coord] of Object.entries(map)) {
        expect(coord.x).toBeGreaterThanOrEqual(0)
        expect(coord.x).toBeLessThanOrEqual(1000)
        expect(coord.y).toBeGreaterThanOrEqual(0)
        expect(coord.y).toBeLessThanOrEqual(1000)
        // Verify place is a valid number
        expect(Number(place)).toBeGreaterThanOrEqual(1)
        expect(Number(place)).toBeLessThanOrEqual(11)
      }
    }
  })

  it('falls back to digit parsing for unknown formations', () => {
    // "622" is not in FORMATION_ROWS — will be parsed as [1, 6, 2, 2]
    const map = getFormationCoordinates('622')
    expect(Object.keys(map)).toHaveLength(11)
    expect(map[1].y).toBe(80) // GK
  })

  it('returns the same reference on repeated calls (cache)', () => {
    const a = getFormationCoordinates('433')
    const b = getFormationCoordinates('433')
    expect(a).toBe(b)
  })

  it('handles 5-row formation (4-2-3-1) with correct y interpolation', () => {
    const map = getFormationCoordinates('4231')
    // 5 rows: GK(1), DEF(4), DM(2), AM(3), ST(1)
    // Y values should be: 80, 280, 480, 680, 880
    expect(map[1].y).toBe(80) // GK
    expect(map[6].y).toBe(map[7].y) // DM row is same y
    expect(map[11].y).toBe(880) // ST
    // Each row should have increasing y
    expect(map[2].y).toBeGreaterThan(map[1].y)
    expect(map[6].y).toBeGreaterThan(map[2].y)
    expect(map[8].y).toBeGreaterThan(map[6].y)
    expect(map[11].y).toBeGreaterThan(map[8].y)
  })
})
