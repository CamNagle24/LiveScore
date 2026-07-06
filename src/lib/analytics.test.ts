import { describe, it, expect } from 'vitest'
import { track } from './analytics'

describe('track()', () => {
  it('does not throw for search_submit', () => {
    expect(() => track('search_submit', { query: 'Beyoncé' })).not.toThrow()
  })

  it('does not throw for artist_card_click', () => {
    expect(() => track('artist_card_click', { artist: 'Taylor Swift' })).not.toThrow()
  })

  it('does not throw for save_toggle (saved=true)', () => {
    expect(() => track('save_toggle', { performanceId: 'p1', saved: true })).not.toThrow()
  })

  it('does not throw for save_toggle (saved=false)', () => {
    expect(() => track('save_toggle', { performanceId: 'p1', saved: false })).not.toThrow()
  })

  it('returns void (is a no-op)', () => {
    expect(track('search_submit', { query: 'test' })).toBeUndefined()
  })
})
