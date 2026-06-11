'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getYouTubeThumbnail, getBestSource } from '@/lib/youtube'
import { PageNav } from '@/components/PageNav'
import { SuggestFooter } from '@/components/SuggestFooter'
import { PlatformBadge } from '@/components/PlatformBadge'
import { SaveButton } from '@/components/SaveButton'

// ─── Types ────────────────────────────────────────────────────────────────────

interface WatchSource {
  id: number
  url: string
  source_status: string
  subscription_service: string | null
}

interface Performance {
  id: number
  artist_name: string
  event_name: string | null
  venue_name: string | null
  performance_date: string | null
  performance_type: string | null
  duration_minutes: number | null
  watch_sources: WatchSource[]
}

// ─── CSS ─────────────────────────────────────────────────────────────────────

const STYLES = `
  body { background: #030014; }
  input::placeholder { color: rgba(255,255,255,0.25); }
  @keyframes spin { to { transform: translateY(-50%) rotate(360deg); } }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .perf-card { animation: fadeUp 0.3s ease both; }
  @media (prefers-reduced-motion: reduce) {
    .perf-card { animation: none; }
  }
`

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(d: string | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
}

// ─── Performance Card ─────────────────────────────────────────────────────────

function PerformanceCard({ p, delay }: { p: Performance; delay: number }) {
  const router = useRouter()
  const [hovered, setHovered] = useState(false)

  const best = getBestSource(p.watch_sources)
  // Scan all sources for a YouTube thumbnail (best source may be Amazon/Peacock)
  const thumbBase = p.watch_sources.map(s => getYouTubeThumbnail(s.url)).find(Boolean) || null
  const [thumbSrc, setThumbSrc] = useState<string | null>(thumbBase)
  const handleThumbErr = () => {
    if (thumbSrc && thumbSrc.includes('maxresdefault')) {
      setThumbSrc(thumbSrc.replace('maxresdefault', 'hqdefault'))
    } else {
      setThumbSrc(null)
    }
  }

  return (
    <div
      className="perf-card"
      style={{ animationDelay: `${delay}ms`, cursor: 'pointer', borderRadius: '14px', overflow: 'hidden', background: 'rgba(255,255,255,0.04)', border: `1px solid ${hovered ? 'rgba(255,0,110,0.3)' : 'rgba(255,255,255,0.07)'}`, transform: hovered ? 'translateY(-4px)' : 'none', boxShadow: hovered ? '0 20px 40px rgba(0,0,0,0.5)' : 'none', transition: 'all 200ms ease' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => best && window.open(best.url, '_blank', 'noopener,noreferrer')}
    >
      {/* Thumbnail */}
      <div style={{ width: '100%', paddingTop: '56.25%', position: 'relative', background: 'linear-gradient(135deg,#1a0030,#0d0015)', overflow: 'hidden' }}>
        {thumbSrc ? (
          <img src={thumbSrc} alt={p.event_name || p.artist_name} onError={handleThumbErr}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: hovered ? 'scale(1.05)' : 'scale(1)', transition: 'transform 300ms ease' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', color: 'rgba(255,255,255,0.08)' }}>♪</div>
        )}
        {/* Play overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg,rgba(0,0,0,0.7) 0%,transparent 50%)', opacity: hovered ? 1 : 0.5, transition: 'opacity 200ms' }} />
        {/* Platform badge */}
        {best && (
          <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
            <PlatformBadge platform={best.platform} isYouTube={best.isYouTube} />
          </div>
        )}
        {/* Play button */}
        {hovered && best && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '44px', height: '44px', background: 'rgba(255,0,110,0.9)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: '#fff' }}>▶</div>
        )}
        {/* Save toggle */}
        <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
          <SaveButton performanceId={p.id} />
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontFamily: 'var(--font-dm-sans, system-ui)', fontWeight: 700, fontSize: '14px', color: '#fff', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {p.event_name || `${p.artist_name} Live`}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <span style={{ fontFamily: 'var(--font-dm-sans, system-ui)', fontSize: '12px', color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}>
            {formatDate(p.performance_date)}
          </span>
          <div
            style={{ fontFamily: 'var(--font-dm-sans, system-ui)', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right', transition: 'color 150ms' }}
            onClick={e => { e.stopPropagation(); router.push(`/artist/${encodeURIComponent(p.artist_name)}`) }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
          >
            {p.artist_name}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type PerfSort = 'newest' | 'oldest' | 'az' | 'sources'

function SearchPageInner() {
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [performances, setPerformances] = useState<Performance[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<PerfSort>('newest')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchPerformances = async (q: string) => {
    setLoading(true)
    let queryBuilder = supabase
      .from('performances')
      .select(`id, artist_name, event_name, venue_name, performance_date, performance_type, duration_minutes, watch_sources(id, url, source_status, subscription_service)`)
      .order('performance_date', { ascending: false })
      .limit(50)

    if (q.trim()) {
      queryBuilder = queryBuilder.or(
        `artist_name.ilike.%${q.trim()}%,event_name.ilike.%${q.trim()}%,venue_name.ilike.%${q.trim()}%`
      )
    }

    const { data } = await queryBuilder
    setPerformances((data as Performance[]) || [])
    setLoading(false)
  }

  // Load on mount (query state is already seeded from the URL param)
  useEffect(() => {
    async function load() {
      await fetchPerformances(searchParams.get('q') || '')
    }
    load()
  }, [])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchPerformances(val), 400)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      fetchPerformances(query)
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div style={{ background: '#030014', color: '#fff', minHeight: '100vh', fontFamily: 'var(--font-dm-sans, system-ui)' }}>
        <PageNav />

        {/* Search hero */}
        <div style={{ background: 'radial-gradient(ellipse at 50% 0%,#1a0030 0%,#030014 70%)', padding: '60px 24px 40px', textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'var(--font-bebas, sans-serif)', fontSize: 'clamp(36px,6vw,64px)', letterSpacing: '0.06em', margin: '0 0 8px', color: '#fff' }}>
            PERFORMANCES
          </h1>

          <div style={{ position: 'relative', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: '20px', pointerEvents: 'none' }}>⌕</div>
            <input
              type="text"
              value={query}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder='Try "Kendrick Lamar", "Glastonbury", "Coachella"...'
              autoFocus
              style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '16px', padding: '18px 52px 18px 52px', color: '#fff', fontSize: '17px', fontFamily: 'var(--font-dm-sans, system-ui)', outline: 'none', boxSizing: 'border-box', transition: 'border-color 150ms, box-shadow 150ms' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(255,0,110,0.6)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,0,110,0.12)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; e.currentTarget.style.boxShadow = 'none' }}
            />
            {loading ? (
              <div style={{ position: 'absolute', right: '18px', top: '50%', width: '20px', height: '20px', border: '2px solid rgba(255,0,110,0.3)', borderTopColor: '#FF006E', borderRadius: '50%', animation: 'spin 0.7s linear infinite', transform: 'translateY(-50%)' }} />
            ) : (
              <div style={{ position: 'absolute', right: '18px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-dm-sans, system-ui)', fontWeight: 500, letterSpacing: '0.05em' }}>↵</div>
            )}
          </div>
        </div>

        {/* Results */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 80px' }}>

          {/* Sort bar */}
          {!loading && performances.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-dm-sans, system-ui)', marginRight: '4px' }}>Sort:</span>
              {([['newest', 'Newest First'], ['oldest', 'Oldest First'], ['az', 'Artist A → Z'], ['sources', 'Most Sources']] as [PerfSort, string][]).map(([val, label]) => (
                <button key={val} onClick={() => setSort(val)}
                  style={{ background: sort === val ? 'rgba(255,0,110,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${sort === val ? 'rgba(255,0,110,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '8px', padding: '5px 12px', color: sort === val ? '#FF006E' : 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: sort === val ? 600 : 400, cursor: 'pointer', fontFamily: 'var(--font-dm-sans, system-ui)', transition: 'all 150ms' }}
                >{label}</button>
              ))}
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-bebas, sans-serif)', fontSize: '22px', color: '#fff', letterSpacing: '0.06em' }}>{performances.length} PERFORMANCES</span>
            </div>
          )}

          {/* Performances grid */}
          {performances.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
              {[...performances].sort((a, b) => {
                if (sort === 'newest') return (b.performance_date || '').localeCompare(a.performance_date || '')
                if (sort === 'oldest') return (a.performance_date || '').localeCompare(b.performance_date || '')
                if (sort === 'az') return a.artist_name.localeCompare(b.artist_name)
                if (sort === 'sources') return b.watch_sources.length - a.watch_sources.length
                return 0
              }).map((p, i) => (
                <PerformanceCard key={p.id} p={p} delay={i * 30} />
              ))}
            </div>
          )}

          {!loading && performances.length === 0 && query.trim() && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px', opacity: 0.3 }}>♪</div>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-dm-sans, system-ui)', fontSize: '16px' }}>
                No performances found for &quot;{query}&quot;
              </p>
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '13px', marginTop: '8px', fontFamily: 'var(--font-dm-sans, system-ui)' }}>
                We might not have it yet — suggest it below!
              </p>
            </div>
          )}
        </div>

        <SuggestFooter />
      </div>
    </>
  )
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageInner />
    </Suspense>
  )
}
