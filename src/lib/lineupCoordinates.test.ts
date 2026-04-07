import { describe, it, expect } from 'vitest'
import {
  fixInvalidCoordinates,
  applyJerseyNumberFallback,
  defaultToMidfielder,
} from './lineupCoordinates'
import type { LineupPlayer } from '@/types/match'

function makePlayer(
  id: string,
  fieldPosition: string,
  coord: { x: number; y: number } = { x: -1, y: -1 },
  jerseyNumber: number = 1,
): LineupPlayer {
  return {
    jerseyNumber,
    fieldCoordinate: coord,
    fspFieldCoordinate: { x: 0, y: 0 },
    isBooked: false,
    type: 'FIELD',
    player: {
      id,
      internationalName: id,
      clubShirtName: id,
      fieldPosition,
      nationalFieldPosition: '',
      detailedFieldPosition: '',
      imageUrl: '',
      countryCode: '',
      translations: { shortName: {}, name: {} },
    },
  }
}

describe('applyJerseyNumberFallback', () => {
  it('maps jersey 1-11 to 442 rows', () => {
    const field = Array.from({ length: 11 }, (_, i) =>
      makePlayer(`p${i + 1}`, 'MIDFIELDER', { x: -1, y: -1 }, i + 1),
    )
    const result = applyJerseyNumberFallback(field)

    const byJersey = Object.fromEntries(result.map((p) => [p.jerseyNumber, p.fieldCoordinate]))

    expect(byJersey[1]).toEqual({ x: 500, y: 100 }) // GK
    expect(byJersey[2].y).toBe(300) // DEF
    expect(byJersey[3].y).toBe(300)
    expect(byJersey[4].y).toBe(300)
    expect(byJersey[5].y).toBe(300)
    expect(byJersey[6].y).toBe(550) // MID
    expect(byJersey[7].y).toBe(550)
    expect(byJersey[8].y).toBe(550)
    expect(byJersey[9].y).toBe(550)
    expect(byJersey[10].y).toBe(800) // FWD
    expect(byJersey[11].y).toBe(800)

    expect(byJersey[1].y).toBeLessThan(byJersey[2].y)
    expect(byJersey[2].y).toBeLessThan(byJersey[6].y)
    expect(byJersey[6].y).toBeLessThan(byJersey[10].y)
  })

  it('wraps jersey 12+ back to position 1', () => {
    const p12 = makePlayer('p12', 'MIDFIELDER', { x: -1, y: -1 }, 12)
    const p13 = makePlayer('p13', 'MIDFIELDER', { x: -1, y: -1 }, 13)
    const result = applyJerseyNumberFallback([p12, p13])

    expect(result[0].fieldCoordinate).toEqual({ x: 500, y: 100 }) // 12 → place 1 (GK)
    expect(result[1].fieldCoordinate).toEqual({ x: 200, y: 300 }) // 13 → place 2 (DEF L)
  })

  it('does not modify players with valid coordinates', () => {
    const valid = makePlayer('valid', 'GOALKEEPER', { x: 500, y: 50 }, 1)
    const invalid = makePlayer('invalid', 'MIDFIELDER', { x: -1, y: -1 }, 7)
    const result = applyJerseyNumberFallback([valid, invalid])

    expect(result.find((p) => p.player.id === 'valid')!.fieldCoordinate).toEqual({ x: 500, y: 50 })
    expect(result.find((p) => p.player.id === 'invalid')!.fieldCoordinate).toEqual({
      x: 400,
      y: 550,
    })
  })

  it('returns same reference when all coordinates are valid', () => {
    const field = [
      makePlayer('gk', 'GOALKEEPER', { x: 500, y: 50 }, 1),
      makePlayer('fwd', 'FORWARD', { x: 500, y: 800 }, 9),
    ]
    const result = applyJerseyNumberFallback(field)
    expect(result).toBe(field)
  })
})

describe('defaultToMidfielder', () => {
  it('places invalid-coord players at center midfield {x:500, y:550}', () => {
    const field = [
      makePlayer('p1', 'MIDFIELDER', { x: -1, y: -1 }, 6),
      makePlayer('p2', 'FORWARD', { x: -1, y: -1 }, 10),
    ]
    const result = defaultToMidfielder(field)
    expect(result[0].fieldCoordinate).toEqual({ x: 500, y: 550 })
    expect(result[1].fieldCoordinate).toEqual({ x: 500, y: 550 })
  })

  it('does not modify players with valid coordinates', () => {
    const valid = makePlayer('valid', 'GOALKEEPER', { x: 500, y: 50 }, 1)
    const invalid = makePlayer('invalid', 'MIDFIELDER', { x: -1, y: -1 }, 6)
    const result = defaultToMidfielder([valid, invalid])

    expect(result.find((p) => p.player.id === 'valid')!.fieldCoordinate).toEqual({ x: 500, y: 50 })
    expect(result.find((p) => p.player.id === 'invalid')!.fieldCoordinate).toEqual({
      x: 500,
      y: 550,
    })
  })

  it('returns same reference when all coordinates are valid', () => {
    const field = [
      makePlayer('gk', 'GOALKEEPER', { x: 500, y: 50 }, 1),
      makePlayer('fwd', 'FORWARD', { x: 500, y: 800 }, 9),
    ]
    const result = defaultToMidfielder(field)
    expect(result).toBe(field)
  })
})

describe('fixInvalidCoordinates', () => {
  const field = [
    makePlayer('gk', 'GOALKEEPER'),
    makePlayer('def1', 'DEFENDER'),
    makePlayer('def2', 'DEFENDER'),
    makePlayer('mid1', 'MIDFIELDER'),
    makePlayer('fwd1', 'FORWARD'),
  ]

  it('places goalkeeper above defenders, midfielders, and forwards', () => {
    const result = fixInvalidCoordinates(field)
    const yByPos = Object.fromEntries(
      result.map((p) => [p.player.fieldPosition, p.fieldCoordinate.y]),
    )

    expect(yByPos.GOALKEEPER).toBeLessThan(yByPos.DEFENDER)
    expect(yByPos.DEFENDER).toBeLessThan(yByPos.MIDFIELDER)
    expect(yByPos.MIDFIELDER).toBeLessThan(yByPos.FORWARD)
  })

  it('does not modify players with valid coordinates', () => {
    const mixed = [
      makePlayer('gk', 'GOALKEEPER', { x: 500, y: 50 }),
      makePlayer('mid1', 'MIDFIELDER'),
    ]
    const result = fixInvalidCoordinates(mixed)
    const gk = result.find((p) => p.player.id === 'gk')!
    expect(gk.fieldCoordinate).toEqual({ x: 500, y: 50 })
  })

  it('returns field unchanged when all coordinates are valid', () => {
    const valid = [
      makePlayer('gk', 'GOALKEEPER', { x: 500, y: 50 }),
      makePlayer('fwd1', 'FORWARD', { x: 500, y: 800 }),
    ]
    const result = fixInvalidCoordinates(valid)
    expect(result).toBe(valid) // same reference, no changes
  })
})
