/**
 * Mulberry32 PRNG — deterministic given a seed.
 * Returns values in [0, 1).
 */
export function createRng(seed: number): () => number {
  let s = seed | 0
  return function () {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Get seed from SEED env var or Date.now() */
export function getSeed(): number {
  const envSeed = process.env['SEED']
  return envSeed ? Number(envSeed) : Date.now()
}

/** Pick 1 random item from array */
export function pickOne<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]
}

/** Pick N random items from array without replacement */
export function pickN<T>(arr: T[], n: number, rng: () => number): T[] {
  const copy = [...arr]
  const result: T[] = []
  const count = Math.min(n, copy.length)
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(rng() * copy.length)
    result.push(copy.splice(idx, 1)[0])
  }
  return result
}

/** Random integer in [min, max] inclusive */
export function randInt(min: number, max: number, rng: () => number): number {
  return min + Math.floor(rng() * (max - min + 1))
}

/**
 * Select test seasons: first available + current + 1 random per decade in between.
 * Input: allSeasons sorted newest-first (from provider.getSeasons()).
 */
export function pickTestSeasons(allSeasons: number[], rng: () => number): number[] {
  if (allSeasons.length === 0) return []
  const current = allSeasons[0]
  const first = allSeasons[allSeasons.length - 1]

  if (current === first) return [current]

  const result = new Set([first, current])

  // Group intermediate seasons by decade
  const decades = new Map<number, number[]>()
  for (const year of allSeasons) {
    if (year === first || year === current) continue
    const decade = Math.floor(year / 10) * 10
    if (!decades.has(decade)) decades.set(decade, [])
    decades.get(decade)!.push(year)
  }

  // Pick 1 random season per decade
  for (const [, years] of decades) {
    result.add(pickOne(years, rng))
  }

  return [...result].sort((a, b) => a - b)
}

/** Log all selections for reproducibility */
export function logSelections(config: {
  seed: number
  provider: string
  seasons: number[]
  picks: Map<number, { matchIds: (string | number)[]; gameweeks?: number[] }>
}): void {
  console.log('')
  console.log('══════════════════════════════════════════')
  console.log(`  Seed: ${config.seed}`)
  console.log(`  Reproduce: SEED=${config.seed} npm run test:integration`)
  console.log('══════════════════════════════════════════')
  console.log('')
  console.log(`Provider: ${config.provider}`)
  console.log(`  Test seasons: [${config.seasons.join(', ')}]`)
  for (const [season, pick] of config.picks) {
    const gwInfo = pick.gameweeks ? ` gw [${pick.gameweeks.join(', ')}] →` : ''
    console.log(`  Season ${season}:${gwInfo} matches [${pick.matchIds.join(', ')}]`)
  }
  console.log('')
}
