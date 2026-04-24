// Maps FIFA stage names + matchDay to our 8-gameweek scheme:
// GW 1-3 = Group MD1/2/3, GW 4 = R16, GW 5 = QF, GW 6 = SF, GW 7 = 3rd place, GW 8 = Final
const STAGE_TO_GW: Record<string, number> = {
  'round of 16': 4,
  'quarter-final': 5,
  'semi-final': 6,
  'play-off for third place': 7,
  final: 8,
}

export function stageToGameweek(stageNameEn: string, matchDay: number): number {
  const normalized = stageNameEn.toLowerCase().trim()
  const fixed = STAGE_TO_GW[normalized]
  if (fixed !== undefined) return fixed
  // Group stage: matchDay is 1, 2, or 3
  return Math.min(Math.max(matchDay, 1), 3)
}

const GW_LABELS: Record<number, string> = {
  1: 'Matchday 1',
  2: 'Matchday 2',
  3: 'Matchday 3',
  4: 'Round of 16',
  5: 'Quarter-finals',
  6: 'Semi-finals',
  7: 'Third-place play-off',
  8: 'Final',
}

export function gameweekLabel(gw: number): string {
  return GW_LABELS[gw] ?? `Matchday ${gw}`
}
