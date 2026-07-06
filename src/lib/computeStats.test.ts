import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockGetBestSource } = vi.hoisted(() => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockGetBestSource: vi.fn<() => any>(() => null),
}))

vi.mock('@/lib/youtube', () => ({
  getBestSource: mockGetBestSource,
}))

import { mode, computeStats } from './computeStats'
import type { Performance } from '@/types/performance'

function makePerf(overrides: Partial<Performance> = {}): Performance {
  return {
    id: '1',
    artist_name: 'Artist',
    event_name: null,
    venue_name: null,
    performance_date: null,
    performance_type: null,
    duration_minutes: null,
    watch_sources: [],
    ...overrides,
  }
}

beforeEach(() => {
  mockGetBestSource.mockReturnValue(null)
})

describe('mode()', () => {
  it('returns null for empty list', () => {
    expect(mode([])).toBeNull()
  })

  it('returns null when all values are null/undefined', () => {
    expect(mode([null, undefined, null])).toBeNull()
  })

  it('returns the single unique winner', () => {
    expect(mode(['a', 'b', 'a'])).toBe('a')
  })

  it('returns null when values are tied', () => {
    expect(mode(['a', 'b'])).toBeNull()
  })

  it('ignores null/undefined entries when computing frequency', () => {
    expect(mode([null, 'a', undefined, 'a', 'b'])).toBe('a')
  })
})

describe('computeStats()', () => {
  it('returns zero-value badges for empty saved list', () => {
    const stats = computeStats([])
    expect(stats.badges).toEqual([
      { label: 'Performances Saved', value: '0', color: '#FF006E' },
      { label: 'Artists Followed', value: '0', color: '#00F5FF' },
      { label: 'Venues Visited', value: '0', color: '#BCFF00' },
      { label: 'Hours of Live Music', value: '0', color: '#FF7A00' },
    ])
    expect(stats.platformBreakdown).toEqual([])
    expect(stats.mostWatchedArtist).toBeNull()
    expect(stats.favoriteVenue).toBeNull()
    expect(stats.topPerformanceType).toBeNull()
  })

  it('duration_minutes null entries contribute 0 to total without throwing', () => {
    const saved = [
      makePerf({ duration_minutes: 60 }),
      makePerf({ duration_minutes: null }),
      makePerf({ duration_minutes: 30 }),
    ]
    const stats = computeStats(saved)
    const hoursBadge = stats.badges.find(b => b.label === 'Hours of Live Music')
    expect(hoursBadge?.value).toBe('2') // (60 + 0 + 30) / 60 = 1.5 → rounds to 2
  })

  it('counts unique artists and venues correctly', () => {
    const saved = [
      makePerf({ artist_name: 'Taylor', venue_name: 'MSG' }),
      makePerf({ artist_name: 'Taylor', venue_name: 'Wembley' }),
      makePerf({ artist_name: 'Drake', venue_name: 'MSG' }),
    ]
    const stats = computeStats(saved)
    expect(stats.badges.find(b => b.label === 'Artists Followed')?.value).toBe('2')
    expect(stats.badges.find(b => b.label === 'Venues Visited')?.value).toBe('2')
  })

  it('platform breakdown percentages are rounded correctly', () => {
    mockGetBestSource
      .mockReturnValueOnce({ isYouTube: true, platform: 'YouTube', url: 'yt1' })
      .mockReturnValueOnce({ isYouTube: true, platform: 'YouTube', url: 'yt2' })
      .mockReturnValueOnce({ isYouTube: false, platform: 'Netflix', url: 'nf1' })

    const saved = [makePerf(), makePerf(), makePerf()]
    const stats = computeStats(saved)
    const yt = stats.platformBreakdown.find(p => p.platform === 'YouTube')
    const nf = stats.platformBreakdown.find(p => p.platform === 'Netflix')
    expect(yt?.pct).toBe(67) // Math.round(2/3*100)
    expect(nf?.pct).toBe(33) // Math.round(1/3*100)
    // YouTube listed first (higher count)
    expect(stats.platformBreakdown[0].platform).toBe('YouTube')
  })

  it('skips performances with no watch source in platform breakdown', () => {
    mockGetBestSource.mockReturnValue(null)
    const saved = [makePerf(), makePerf()]
    const stats = computeStats(saved)
    expect(stats.platformBreakdown).toEqual([])
  })

  it('uses "Other" for sources with no platform name and not YouTube', () => {
    mockGetBestSource.mockReturnValue({ isYouTube: false, platform: null, url: 'x' })
    const saved = [makePerf()]
    const stats = computeStats(saved)
    expect(stats.platformBreakdown[0].platform).toBe('Other')
    expect(stats.platformBreakdown[0].color).toBe('#888')
  })
})
