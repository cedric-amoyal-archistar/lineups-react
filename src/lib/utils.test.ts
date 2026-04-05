import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('returns a single class unchanged', () => {
    expect(cn('text-red-500')).toBe('text-red-500')
  })

  it('merges multiple classes', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2')
  })

  it('resolves Tailwind conflicts — last wins', () => {
    // tailwind-merge should deduplicate conflicting utilities
    expect(cn('px-4', 'px-6')).toBe('px-6')
  })

  it('handles conditional falsy values', () => {
    const condition = false
    expect(cn('base', condition && 'not-included', undefined, null, 'end')).toBe('base end')
  })

  it('handles object syntax from clsx', () => {
    expect(cn({ 'font-bold': true, 'font-normal': false })).toBe('font-bold')
  })

  it('returns empty string for no inputs', () => {
    expect(cn()).toBe('')
  })
})
