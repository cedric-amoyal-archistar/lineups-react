import { describe, it, expect } from 'vitest'
import { getAllProviders } from '@/providers/registry'

describe('CompetitionProvider cross-provider invariants', () => {
  it('every provider declares a competitionType', () => {
    for (const p of getAllProviders()) {
      expect(p.competitionType).toMatch(/^(club-league|club-cup|national)$/)
    }
  })

  it("paginationMode 'gameweek' is only used by 'club-league' competitions", () => {
    for (const p of getAllProviders()) {
      if (p.paginationMode === 'gameweek') {
        expect(p.competitionType, `${p.id} uses gameweek pagination`).toBe('club-league')
      }
    }
  })

  it("every 'gameweek' provider implements the three gameweek methods", () => {
    for (const p of getAllProviders()) {
      if (p.paginationMode === 'gameweek') {
        expect('fetchMatchesByGameweek' in p, p.id).toBe(true)
        expect('getTotalGameweeks' in p, p.id).toBe(true)
        expect('getDefaultGameweek' in p, p.id).toBe(true)
      }
    }
  })

  it("'national' competitions never use gameweek pagination", () => {
    for (const p of getAllProviders()) {
      if (p.competitionType === 'national') {
        expect(p.paginationMode, p.id).toBe('offset')
      }
    }
  })
})
