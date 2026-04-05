const MIN_AGE = 15
const MAX_AGE = 60

function clampAge(age: number): number {
  return Math.max(MIN_AGE, Math.min(MAX_AGE, age))
}

/**
 * Compute a player's age on match day.
 *
 * Priority:
 * 1. birthDate + matchDate → exact calculation
 * 2. currentAge + matchDate → approximate (currentAge - years since match)
 * 3. currentAge alone → raw API value
 *
 * Result is clamped to 15–60 (the realistic range for professional footballers).
 */
export function computeMatchDayAge({
  birthDate,
  matchDate,
  currentAge,
}: {
  birthDate?: string
  matchDate?: string
  currentAge?: string | number
}): number | string | undefined {
  if (birthDate && matchDate) {
    const birth = new Date(birthDate)
    const target = new Date(matchDate)
    let age = target.getUTCFullYear() - birth.getUTCFullYear()
    const monthDiff = target.getUTCMonth() - birth.getUTCMonth()
    if (monthDiff < 0 || (monthDiff === 0 && target.getUTCDate() < birth.getUTCDate())) {
      age--
    }
    return clampAge(age)
  }

  if (currentAge != null && matchDate) {
    const yearsSinceMatch = Math.round(
      (Date.now() - new Date(matchDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000),
    )
    return clampAge(Number(currentAge) - yearsSinceMatch)
  }

  return currentAge
}
