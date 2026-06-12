'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
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
  id: string
  artist_name: string
  event_name: string | null
  venue_name: string | null
  performance_date: string | null
  performance_type: string | null
  duration_minutes: number | null
  watch_sources: WatchSource[]
}

interface ArtistInfo {
  name: string
  genre: string
  country: string
  thumb: string | null
  fanart: string | null
  biography: string
}

// ─── CSS ─────────────────────────────────────────────────────────────────────

const STYLES = `
  body { background: #030014; }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .card-in { animation: fadeUp 0.35s ease both; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) { .card-in { animation: none; } }
`

function formatDate(d: string | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ─── Performance Card ─────────────────────────────────────────────────────────

function PerfCard({ p, delay }: { p: Performance; delay: number }) {
  const [hovered, setHovered] = useState(false)
  const [thumbErr, setThumbErr] = useState(false)
  const best = getBestSource(p.watch_sources)
  const thumb = best ? getYouTubeThumbnail(best.url) : null

  return (
    <div
      className="card-in"
      style={{ animationDelay: `${delay}ms`, borderRadius: '14px', overflow: 'hidden', background: 'rgba(255,255,255,0.04)', border: `1px solid ${hovered ? 'rgba(255,0,110,0.35)' : 'rgba(255,255,255,0.07)'}`, transform: hovered ? 'translateY(-4px)' : 'none', boxShadow: hovered ? '0 20px 40px rgba(0,0,0,0.5)' : 'none', transition: 'all 200ms ease', cursor: best ? 'pointer' : 'default' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => best && window.open(best.url, '_blank', 'noopener,noreferrer')}
    >
      {/* Thumbnail */}
      <div style={{ width: '100%', paddingTop: '56.25%', position: 'relative', background: 'linear-gradient(135deg,#1a0030,#0a000f)', overflow: 'hidden' }}>
        {thumb && !thumbErr ? (
          <img src={thumb} alt={p.event_name || 'Performance'} onError={() => setThumbErr(true)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: hovered ? 'scale(1.06)' : 'scale(1)', transition: 'transform 350ms ease' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.07)', fontSize: '36px' }}>♪</div>
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg,rgba(0,0,0,0.75) 0%,transparent 55%)', opacity: hovered ? 1 : 0.5, transition: 'opacity 200ms' }} />

        {/* Platform badge */}
        {best && (
          <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
            <PlatformBadge platform={best.platform} isYouTube={best.isYouTube} />
          </div>
        )}

        {/* Source count badge */}
        {p.watch_sources.length > 1 && (
          <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.7)', borderRadius: '4px', padding: '3px 8px', fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-dm-sans, system-ui)' }}>
            {p.watch_sources.length} sources
          </div>
        )}

        {/* Play button on hover */}
        {hovered && best && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '46px', height: '46px', background: 'rgba(255,0,110,0.9)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#fff' }}>▶</div>
        )}

        {/* Save toggle */}
        <div style={{ position: 'absolute', bottom: '10px', right: '10px' }}>
          <SaveButton performanceId={p.id} />
        </div>
      </div>

      {/* Meta */}
      <div style={{ padding: '14px' }}>
        <div style={{ fontFamily: 'var(--font-dm-sans, system-ui)', fontWeight: 700, fontSize: '15px', color: '#fff', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {p.event_name || 'Live Performance'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <span style={{ fontFamily: 'var(--font-dm-sans, system-ui)', fontSize: '12px', color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}>
            {formatDate(p.performance_date)}
          </span>
          {p.venue_name && (
            <span style={{ fontFamily: 'var(--font-dm-sans, system-ui)', fontSize: '12px', color: 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>
              {p.venue_name}
            </span>
          )}
        </div>
        {!best && (
          <div style={{ marginTop: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-dm-sans, system-ui)' }}>No watch link yet</div>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ArtistPage() {
  const params = useParams()
  const rawName = params.name as string
  const artistName = decodeURIComponent(rawName)

  const [performances, setPerformances] = useState<Performance[]>([])
  const [artistInfo, setArtistInfo] = useState<ArtistInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [fanartErr, setFanartErr] = useState(false)
  const [thumbErr, setThumbErr] = useState(false)

  useEffect(() => {
    const load = async () => {
      // Fetch performances from Supabase
      const { data: perfs } = await supabase
        .from('performances')
        .select(`id, artist_name, event_name, venue_name, performance_date, performance_type, duration_minutes, watch_sources(id, url, source_status, subscription_service)`)
        .ilike('artist_name', artistName)
        .order('performance_date', { ascending: false })
      setPerformances((perfs as Performance[]) || [])
      setLoading(false)

      // Fetch artist info from TheAudioDB (free tier)
      try {
        const res = await fetch(`/api/artists/search?q=${encodeURIComponent(artistName)}`)
        const data = await res.json()
        if (data.artists?.length) setArtistInfo(data.artists[0])
      } catch {}
    }
    load()
  }, [artistName])

  const totalSources = performances.reduce((acc, p) => acc + p.watch_sources.length, 0)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div style={{ background: '#030014', color: '#fff', minHeight: '100vh', fontFamily: 'var(--font-dm-sans, system-ui)' }}>
        <PageNav />

        {/* Artist Hero */}
        <div style={{
          position: 'relative',
          minHeight: '320px',
          overflow: 'hidden',
          ...(artistInfo?.fanart && !fanartErr ? {
            backgroundImage: `url(${artistInfo.fanart})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
          } : {}),
        }}>
          {/* Trigger onError for bg image detection */}
          {artistInfo?.fanart && !fanartErr && (
            <img src={artistInfo.fanart} alt="" onError={() => setFanartErr(true)} style={{ display: 'none' }} />
          )}
          {/* Overlay */}
          {artistInfo?.fanart && !fanartErr ? (
            <>
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(3,0,20,0.6)' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg,#030014 0%,rgba(3,0,20,0.4) 50%,transparent 100%)' }} />
            </>
          ) : (
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%,#1a0030 0%,#030014 70%)' }} />
          )}

          {/* Hero content */}
          <div style={{ position: 'relative', zIndex: 2, padding: '48px 24px 40px', maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'flex-end', gap: '28px' }}>
            {/* Artist thumbnail */}
            <div style={{ width: '110px', height: '110px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'linear-gradient(135deg,#FF006E30,#0d0015)', border: '3px solid rgba(255,0,110,0.3)', boxShadow: '0 0 30px rgba(255,0,110,0.2)' }}>
              {artistInfo?.thumb && !thumbErr ? (
                <img src={artistInfo.thumb} alt={artistName} onError={() => setThumbErr(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', fontFamily: 'var(--font-bebas, sans-serif)', color: 'rgba(255,255,255,0.15)' }}>
                  {artistName[0]}
                </div>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <h1 style={{ fontFamily: 'var(--font-bebas, sans-serif)', fontSize: 'clamp(40px,6vw,72px)', letterSpacing: '0.04em', margin: '0 0 6px', lineHeight: 1, color: '#fff', textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
                {artistName.toUpperCase()}
              </h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                {artistInfo?.genre && <span style={{ background: 'rgba(255,0,110,0.15)', border: '1px solid rgba(255,0,110,0.25)', borderRadius: '4px', padding: '3px 10px', fontSize: '12px', fontWeight: 600, color: '#FF006E', letterSpacing: '0.04em' }}>{artistInfo.genre}</span>}
                {artistInfo?.country && <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{artistInfo.country}</span>}
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>
                  {loading ? '...' : `${performances.length} performance${performances.length !== 1 ? 's' : ''} · ${totalSources} watch link${totalSources !== 1 ? 's' : ''}`}
                </span>
              </div>
              {artistInfo?.biography && (
                <p style={{ marginTop: '12px', fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: '600px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {artistInfo.biography}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Performances */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px 80px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: '22px', height: '22px', border: '2px solid rgba(255,0,110,0.3)', borderTopColor: '#FF006E', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              <span style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-dm-sans, system-ui)' }}>Loading performances...</span>
            </div>
          ) : performances.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: '40px', opacity: 0.2, marginBottom: '16px' }}>♪</div>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-dm-sans, system-ui)', fontSize: '16px' }}>
                No performances in the database yet for {artistName}.
              </p>
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '13px', marginTop: '6px', fontFamily: 'var(--font-dm-sans, system-ui)' }}>
                Use the suggest form below to request one!
              </p>
            </div>
          ) : (
            <>
              <h2 style={{ fontFamily: 'var(--font-bebas, sans-serif)', fontSize: '24px', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.5)', margin: '0 0 20px' }}>
                WATCHABLE PERFORMANCES
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '18px' }}>
                {performances.map((p, i) => (
                  <PerfCard key={p.id} p={p} delay={i * 50} />
                ))}
              </div>
            </>
          )}
        </div>

        <SuggestFooter />
      </div>
    </>
  )
}
