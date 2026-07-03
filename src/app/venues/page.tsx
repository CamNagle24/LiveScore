'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { PageNav } from '@/components/PageNav'
import { SuggestFooter } from '@/components/SuggestFooter'

// ─── Types ────────────────────────────────────────────────────────────────────

interface VenueEntry {
  name: string
  count: number
  artists: string[]
}

type VenueSort = 'count' | 'az' | 'za'

// ─── CSS ─────────────────────────────────────────────────────────────────────

const STYLES = `
  body { background: #030014; }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .venue-card { animation: fadeUp 0.3s ease both; }
  @media (prefers-reduced-motion: reduce) { .venue-card { animation: none; } }
`

// ─── Venue Card ───────────────────────────────────────────────────────────────

function VenueCard({ venue, delay }: { venue: VenueEntry; delay: number }) {
  const router = useRouter()
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="venue-card"
      role="link"
      tabIndex={0}
      aria-label={`Browse performances at ${venue.name}`}
      style={{ animationDelay: `${delay}ms`, cursor: 'pointer', borderRadius: '16px', overflow: 'hidden', background: 'rgba(255,255,255,0.04)', border: `1px solid ${hovered ? 'rgba(0,245,255,0.3)' : 'rgba(255,255,255,0.07)'}`, transform: hovered ? 'translateY(-4px)' : 'none', boxShadow: hovered ? '0 16px 40px rgba(0,0,0,0.5)' : 'none', transition: 'all 200ms ease', padding: '24px' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => router.push(`/search?q=${encodeURIComponent(venue.name)}`)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          router.push(`/search?q=${encodeURIComponent(venue.name)}`)
        }
      }}
    >
      {/* Icon */}
      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: hovered ? 'rgba(0,245,255,0.12)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', marginBottom: '16px', transition: 'background 200ms', border: '1px solid rgba(255,255,255,0.08)' }}>
        📍
      </div>

      {/* Name */}
      <div style={{ fontFamily: 'var(--font-dm-sans, system-ui)', fontWeight: 700, fontSize: '16px', color: '#fff', marginBottom: '6px', lineHeight: 1.3 }}>
        {venue.name}
      </div>

      {/* Count */}
      <div style={{ fontFamily: 'var(--font-dm-sans, system-ui)', fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginBottom: '12px' }}>
        {venue.count} performance{venue.count !== 1 ? 's' : ''}
      </div>

      {/* Artists preview */}
      {venue.artists.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {venue.artists.slice(0, 3).map(a => (
            <span
              key={a}
              style={{ fontFamily: 'var(--font-dm-sans, system-ui)', fontSize: '10px', color: 'rgba(0,245,255,0.7)', background: 'rgba(0,245,255,0.06)', border: '1px solid rgba(0,245,255,0.12)', borderRadius: '4px', padding: '2px 7px' }}
            >
              {a}
            </span>
          ))}
          {venue.artists.length > 3 && (
            <span style={{ fontFamily: 'var(--font-dm-sans, system-ui)', fontSize: '10px', color: 'rgba(255,255,255,0.25)', padding: '2px 4px' }}>
              +{venue.artists.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Arrow */}
      <div style={{ marginTop: '14px', fontSize: '12px', color: hovered ? 'rgba(0,245,255,0.7)' : 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-dm-sans, system-ui)', fontWeight: 600, letterSpacing: '0.04em', transition: 'color 150ms', display: 'flex', alignItems: 'center', gap: '5px' }}>
        Browse performances
        <span style={{ transform: hovered ? 'translateX(4px)' : 'none', transition: 'transform 150ms', display: 'inline-block' }}>→</span>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VenuesPage() {
  const [venues, setVenues] = useState<VenueEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [inputValue, setInputValue] = useState('')
  const [filter, setFilter] = useState('')
  const [sort, setSort] = useState<VenueSort>('count')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('performances')
        .select('venue_name, artist_name')
        .not('venue_name', 'is', null)

      if (!data) { setLoading(false); return }

      const venueMap: Record<string, { count: number; artists: Set<string> }> = {}
      for (const row of data) {
        if (!row.venue_name) continue
        if (!venueMap[row.venue_name]) venueMap[row.venue_name] = { count: 0, artists: new Set() }
        venueMap[row.venue_name].count++
        if (row.artist_name) venueMap[row.venue_name].artists.add(row.artist_name)
      }

      const entries: VenueEntry[] = Object.entries(venueMap)
        .sort((a, b) => b[1].count - a[1].count)
        .map(([name, val]) => ({ name, count: val.count, artists: Array.from(val.artists) }))

      setVenues(entries)
      setLoading(false)
    }
    load()
  }, [])

  // Clear any pending debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const handleFilterInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInputValue(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setFilter(val), 400)
  }

  const filtered = (filter.trim()
    ? venues.filter(v => v.name.toLowerCase().includes(filter.toLowerCase()))
    : [...venues]
  ).sort((a, b) =>
    sort === 'count' ? b.count - a.count
    : sort === 'az' ? a.name.localeCompare(b.name)
    : b.name.localeCompare(a.name)
  )

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div style={{ background: '#030014', color: '#fff', minHeight: '100vh', fontFamily: 'var(--font-dm-sans, system-ui)' }}>
        <PageNav />

        {/* Header */}
        <div style={{ background: 'radial-gradient(ellipse at 50% 0%,#001a30 0%,#030014 70%)', padding: '60px 24px 40px', textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'var(--font-bebas, sans-serif)', fontSize: 'clamp(36px,6vw,64px)', letterSpacing: '0.06em', margin: '0 0 8px', color: '#fff' }}>
            VENUES
          </h1>

          <div style={{ position: 'relative', maxWidth: '480px', margin: '0 auto' }}>
            <div style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: '18px', pointerEvents: 'none' }}>⌕</div>
            <input
              type="text"
              value={inputValue}
              onChange={handleFilterInput}
              placeholder="Filter venues..."
              style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '12px', padding: '14px 20px 14px 48px', color: '#fff', fontSize: '15px', fontFamily: 'var(--font-dm-sans, system-ui)', outline: 'none', boxSizing: 'border-box', transition: 'border-color 150ms' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(0,245,255,0.5)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)' }}
            />
          </div>
        </div>

        {/* Sort bar */}
        {!loading && venues.length > 0 && (
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 24px 0', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-dm-sans, system-ui)', marginRight: '4px' }}>Sort:</span>
            {([['count', 'Most Performances'], ['az', 'A → Z'], ['za', 'Z → A']] as [VenueSort, string][]).map(([val, label]) => (
              <button key={val} onClick={() => setSort(val)}
                style={{ background: sort === val ? 'rgba(0,245,255,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${sort === val ? 'rgba(0,245,255,0.35)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '8px', padding: '5px 12px', color: sort === val ? '#00F5FF' : 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: sort === val ? 600 : 400, cursor: 'pointer', fontFamily: 'var(--font-dm-sans, system-ui)', transition: 'all 150ms' }}
              >{label}</button>
            ))}
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-bebas, sans-serif)', fontSize: '22px', color: '#fff', letterSpacing: '0.06em' }}>{filtered.length} VENUES</span>
          </div>
        )}

        {/* Grid */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 24px 80px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: '22px', height: '22px', border: '2px solid rgba(0,245,255,0.3)', borderTopColor: '#00F5FF', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>Loading venues...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: '40px', opacity: 0.2, marginBottom: '16px' }}>📍</div>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '16px' }}>No venues found</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {filtered.map((venue, i) => (
                <VenueCard key={venue.name} venue={venue} delay={i * 40} />
              ))}
            </div>
          )}
        </div>

        <SuggestFooter />
      </div>
    </>
  )
}
