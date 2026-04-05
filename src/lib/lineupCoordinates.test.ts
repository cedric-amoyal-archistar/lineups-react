import { describe, it, expect } from 'vitest'
import { fixInvalidCoordinates } from './lineupCoordinates'
import type { LineupPlayer } from '@/types/match'

function makePlayer(
  id: string,
  fieldPosition: string,
  coord: { x: number; y: number } = { x: -1, y: -1 },
): LineupPlayer {
  return {
    jerseyNumber: 1,
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
