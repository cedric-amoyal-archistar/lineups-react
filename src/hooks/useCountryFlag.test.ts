import { describe, it, expect } from 'vitest'
import { getFlagUrl } from './useCountryFlag'

/**
 * Tests for the FIFA-to-ISO2 country code lookup table.
 * P0 risk per analysis: wrong flag displayed if mapping is incorrect.
 */

describe('getFlagUrl', () => {
  // -------------------------------------------------------------------------
  // URL structure
  // -------------------------------------------------------------------------

  it('returns a flagcdn URL', () => {
    const url = getFlagUrl('ESP')
    expect(url).toContain('https://flagcdn.com/')
  })

  it('includes the default size (40) in the URL', () => {
    expect(getFlagUrl('ESP')).toContain('w40/')
  })

  it('uses a custom size when provided', () => {
    expect(getFlagUrl('ESP', 80)).toContain('w80/')
  })

  it('returns a .png URL', () => {
    expect(getFlagUrl('ESP')).toMatch(/\.png$/)
  })

  // -------------------------------------------------------------------------
  // Known mappings — major UEFA Champions League nations
  // -------------------------------------------------------------------------

  it('maps ESP -> es (Spain)', () => {
    expect(getFlagUrl('ESP')).toContain('/es.png')
  })

  it('maps GER -> de (Germany)', () => {
    expect(getFlagUrl('GER')).toContain('/de.png')
  })

  it('maps FRA -> fr (France)', () => {
    expect(getFlagUrl('FRA')).toContain('/fr.png')
  })

  it('maps ENG -> gb-eng (England)', () => {
    expect(getFlagUrl('ENG')).toContain('/gb-eng.png')
  })

  it('maps SCO -> gb-sct (Scotland)', () => {
    expect(getFlagUrl('SCO')).toContain('/gb-sct.png')
  })

  it('maps WAL -> gb-wls (Wales)', () => {
    expect(getFlagUrl('WAL')).toContain('/gb-wls.png')
  })

  it('maps NIR -> gb-nir (Northern Ireland)', () => {
    expect(getFlagUrl('NIR')).toContain('/gb-nir.png')
  })

  it('maps ITA -> it (Italy)', () => {
    expect(getFlagUrl('ITA')).toContain('/it.png')
  })

  it('maps POR -> pt (Portugal)', () => {
    expect(getFlagUrl('POR')).toContain('/pt.png')
  })

  it('maps NED -> nl (Netherlands)', () => {
    expect(getFlagUrl('NED')).toContain('/nl.png')
  })

  it('maps BEL -> be (Belgium)', () => {
    expect(getFlagUrl('BEL')).toContain('/be.png')
  })

  it('maps BRA -> br (Brazil)', () => {
    expect(getFlagUrl('BRA')).toContain('/br.png')
  })

  it('maps ARG -> ar (Argentina)', () => {
    expect(getFlagUrl('ARG')).toContain('/ar.png')
  })

  it('maps CRO -> hr (Croatia)', () => {
    expect(getFlagUrl('CRO')).toContain('/hr.png')
  })

  it('maps SRB -> rs (Serbia)', () => {
    expect(getFlagUrl('SRB')).toContain('/rs.png')
  })

  it('maps POL -> pl (Poland)', () => {
    expect(getFlagUrl('POL')).toContain('/pl.png')
  })

  it('maps UKR -> ua (Ukraine)', () => {
    expect(getFlagUrl('UKR')).toContain('/ua.png')
  })

  it('maps TUR -> tr (Turkey)', () => {
    expect(getFlagUrl('TUR')).toContain('/tr.png')
  })

  it('maps SUI -> ch (Switzerland)', () => {
    expect(getFlagUrl('SUI')).toContain('/ch.png')
  })

  it('maps DEN -> dk (Denmark)', () => {
    expect(getFlagUrl('DEN')).toContain('/dk.png')
  })

  it('maps NOR -> no (Norway)', () => {
    expect(getFlagUrl('NOR')).toContain('/no.png')
  })

  it('maps SWE -> se (Sweden)', () => {
    expect(getFlagUrl('SWE')).toContain('/se.png')
  })

  it('maps KSA -> sa (Saudi Arabia)', () => {
    expect(getFlagUrl('KSA')).toContain('/sa.png')
  })

  it('maps KVX -> xk (Kosovo)', () => {
    // Kosovo uses the unofficial xk code
    expect(getFlagUrl('KVX')).toContain('/xk.png')
  })

  it('maps RSA -> za (South Africa)', () => {
    expect(getFlagUrl('RSA')).toContain('/za.png')
  })

  it('maps USA -> us (United States)', () => {
    expect(getFlagUrl('USA')).toContain('/us.png')
  })

  it('maps MKD -> mk (North Macedonia)', () => {
    expect(getFlagUrl('MKD')).toContain('/mk.png')
  })

  it('maps BIH -> ba (Bosnia and Herzegovina)', () => {
    expect(getFlagUrl('BIH')).toContain('/ba.png')
  })

  it('maps MNE -> me (Montenegro)', () => {
    expect(getFlagUrl('MNE')).toContain('/me.png')
  })

  // -------------------------------------------------------------------------
  // Fallback behavior for unknown codes
  // -------------------------------------------------------------------------

  it('falls back to lowercased first 2 chars of unknown code', () => {
    // 'XYZ' is not in the table -> 'xy'
    expect(getFlagUrl('XYZ')).toContain('/xy.png')
  })

  it('fallback for 2-char code lowercases it', () => {
    // 'UK' not in table -> 'uk'
    expect(getFlagUrl('UK')).toContain('/uk.png')
  })

  it('fallback for empty string returns a URL (does not throw)', () => {
    // Edge case: empty string -> slice(0,2) = '' -> URL ends with /.png
    expect(() => getFlagUrl('')).not.toThrow()
  })
})
