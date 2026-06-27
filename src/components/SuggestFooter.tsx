'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const MAX_ARTIST = 100
const MAX_EVENT = 150
const MAX_LINK = 500

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function SuggestFooter() {
  const [form, setForm] = useState({ artist: '', event: '', link: '' })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    const artistTrimmed = form.artist.trim()
    if (!artistTrimmed) return

    const linkTrimmed = form.link.trim()
    if (linkTrimmed && !isValidHttpUrl(linkTrimmed)) {
      setError('Link must be a valid http:// or https:// URL.')
      return
    }

    setSubmitting(true)
    setError(null)

    const { error: err } = await supabase.from('suggestions').insert({
      artist_name: artistTrimmed,
      event_name: form.event.trim() || null,
      link: linkTrimmed || null,
    })

    setSubmitting(false)
    if (err) {
      setError('Something went wrong. Try again.')
    } else {
      setSubmitted(true)
      setForm({ artist: '', event: '', link: '' })
    }
  }

  return (
    <footer style={{ background: '#020010', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '60px 24px 40px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="footer-grid" style={{ alignItems: 'start' }}>
          {/* Left: branding */}
          <div>
            <div style={{ fontFamily: 'var(--font-bebas, sans-serif)', fontSize: '22px', letterSpacing: '0.12em', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ width: '24px', height: '24px', background: 'linear-gradient(135deg,#FF006E,#FF7A00)', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>▶</span>
              LIVESCORE
            </div>
            <p style={{ fontFamily: 'var(--font-dm-sans, system-ui)', fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, maxWidth: '300px' }}>
              The home for watchable live musical performances. Curated, verified, and community-driven.
            </p>
          </div>

          {/* Right: suggest form */}
          <div>
            <h3 style={{ fontFamily: 'var(--font-bebas, sans-serif)', fontSize: '26px', letterSpacing: '0.06em', color: '#fff', margin: '0 0 6px' }}>
              SUGGEST A PERFORMANCE
            </h3>
            <p style={{ fontFamily: 'var(--font-dm-sans, system-ui)', fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '18px' }}>
              Know a live performance we should add? Tell us the artist, event, or drop a link.
            </p>

            {submitted ? (
              <div style={{ background: 'rgba(0,245,255,0.08)', border: '1px solid rgba(0,245,255,0.2)', borderRadius: '12px', padding: '20px', fontFamily: 'var(--font-dm-sans, system-ui)', color: '#00F5FF', fontSize: '14px', textAlign: 'center' }}>
                ✓ Thanks! We&apos;ll review your suggestion.
                <button onClick={() => setSubmitted(false)} style={{ display: 'block', margin: '10px auto 0', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-dm-sans, system-ui)' }}>
                  Suggest another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Artist name *"
                  aria-label="Artist name"
                  aria-required="true"
                  value={form.artist}
                  maxLength={MAX_ARTIST}
                  onChange={e => setForm(f => ({ ...f, artist: e.target.value }))}
                  required
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '11px 14px', color: '#fff', fontSize: '14px', fontFamily: 'var(--font-dm-sans, system-ui)', outline: 'none', transition: 'border-color 150ms' }}
                  onFocus={e => e.currentTarget.style.borderColor = 'rgba(255,0,110,0.5)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                <input
                  type="text"
                  placeholder="Event or venue (optional)"
                  aria-label="Event or venue"
                  value={form.event}
                  maxLength={MAX_EVENT}
                  onChange={e => setForm(f => ({ ...f, event: e.target.value }))}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '11px 14px', color: '#fff', fontSize: '14px', fontFamily: 'var(--font-dm-sans, system-ui)', outline: 'none', transition: 'border-color 150ms' }}
                  onFocus={e => e.currentTarget.style.borderColor = 'rgba(255,0,110,0.5)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                <input
                  type="text"
                  placeholder="Link to video (optional)"
                  aria-label="Link to video"
                  value={form.link}
                  maxLength={MAX_LINK}
                  onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '11px 14px', color: '#fff', fontSize: '14px', fontFamily: 'var(--font-dm-sans, system-ui)', outline: 'none', transition: 'border-color 150ms' }}
                  onFocus={e => e.currentTarget.style.borderColor = 'rgba(255,0,110,0.5)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                {error && (
                  <div style={{ fontSize: '13px', color: '#ff6b6b', fontFamily: 'var(--font-dm-sans, system-ui)', padding: '2px 4px' }}>
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={submitting || !form.artist.trim()}
                  style={{ background: submitting ? 'rgba(255,0,110,0.3)' : 'linear-gradient(135deg,#FF006E,#FF3366)', border: 'none', borderRadius: '8px', padding: '12px', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-dm-sans, system-ui)', transition: 'all 150ms' }}
                >
                  {submitting ? 'Sending...' : 'Submit Suggestion'}
                </button>
              </form>
            )}
          </div>
        </div>

        <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.04)', fontFamily: 'var(--font-dm-sans, system-ui)', fontSize: '12px', color: 'rgba(255,255,255,0.2)', display: 'flex', justifyContent: 'space-between' }}>
          <span>© 2026 LiveScore</span>
          <span>Only verified watchable performances shown publicly</span>
        </div>
      </div>
    </footer>
  )
}
