import type { LineupPlayer } from '@/types/match'

const POSITION_Y: Record<string, number> = {
  GOALKEEPER: 100,
  DEFENDER: 300,
  MIDFIELDER: 550,
  FORWARD: 800,
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

  // Spread unknown players into the MIDFIELDER row
  if (unknown.length > 0) {
    const midList = groups.get('MIDFIELDER') ?? []
    midList.push(...unknown)
    groups.set('MIDFIELDER', midList)
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
