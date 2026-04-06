/**
 * Maps a formation string + formationPlace (1-11) to x,y coordinates on a 0-1000 scale.
 *
 * Formation positions are numbered sequentially from back to front:
 *   1 = GK, then defenders L→R, midfielders L→R, forwards L→R.
 *
 * The formation string (e.g. "433") encodes the number of players per row
 * from defense to attack.
 */

interface Coordinate {
  x: number
  y: number
}

type FormationMap = Record<number, Coordinate>

/**
 * Known formation row structures.
 * Each array starts with [1] for the GK, then the digits of the formation.
 */
const FORMATION_ROWS: Record<string, number[]> = {
  '343': [1, 3, 4, 3],
  '3412': [1, 3, 4, 1, 2],
  '3421': [1, 3, 4, 2, 1],
  '352': [1, 3, 5, 2],
  '3511': [1, 3, 5, 1, 1],
  '4132': [1, 4, 1, 3, 2],
  '4141': [1, 4, 1, 4, 1],
  '4231': [1, 4, 2, 3, 1],
  '4222': [1, 4, 2, 2, 2],
  '4312': [1, 4, 3, 1, 2],
  '4321': [1, 4, 3, 2, 1],
  '433': [1, 4, 3, 3],
  '4411': [1, 4, 4, 1, 1],
  '442': [1, 4, 4, 2],
  '451': [1, 4, 5, 1],
  '532': [1, 5, 3, 2],
  '541': [1, 5, 4, 1],
  '5311': [1, 5, 3, 1, 1],
}

function buildCoordinateMap(rows: number[]): FormationMap {
  const map: FormationMap = {}
  let place = 1
  const totalRows = rows.length

  for (let rowIdx = 0; rowIdx < totalRows; rowIdx++) {
    const count = rows[rowIdx]
    // GK at y=80, last row at y=880, interpolate evenly
    const y = totalRows === 1 ? 500 : Math.round(80 + (rowIdx / (totalRows - 1)) * 800)

    for (let j = 0; j < count; j++) {
      const x = Math.round(((j + 1) / (count + 1)) * 1000)
      map[place] = { x, y }
      place++
    }
  }

  return map
}

/**
 * Parse an unknown formation string into rows by splitting digits.
 * Prepends [1] for the GK row.
 */
function parseFormation(formation: string): number[] {
  const digits = formation.split('').map(Number).filter(Boolean)
  return [1, ...digits]
}

const cache = new Map<string, FormationMap>()

export function getFormationCoordinates(formation: string): FormationMap {
  const cached = cache.get(formation)
  if (cached) return cached

  const rows = FORMATION_ROWS[formation] ?? parseFormation(formation)
  const map = buildCoordinateMap(rows)
  cache.set(formation, map)
  return map
}
