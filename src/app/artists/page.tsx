'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { PageNav } from '@/components/PageNav'
import { SuggestFooter } from '@/components/SuggestFooter'
import { track } from '@/lib/analytics'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ArtistEntry {
  name: string
  count: number
  thumb: string | null
}

// ─── CSS ─────────────────────────────────────────────────────────────────────

const STYLES = `
  body { background: #030014; }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .artist-card { animation: fadeUp 0.3s ease both; }
  @media (prefers-reduced-motion: reduce) { .artist-card { animation: none; } }
`

// ─── Artist Card ─────────────────────────────────────────────────────────────

function ArtistCard({ artist, delay }: { artist: ArtistEntry; delay: number }) {
  const router = useRouter()
  const [hovered, setHovered] = useState(false)
  const [imgErr, setImgErr] = useState(false)

  return (
    <div
      className="artist-card"
      role="link"
      tabIndex={0}
      aria-label={`View ${artist.name}`}
      style={{ animationDelay: `${delay}ms`, cursor: 'pointer', borderRadius: '16px', overflow: 'hidden', background: 'rgba(255,255,255,0.04)', border: `1px solid ${hovered ? 'rgba(255,0,110,0.35)' : 'rgba(255,255,255,0.07)'}`, transform: hovered ? 'translateY(-5px)' : 'none', boxShadow: hovered ? '0 20px 40px rgba(0,0,0,0.5)' : 'none', transition: 'all 200ms ease' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => { track('artist_card_click', { artist: artist.name }); router.push(`/artist/${encodeURIComponent(artist.name)}`) }}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          router.push(`/artist/${encodeURIComponent(artist.name)}`)
        }
      }}
    >
      {/* Artist image */}
      <div style={{ width: '100%', paddingTop: '75%', position: 'relative', background: 'linear-gradient(135deg,#1a0030,#0d0015)', overflow: 'hidden' }}>
        {artist.thumb && !imgErr ? (
          <img
            src={artist.thumb}
            alt={artist.name}
            onError={() => setImgErr(true)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', transform: hovered ? 'scale(1.06)' : 'scale(1)', transition: 'transform 350ms ease' }}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-bebas, sans-serif)', fontSize: '64px', color: 'rgba(255,255,255,0.06)', letterSpacing: '0.04em' }}>
            {(artist.name[0] || '?').toUpperCase()}
          </div>
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg,rgba(0,0,0,0.7) 0%,transparent 50%)', opacity: hovered ? 1 : 0.4, transition: 'opacity 200ms' }} />
        {hovered && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '44px', height: '44px', background: 'rgba(255,0,110,0.9)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: '#fff' }}>→</div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '14px' }}>
        <div style={{ fontFamily: 'var(--font-dm-sans, system-ui)', fontWeight: 700, fontSize: '15px', color: '#fff', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {artist.name}
        </div>
        <div style={{ fontFamily: 'var(--font-dm-sans, system-ui)', fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
          {artist.count} performance{artist.count !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type ArtistSort = 'count' | 'az' | 'za'

export default function ArtistsPage() {
  const [artists, setArtists] = useState<ArtistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [filter, setFilter] = useState('')
  const [sort, setSort] = useState<ArtistSort>('count')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const load = async () => {
      let entries: ArtistEntry[] = []
      try {
        const { data, error } = await supabase
          .from('performances')
          .select('artist_name')
          .order('artist_name', { ascending: true })
        if (error) throw error

        // Count and deduplicate
        const counts: Record<string, number> = {}
        for (const row of data ?? []) {
          if (!row.artist_name) continue
          counts[row.artist_name] = (counts[row.artist_name] || 0) + 1
        }

        entries = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .map(([name, count]) => ({ name, count, thumb: null }))

        setArtists(entries)
      } catch {
        setLoadError(true)
        return
      } finally {
        setLoading(false)
      }

      // Enrich with TheAudioDB thumbnails. Fetch with bounded concurrency
      // (rather than one request per artist at once) so we don't overwhelm
      // the rate-limited upstream API, and reveal thumbnails as they arrive.
      const thumbs: Record<string, string> = {}
      const queue = [...entries]
      const CONCURRENCY = 5

      const worker = async () => {
        while (queue.length > 0) {
          const entry = queue.shift()
          if (!entry) break
          try {
            const res = await fetch(`/api/artists/search?q=${encodeURIComponent(entry.name)}`)
            const json = await res.json()
            const thumb = json.artists?.[0]?.thumb
            if (thumb) {
              thumbs[entry.name] = thumb
              setArtists(prev => prev.map(a => (thumbs[a.name] ? { ...a, thumb: thumbs[a.name] } : a)))
            }
          } catch {
            // leave this artist without a thumbnail
          }
        }
      }

      await Promise.all(Array.from({ length: CONCURRENCY }, worker))
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
    ? artists.filter(a => a.name.toLowerCase().includes(filter.toLowerCase()))
    : [...artists]
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
        <div style={{ background: 'radial-gradient(ellipse at 50% 0%,#1a0030 0%,#030014 70%)', padding: '60px 24px 40px', textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'var(--font-bebas, sans-serif)', fontSize: 'clamp(36px,6vw,64px)', letterSpacing: '0.06em', margin: '0 0 8px', color: '#fff' }}>
            ARTISTS
          </h1>

          <div style={{ position: 'relative', maxWidth: '480px', margin: '0 auto' }}>
            <div style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: '18px', pointerEvents: 'none' }}>⌕</div>
            <input
              type="text"
              value={inputValue}
              onChange={handleFilterInput}
              placeholder="Filter artists..."
              aria-label="Filter artists by name"
              style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '12px', padding: '14px 20px 14px 48px', color: '#fff', fontSize: '15px', fontFamily: 'var(--font-dm-sans, system-ui)', outline: 'none', boxSizing: 'border-box', transition: 'border-color 150ms' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(255,0,110,0.5)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)' }}
            />
          </div>
        </div>

        {/* Sort bar */}
        {!loading && artists.length > 0 && (
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 24px 0', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-dm-sans, system-ui)', marginRight: '4px' }}>Sort:</span>
            {([['count', 'Most Performances'], ['az', 'A → Z'], ['za', 'Z → A']] as [ArtistSort, string][]).map(([val, label]) => (
              <button key={val} onClick={() => setSort(val)}
                style={{ background: sort === val ? 'rgba(255,0,110,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${sort === val ? 'rgba(255,0,110,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '8px', padding: '5px 12px', color: sort === val ? '#FF006E' : 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: sort === val ? 600 : 400, cursor: 'pointer', fontFamily: 'var(--font-dm-sans, system-ui)', transition: 'all 150ms' }}
              >{label}</button>
            ))}
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-bebas, sans-serif)', fontSize: '22px', color: '#fff', letterSpacing: '0.06em' }}>{filtered.length} ARTISTS</span>
          </div>
        )}

        {/* Grid */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 24px 80px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: '22px', height: '22px', border: '2px solid rgba(255,0,110,0.3)', borderTopColor: '#FF006E', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>Loading artists...</span>
            </div>
          ) : loadError ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px' }}>
                Couldn&apos;t load artists. Check your connection and try again.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: '40px', opacity: 0.2, marginBottom: '16px' }}>♪</div>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '16px' }}>No artists found</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '18px' }}>
              {filtered.map((artist, i) => (
                <ArtistCard key={artist.name} artist={artist} delay={i * 30} />
              ))}
            </div>
          )}
        </div>

        <SuggestFooter />
      </div>
    </>
  )
}
