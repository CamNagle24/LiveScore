'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { getYouTubeThumbnail, getBestSource } from '@/lib/youtube'
import { computeStats } from '@/lib/computeStats'
import { PlatformBadge } from '@/components/PlatformBadge'
import { PageNav } from '@/components/PageNav'
import { SuggestFooter } from '@/components/SuggestFooter'
import { useUser } from '@/lib/useUser'
import { ensureSavedLoaded, toggleSaved } from '@/lib/savedStore'

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

// ─── CSS ─────────────────────────────────────────────────────────────────────

const STYLES = `
  body { background: #030014; }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .card-in { animation: fadeUp 0.35s ease both; }
  @media (prefers-reduced-motion: reduce) { .card-in { animation: none; } }
`

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: string | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ─── Saved Performance Card ───────────────────────────────────────────────────

function SavedCard({ p, delay, onRemove, reminderOptIn, onToggleReminder }: { p: Performance; delay: number; onRemove: (id: string) => void; reminderOptIn: boolean; onToggleReminder: () => void }) {
  const router = useRouter()
  const [hovered, setHovered] = useState(false)
  const best = getBestSource(p.watch_sources)
  // Try all sources for a YouTube thumbnail, not just the best watch link
  const thumbBase = p.watch_sources.map(s => getYouTubeThumbnail(s.url)).find(Boolean) || null
  const [thumbSrc, setThumbSrc] = useState<string | null>(thumbBase)
  const handleThumbErr = () => {
    // maxresdefault may 404 — fall back to hqdefault, then give up
    if (thumbSrc && thumbSrc.includes('maxresdefault')) {
      setThumbSrc(thumbSrc.replace('maxresdefault', 'hqdefault'))
    } else {
      setThumbSrc(null)
    }
  }

  return (
    <div
      className="card-in"
      style={{ animationDelay: `${delay}ms`, borderRadius: '14px', overflow: 'hidden', background: 'rgba(255,255,255,0.04)', border: `1px solid ${hovered ? 'rgba(255,0,110,0.3)' : 'rgba(255,255,255,0.07)'}`, transform: hovered ? 'translateY(-4px)' : 'none', boxShadow: hovered ? '0 20px 40px rgba(0,0,0,0.5)' : 'none', transition: 'all 200ms ease', cursor: best ? 'pointer' : 'default' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => best && window.open(best.url, '_blank', 'noopener,noreferrer')}
    >
      {/* Thumbnail */}
      <div style={{ width: '100%', paddingTop: '56.25%', position: 'relative', background: 'linear-gradient(135deg,#1a0030,#0d0015)', overflow: 'hidden' }}>
        {thumbSrc ? (
          <Image src={thumbSrc} alt={p.event_name || 'Performance'} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" onError={handleThumbErr}
            style={{ objectFit: 'cover', transform: hovered ? 'scale(1.06)' : 'scale(1)', transition: 'transform 350ms ease' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.07)', fontSize: '36px' }}>♪</div>
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg,rgba(0,0,0,0.75) 0%,transparent 55%)', opacity: hovered ? 1 : 0.5, transition: 'opacity 200ms' }} />
        {best && (
          <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
            <PlatformBadge platform={best.platform} isYouTube={best.isYouTube} />
          </div>
        )}
        {hovered && best && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '46px', height: '46px', background: 'rgba(255,0,110,0.9)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#fff' }}>▶</div>
        )}
        {/* Remove button */}
        <button
          onClick={e => { e.stopPropagation(); onRemove(p.id) }}
          style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: 'rgba(255,255,255,0.5)', fontSize: '11px', padding: '3px 8px', cursor: 'pointer', fontFamily: 'var(--font-dm-sans, system-ui)', transition: 'all 150ms' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,0,0,0.5)'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.7)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
        >
          ✕ Remove
        </button>
      </div>

      {/* Meta */}
      <div style={{ padding: '14px' }}>
        <div style={{ fontFamily: 'var(--font-dm-sans, system-ui)', fontWeight: 700, fontSize: '14px', color: '#fff', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {p.event_name || 'Live Performance'}
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
        {/* Reminder toggle */}
        <div style={{ marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
          <button
            onClick={e => { e.stopPropagation(); onToggleReminder() }}
            aria-label={reminderOptIn ? 'Disable reminder' : 'Enable reminder'}
            style={{ background: reminderOptIn ? 'rgba(255,0,110,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${reminderOptIn ? 'rgba(255,0,110,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontFamily: 'var(--font-dm-sans, system-ui)', fontSize: '11px', color: reminderOptIn ? '#FF006E' : 'rgba(255,255,255,0.4)', fontWeight: 500, transition: 'all 150ms', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <span aria-hidden="true">{reminderOptIn ? '🔔' : '🔕'}</span>
            {reminderOptIn ? 'Reminder on' : 'Remind me'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function TopPerfCard({ p, thumb: thumbInit, onWatch }: { p: Performance; thumb: string | null; onWatch: () => void }) {
  const [hovered, setHovered] = useState(false)
  const [thumbSrc, setThumbSrc] = useState<string | null>(thumbInit)
  const handleImgErr = () => {
    if (thumbSrc && thumbSrc.includes('maxresdefault')) {
      setThumbSrc(thumbSrc.replace('maxresdefault', 'hqdefault'))
    } else {
      setThumbSrc(null)
    }
  }
  return (
    <div
      onClick={onWatch}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', border: `1px solid ${hovered ? 'rgba(255,0,110,0.35)' : 'rgba(255,255,255,0.08)'}`, transform: hovered ? 'translateY(-3px)' : 'none', boxShadow: hovered ? '0 16px 32px rgba(0,0,0,0.5)' : 'none', transition: 'all 200ms ease' }}
    >
      {/* Thumbnail */}
      <div style={{ width: '100%', paddingTop: '62%', position: 'relative', background: 'linear-gradient(135deg,#1a0030,#0d0015)', overflow: 'hidden' }}>
        {thumbSrc ? (
          <Image src={thumbSrc} alt={p.event_name || ''} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" onError={handleImgErr}
            style={{ objectFit: 'cover', transform: hovered ? 'scale(1.06)' : 'scale(1)', transition: 'transform 350ms ease' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', color: 'rgba(255,255,255,0.06)' }}>♪</div>
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg,rgba(0,0,0,0.75) 0%,transparent 50%)', opacity: hovered ? 1 : 0.5, transition: 'opacity 200ms' }} />
        {hovered && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '36px', height: '36px', background: 'rgba(255,0,110,0.9)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: '#fff' }}>▶</div>
        )}
      </div>
      {/* Info */}
      <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)' }}>
        <div style={{ fontFamily: 'var(--font-dm-sans, system-ui)', fontWeight: 700, fontSize: '12px', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '3px' }}>
          {p.event_name || `${p.artist_name} Live`}
        </div>
        <div style={{ fontFamily: 'var(--font-dm-sans, system-ui)', fontSize: '11px', color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {p.artist_name}
        </div>
      </div>
    </div>
  )
}


export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const [saved, setSaved] = useState<Performance[]>([])
  const [reminderOptIns, setReminderOptIns] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)
  const [removeError, setRemoveError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'saved' | 'stats'>('saved')

  useEffect(() => {
    if (userLoading) return
    let active = true

    const load = async () => {
      setLoadError(false)
      setLoading(true)
      if (!user) {
        if (active) { setSaved([]); setLoading(false) }
        return
      }
      ensureSavedLoaded(user.id)
      const { data, error } = await supabase
        .from('saved_performances')
        .select(`performance_id, reminder_opt_in, performance:performances(id, artist_name, event_name, venue_name, performance_date, performance_type, duration_minutes, watch_sources(id, url, source_status, subscription_service))`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!active) return
      if (error) { setLoadError(true); setLoading(false); return }
      const rows = (data as unknown as { performance_id: string; reminder_opt_in: boolean; performance: Performance | null }[] | null) || []
      const perfs = rows.map(r => r.performance).filter((p): p is Performance => !!p)
      const opts: Record<string, boolean> = {}
      rows.forEach(r => { if (r.performance) opts[r.performance.id] = !!r.reminder_opt_in })
      setSaved(perfs)
      setReminderOptIns(opts)
      setLoading(false)
    }
    load()
    return () => { active = false }
  }, [user, userLoading, retryKey])

  useEffect(() => {
    if (!removeError) return
    const t = setTimeout(() => setRemoveError(null), 3000)
    return () => clearTimeout(t)
  }, [removeError])

  const handleRemove = async (id: string) => {
    const prev = saved
    setSaved(s => s.filter(p => p.id !== id))
    if (user) {
      try {
        await toggleSaved(id, user.id)
      } catch {
        setSaved(prev)
        setRemoveError("Couldn't remove. Try again.")
      }
    }
  }

  const handleToggleReminder = async (performanceId: string) => {
    if (!user) return
    const current = reminderOptIns[performanceId] ?? false
    setReminderOptIns(prev => ({ ...prev, [performanceId]: !current }))
    const { error } = await supabase
      .from('saved_performances')
      .update({ reminder_opt_in: !current })
      .eq('user_id', user.id)
      .eq('performance_id', performanceId)
    if (error) {
      setReminderOptIns(prev => ({ ...prev, [performanceId]: current }))
    }
  }

  const stats = computeStats(saved)
  const memberSince = user?.created_at ? new Date(user.created_at).getFullYear() : null
  const avatarUrl = (user?.user_metadata?.avatar_url as string | undefined) || null
  const initial = (user?.email?.[0] || '?').toUpperCase()

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div style={{ background: '#030014', color: '#fff', minHeight: '100vh', fontFamily: 'var(--font-dm-sans, system-ui)' }}>
        <PageNav />

        {/* Profile Hero */}
        <div style={{ background: 'radial-gradient(ellipse at 30% 0%,#1a0030 0%,#030014 70%)', padding: '48px 24px 40px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{ width: '96px', height: '96px', borderRadius: '50%', flexShrink: 0, boxShadow: '0 0 30px rgba(255,0,110,0.3)', border: '3px solid rgba(255,0,110,0.3)', overflow: 'hidden', background: 'linear-gradient(135deg,#FF006E,#FF7A00)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-bebas, sans-serif)', fontSize: '44px', color: '#fff' }}>
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Profile"
                  width={96}
                  height={96}
                  style={{ objectFit: 'cover', objectPosition: 'center top' }}
                />
              ) : initial}
            </div>

            <div style={{ flex: 1 }}>
              <h1 style={{ fontFamily: 'var(--font-bebas, sans-serif)', fontSize: 'clamp(32px,5vw,56px)', letterSpacing: '0.04em', margin: '0 0 6px', lineHeight: 1 }}>
                YOUR PROFILE
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: '0 0 16px' }}>
                {user?.email}{memberSince ? ` · Member since ${memberSince}` : ''}
              </p>
              {/* Stat pills */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {stats.badges.map(s => (
                  <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '8px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                    <span style={{ fontFamily: 'var(--font-bebas, sans-serif)', fontSize: '24px', color: s.color, letterSpacing: '0.04em', lineHeight: 1 }}>{s.value}</span>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => router.push('/search')}
              style={{ background: 'linear-gradient(135deg,#FF006E,#FF3366)', border: 'none', borderRadius: '10px', padding: '12px 24px', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-dm-sans, system-ui)', boxShadow: '0 0 20px rgba(255,0,110,0.4)', transition: 'all 150ms', whiteSpace: 'nowrap' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(255,0,110,0.6)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 0 20px rgba(255,0,110,0.4)' }}
            >
              + Find More
            </button>
          </div>
        </div>

        {/* Top 4 Performances */}
        {!loading && saved.length > 0 && (
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px 0' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', fontFamily: 'var(--font-dm-sans, system-ui)', marginBottom: '14px' }}>
              Top Performances
            </div>
            <div className="grid-top4">
              {saved.slice(0, 4).map((p) => {
                const best = getBestSource(p.watch_sources)
                // Try all sources for a YouTube thumbnail, not just the best watch link
                const thumb = p.watch_sources.map(s => getYouTubeThumbnail(s.url)).find(Boolean) || null
                return (
                  <TopPerfCard key={p.id} p={p} thumb={thumb} onWatch={() => best && window.open(best.url, '_blank', 'noopener,noreferrer')} />
                )
              })}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 24px', marginTop: '32px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '2px' }}>
            {(['saved', 'stats'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{ background: 'none', border: 'none', padding: '14px 20px', cursor: 'pointer', fontFamily: 'var(--font-dm-sans, system-ui)', fontSize: '14px', fontWeight: activeTab === tab ? 600 : 400, color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.4)', borderBottom: activeTab === tab ? '2px solid #FF006E' : '2px solid transparent', transition: 'all 150ms', textTransform: 'capitalize' }}
              >
                {tab === 'saved' ? `Saved (${saved.length})` : 'Stats'}
              </button>
            ))}
          </div>
        </div>

        {/* Remove-error toast */}
        {removeError && (
          <div role="alert" style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(20,0,10,0.95)', border: '1px solid rgba(255,0,110,0.4)', borderRadius: '10px', padding: '12px 20px', color: '#fff', fontSize: '13px', fontFamily: 'var(--font-dm-sans, system-ui)', zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.6)', whiteSpace: 'nowrap' }}>
            {removeError}
          </div>
        )}

        {/* Content */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px 80px' }}>
          {activeTab === 'saved' ? (
            <>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '22px', height: '22px', border: '2px solid rgba(255,0,110,0.3)', borderTopColor: '#FF006E', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  <span style={{ color: 'rgba(255,255,255,0.3)' }}>Loading saved performances...</span>
                </div>
              ) : loadError ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <div style={{ fontSize: '40px', opacity: 0.2, marginBottom: '16px' }}>!</div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '16px', marginBottom: '8px' }}>Couldn&apos;t load saved performances</p>
                  <button
                    onClick={() => setRetryKey(k => k + 1)}
                    style={{ marginTop: '8px', background: 'linear-gradient(135deg,#FF006E,#FF3366)', border: 'none', borderRadius: '10px', padding: '10px 24px', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-dm-sans, system-ui)' }}
                  >
                    Try again
                  </button>
                </div>
              ) : saved.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <div style={{ fontSize: '40px', opacity: 0.2, marginBottom: '16px' }}>♪</div>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '16px', marginBottom: '8px' }}>No saved performances yet</p>
                  <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '13px' }}>Browse the search page and save your favorites</p>
                  <button
                    onClick={() => router.push('/search')}
                    style={{ marginTop: '20px', background: 'linear-gradient(135deg,#FF006E,#FF3366)', border: 'none', borderRadius: '10px', padding: '12px 28px', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-dm-sans, system-ui)' }}
                  >
                    Browse Performances
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '18px' }}>
                  {saved.map((p, i) => (
                    <SavedCard key={p.id} p={p} delay={i * 40} onRemove={handleRemove} reminderOptIn={reminderOptIns[p.id] ?? false} onToggleReminder={() => handleToggleReminder(p.id)} />
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Stats tab */
            saved.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>
                <div style={{ fontSize: '40px', opacity: 0.2, marginBottom: '16px' }}>📊</div>
                <p style={{ fontSize: '16px' }}>Save some performances to see your stats</p>
              </div>
            ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {[
                { title: 'Most Watched Artist', value: stats.mostWatchedArtist || '—', icon: '⭐', color: '#BCFF00' },
                { title: 'Favorite Venue', value: stats.favoriteVenue || '—', icon: '📍', color: '#00F5FF' },
                { title: 'Top Performance Type', value: stats.topPerformanceType || '—', icon: '🎤', color: '#FF006E' },
                { title: 'Hours of Live Music', value: `${stats.badges[3].value}h`, icon: '🔥', color: '#FF7A00' },
              ].map(s => (
                <div key={s.title} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ fontSize: '32px', flexShrink: 0 }}>{s.icon}</div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-dm-sans, system-ui)', fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{s.title}</div>
                    <div style={{ fontFamily: 'var(--font-bebas, sans-serif)', fontSize: '24px', color: s.color, letterSpacing: '0.04em' }}>{s.value}</div>
                  </div>
                </div>
              ))}

              {stats.platformBreakdown.length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '24px', gridColumn: '1 / -1' }}>
                <div style={{ fontFamily: 'var(--font-bebas, sans-serif)', fontSize: '22px', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>PLATFORM BREAKDOWN</div>
                {stats.platformBreakdown.map(bar => (
                  <div key={bar.platform} style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-dm-sans, system-ui)' }}>{bar.platform}</span>
                      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-dm-sans, system-ui)' }}>{bar.pct}%</span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${bar.pct}%`, background: bar.color, borderRadius: '2px', transition: 'width 600ms ease' }} />
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>
            )
          )}
        </div>

        <SuggestFooter />
      </div>
    </>
  )
}
