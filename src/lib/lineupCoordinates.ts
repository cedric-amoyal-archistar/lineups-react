import type { LineupPlayer } from '@/types/match'

const POSITION_Y: Record<string, number> = {
  GOALKEEPER: 100,
  DEFENDER: 300,
  MIDFIELDER: 550,
  FORWARD: 800,
}

// 4-4-2 formation coordinates using the same row heights as POSITION_Y
// so that players from fixInvalidCoordinates and applyJerseyNumberFallback
// end up on the same horizontal lines.
const JERSEY_442_MAP: Record<number, { x: number; y: number }> = {
  1: { x: 500, y: 100 }, // GK
  2: { x: 200, y: 300 }, // DEF L
  3: { x: 400, y: 300 }, // DEF CL
  4: { x: 600, y: 300 }, // DEF CR
  5: { x: 800, y: 300 }, // DEF R
  6: { x: 200, y: 550 }, // MID L
  7: { x: 400, y: 550 }, // MID CL
  8: { x: 600, y: 550 }, // MID CR
  9: { x: 800, y: 550 }, // MID R
  10: { x: 333, y: 800 }, // FWD L
  11: { x: 667, y: 800 }, // FWD R
}

function isInvalidCoordinate(coord: { x: number; y: number }): boolean {
  return coord.x < 0 || coord.y < 0
}

function getPosition(player: LineupPlayer): string | undefined {
  return player.player.fieldPosition || player.player.nationalFieldPosition
}

/**
 * For old games where fieldCoordinate is {x: -1, y: -1}, generate
 * reasonable coordinates based on the player's fieldPosition.
 * Players are grouped by position row and spread evenly on X.
 */
export function fixInvalidCoordinates(field: LineupPlayer[]): LineupPlayer[] {
  const needsFix = field.some((p) => isInvalidCoordinate(p.fieldCoordinate))
  if (!needsFix) return field

  // Group players by position row
  const groups = new Map<string, LineupPlayer[]>()
  const unknown: LineupPlayer[] = []

  for (const p of field) {
    if (!isInvalidCoordinate(p.fieldCoordinate)) continue
    const pos = getPosition(p)
    if (pos && POSITION_Y[pos] !== undefined) {
      const list = groups.get(pos) ?? []
      list.push(p)
      groups.set(pos, list)
    } else {
      unknown.push(p)
    }
  }

  // Build a lookup: player id -> generated coordinate
  const coordMap = new Map<string, { x: number; y: number }>()

  for (const [pos, players] of groups) {
    const y = POSITION_Y[pos]
    const count = players.length
    for (let i = 0; i < count; i++) {
      const x = Math.round(((i + 1) / (count + 1)) * 1000)
      coordMap.set(players[i].player.id, { x, y })
    }
  }

  return field.map((p) => {
    if (!isInvalidCoordinate(p.fieldCoordinate)) return p
    const coord = coordMap.get(p.player.id)
    if (!coord) return p
    return { ...p, fieldCoordinate: coord }
  })
}

/**
 * For players still with invalid coordinates, use their jersey number to
 * estimate a position assuming a 4-4-2 formation.
 * Jersey numbers > 11 wrap around (e.g. 12 → 1, 13 → 2, ...).
 * Jersey numbers that don't map to a known position are left unchanged.
 */
export function applyJerseyNumberFallback(field: LineupPlayer[]): LineupPlayer[] {
  const needsFix = field.some((p) => isInvalidCoordinate(p.fieldCoordinate))
  if (!needsFix) return field

  return field.map((p) => {
    if (!isInvalidCoordinate(p.fieldCoordinate)) return p
    const place = ((p.jerseyNumber - 1) % 11) + 1
    const coord = JERSEY_442_MAP[place]
    if (!coord) return p
    return { ...p, fieldCoordinate: coord }
  })
}

/**
 * Last-resort fallback: place any remaining player with invalid coordinates
 * at the center midfield position.
 */
export function defaultToMidfielder(field: LineupPlayer[]): LineupPlayer[] {
  const needsFix = field.some((p) => isInvalidCoordinate(p.fieldCoordinate))
  if (!needsFix) return field

  return field.map((p) => {
    if (!isInvalidCoordinate(p.fieldCoordinate)) return p
    return { ...p, fieldCoordinate: { x: 500, y: 550 } }
  })
}
