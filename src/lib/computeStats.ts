import { getBestSource } from '@/lib/youtube'
import type { Performance } from '@/types/performance'

const platformColors: Record<string, string> = {
  YouTube: '#FF0000',
  'Amazon Prime Video': '#00A8E1',
  Netflix: '#E50914',
  'Disney+': '#113CCF',
  'Apple TV+': '#000',
  Hulu: '#1CE783',
  Max: '#0046FF',
}

/**
 * Returns the most-frequent non-null value in `values`, or null when the list
 * is empty or multiple values share the highest frequency.
 */
export function mode(values: (string | null | undefined)[]): string | null {
  const counts = new Map<string, number>()
  for (const v of values) {
    if (!v) continue
    counts.set(v, (counts.get(v) || 0) + 1)
  }
  if (!counts.size) return null
  const maxCount = Math.max(...counts.values())
  const winners = [...counts.entries()].filter(([, n]) => n === maxCount)
  return winners.length === 1 ? winners[0][0] : null
}

export function computeStats(saved: Performance[]) {
  const artists = new Set(saved.map(p => p.artist_name).filter(Boolean))
  const venues = new Set(saved.map(p => p.venue_name).filter(Boolean) as string[])
  const totalMins = saved.reduce((sum, p) => sum + (p.duration_minutes || 0), 0)

  const platformCounts = new Map<string, number>()
  for (const p of saved) {
    const best = getBestSource(p.watch_sources)
    if (!best) continue
    const key = best.isYouTube ? 'YouTube' : (best.platform || 'Other')
    platformCounts.set(key, (platformCounts.get(key) || 0) + 1)
  }
  const totalWithSource = [...platformCounts.values()].reduce((a, b) => a + b, 0)
  const platformBreakdown = [...platformCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([platform, n]) => ({
      platform,
      pct: totalWithSource ? Math.round((n / totalWithSource) * 100) : 0,
      color: platformColors[platform] || '#888',
    }))

  return {
    badges: [
      { label: 'Performances Saved', value: String(saved.length), color: '#FF006E' },
      { label: 'Artists Followed', value: String(artists.size), color: '#00F5FF' },
      { label: 'Venues Visited', value: String(venues.size), color: '#BCFF00' },
      { label: 'Hours of Live Music', value: String(Math.round(totalMins / 60)), color: '#FF7A00' },
    ],
    mostWatchedArtist: mode(saved.map(p => p.artist_name)),
    favoriteVenue: mode(saved.map(p => p.venue_name)),
    topPerformanceType: mode(saved.map(p => p.performance_type)),
    platformBreakdown,
  }
}
