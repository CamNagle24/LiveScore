'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { PageNav } from '@/components/PageNav'
import { SuggestFooter } from '@/components/SuggestFooter'

// ─── Types ────────────────────────────────────────────────────────────────────

interface EventDrop {
  id: string
  title: string
  tag: string
  tagColor: string
  image: string
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const EVENT_DROPS: EventDrop[] = [
  {
    id: '1',
    title: 'Oscars 2026',
    tag: 'JUST DROPPED',
    tagColor: '#FF006E',
    image: 'https://github.com/CamNagle24/LiveListenPhotos/blob/main/Sinners_Best-Oscars-2026.webp?raw=true',
  },
  {
    id: '2',
    title: 'Coachella 2026',
    tag: 'NEW',
    tagColor: '#BCFF00',
    image: 'https://github.com/CamNagle24/LiveListenPhotos/blob/main/coachella-2025-weekend1-93.jpg.webp?raw=true',
  },
  {
    id: '3',
    title: 'Lollapalooza 2026',
    tag: 'WATCH NOW',
    tagColor: '#00F5FF',
    image: 'https://github.com/CamNagle24/LiveListenPhotos/blob/main/lolla.png?raw=true',
  },
  {
    id: '4',
    title: 'Super Bowl LX',
    tag: 'FEATURED',
    tagColor: '#FF7A00',
    image: 'https://github.com/CamNagle24/LiveListenPhotos/blob/main/Super_Bowl_LX_halftime_show_poster.png?raw=true',
  },
]

const TICKER_ITEMS = [
  '🎤 Oscars 2026 performances just dropped',
  '🎸 Coachella 2026 headliner sets now streaming',
  '🔥 Lollapalooza 2026 — 48 new performances added',
  '⚡ Super Bowl LX halftime show now available',
  '🎵 Glastonbury 2025 full archive unlocked',
  '🌟 New: filter by streaming platform availability',
]

// ─── Light Beams ──────────────────────────────────────────────────────────────

function LightBeams() {
  const beams = [
    { color: '#FF006E', x: '12%', delay: '0s',   dur: '4s'   },
    { color: '#00F5FF', x: '28%', delay: '0.8s',  dur: '5s'   },
    { color: '#BCFF00', x: '50%', delay: '1.6s',  dur: '3.5s' },
    { color: '#00F5FF', x: '68%', delay: '0.4s',  dur: '4.5s' },
    { color: '#FF006E', x: '84%', delay: '2s',    dur: '4s'   },
    { color: '#FF7A00', x: '41%', delay: '1.2s',  dur: '5.5s' },
  ]
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
      {beams.map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: 0,
            left: b.x,
            width: '3px',
            height: '65%',
            background: `linear-gradient(180deg, ${b.color}dd 0%, ${b.color}55 55%, transparent 100%)`,
            transformOrigin: 'top center',
            animation: `beamSweep${(i % 3) + 1} ${b.dur} ease-in-out ${b.delay} infinite`,
            filter: `blur(2px) drop-shadow(0 0 14px ${b.color})`,
          }}
        />
      ))}
    </div>
  )
}

// ─── Event Ticker ─────────────────────────────────────────────────────────────

function EventTicker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS]
  return (
    <div style={{ background: '#FF006E', overflow: 'hidden', height: '36px', display: 'flex', alignItems: 'center', position: 'relative', zIndex: 50 }}>
      <div
        style={{
          display: 'flex',
          gap: '60px',
          whiteSpace: 'nowrap',
          animation: 'tickerScroll 30s linear infinite',
          fontFamily: 'var(--font-dm-sans, system-ui)',
          fontSize: '13px',
          fontWeight: 600,
          letterSpacing: '0.03em',
          color: '#fff',
        }}
      >
        {items.map((item, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '24px' }}>
            {item}
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>◆</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// Nav handled by shared PageNav component

// ─── Hero Section ─────────────────────────────────────────────────────────────

function HeroSection() {
  const router = useRouter()
  return (
    <section
      style={{
        position: 'relative',
        height: '100vh',
        minHeight: '640px',
        background: 'radial-gradient(ellipse at 50% 0%, #1a0030 0%, #0d0015 40%, #020005 100%)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <LightBeams />

      {/* Starfield */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(1px 1px at 8% 12%,rgba(255,255,255,0.55) 0%,transparent 0%),radial-gradient(1px 1px at 22% 7%,rgba(255,255,255,0.4) 0%,transparent 0%),radial-gradient(1px 1px at 37% 19%,rgba(255,255,255,0.5) 0%,transparent 0%),radial-gradient(1px 1px at 58% 4%,rgba(255,255,255,0.3) 0%,transparent 0%),radial-gradient(1px 1px at 73% 16%,rgba(255,255,255,0.6) 0%,transparent 0%),radial-gradient(1px 1px at 88% 9%,rgba(255,255,255,0.4) 0%,transparent 0%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Hero text */}
      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '0 24px', maxWidth: '900px' }}>
        <h1 style={{ fontFamily: 'var(--font-bebas, sans-serif)', fontSize: 'clamp(72px,12vw,140px)', lineHeight: 0.9, letterSpacing: '0.04em', color: '#fff', margin: '0 0 20px', textShadow: '0 0 80px rgba(255,0,110,0.3)' }}>
          EVERY LIVE
          <br />
          <span style={{ background: 'linear-gradient(90deg,#FF006E,#FF7A00,#BCFF00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            PERFORMANCE.
          </span>
          <br />
          ALL IN ONE PLACE.
        </h1>

        <p style={{ fontFamily: 'var(--font-dm-sans, system-ui)', fontSize: '18px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, margin: '0 auto 36px', maxWidth: '520px' }}>
          Discover, track, and review legendary live performances. From Coachella headliners to Grammy showstoppers.
        </p>

        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            style={{ background: 'linear-gradient(135deg,#FF006E,#FF3366)', border: 'none', borderRadius: '12px', padding: '16px 36px', color: '#fff', fontSize: '16px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-dm-sans, system-ui)', letterSpacing: '0.04em', boxShadow: '0 0 40px rgba(255,0,110,0.5)', transition: 'all 200ms ease' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 0 60px rgba(255,0,110,0.7)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 0 40px rgba(255,0,110,0.5)' }}
            onClick={() => router.push('/search')}
          >
            EXPLORE NOW
          </button>
          <button
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', padding: '16px 36px', color: '#fff', fontSize: '16px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-dm-sans, system-ui)', backdropFilter: 'blur(10px)', transition: 'all 200ms ease' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'none' }}
            onClick={() => router.push('/login')}
          >
            SIGN UP FREE
          </button>
        </div>
      </div>

      {/* Stage floor glow */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '200px', background: 'linear-gradient(0deg, rgba(255,0,110,0.12) 0%, rgba(200,60,0,0.08) 40%, transparent 100%)', pointerEvents: 'none', zIndex: 4 }} />
    </section>
  )
}

// ─── Featured Event Drops — image-dominant cards ───────────────────────────────

function FeaturedDrops() {
  return (
    <section style={{ background: '#030014', padding: '80px 24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginBottom: '40px' }}>
          <h2 style={{ fontFamily: 'var(--font-bebas, sans-serif)', fontSize: '42px', color: '#fff', letterSpacing: '0.06em', margin: 0 }}>
            RECENT DROPS
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '16px' }}>
          {EVENT_DROPS.map((drop) => (
            <EventCard key={drop.id} drop={drop} />
          ))}
        </div>
      </div>
    </section>
  )
}

function EventCard({ drop }: { drop: EventDrop }) {
  const router = useRouter()
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={() => router.push(`/search?q=${encodeURIComponent(drop.title)}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        borderRadius: '16px',
        overflow: 'hidden',
        cursor: 'pointer',
        height: '300px',
        transform: hovered ? 'translateY(-5px)' : 'none',
        boxShadow: hovered ? '0 24px 48px rgba(0,0,0,0.6)' : '0 4px 16px rgba(0,0,0,0.3)',
        transition: 'transform 200ms ease, box-shadow 200ms ease',
      }}
    >
      {/* Background image — optimized (resized + webp) via next/image. fill
          positions it absolutely within the relative card; the GitHub ?raw=true
          host is allow-listed in next.config remotePatterns. Below the hero, so
          default lazy loading is intentional. */}
      <Image
        src={drop.image}
        alt={drop.title}
        fill
        sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 300px"
        style={{
          objectFit: 'cover',
          transform: hovered ? 'scale(1.06)' : 'scale(1)',
          transition: 'transform 400ms ease',
        }}
      />
      {/* Gradient scrim */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.05) 100%)' }} />
      {/* Tag — top left */}
      <div style={{ position: 'absolute', top: '16px', left: '16px' }}>
        <span style={{ display: 'inline-block', background: drop.tagColor, color: drop.tagColor === '#BCFF00' ? '#000' : '#fff', fontSize: '10px', fontWeight: 800, letterSpacing: '0.12em', padding: '4px 10px', borderRadius: '4px', fontFamily: 'var(--font-dm-sans, system-ui)' }}>
          {drop.tag}
        </span>
      </div>
      {/* Title + CTA — bottom */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px' }}>
        <h3 style={{ fontFamily: 'var(--font-bebas, sans-serif)', fontSize: '36px', color: '#fff', margin: '0 0 10px', letterSpacing: '0.05em', lineHeight: 1, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
          {drop.title}
        </h3>
        <div style={{ fontFamily: 'var(--font-dm-sans, system-ui)', fontSize: '13px', color: drop.tagColor, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
          Watch now
          <span style={{ transform: hovered ? 'translateX(4px)' : 'none', transition: 'transform 150ms ease', display: 'inline-block' }}>→</span>
        </div>
      </div>
    </div>
  )
}

// ─── Final CTA ────────────────────────────────────────────────────────────────

function FinalCTA() {
  const router = useRouter()
  return (
    <section style={{ background: 'radial-gradient(ellipse at 50% 0%,#2a0040 0%,#030014 60%)', padding: '100px 24px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
      <h2 style={{ fontFamily: 'var(--font-bebas, sans-serif)', fontSize: 'clamp(48px,7vw,80px)', color: '#fff', letterSpacing: '0.05em', margin: '0 0 16px' }}>
        YOUR FRONT ROW SEAT
        <br />
        <span style={{ background: 'linear-gradient(90deg,#FF006E,#FF7A00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          TO EVERY LEGEND
        </span>
      </h2>
      <button
        style={{ background: 'linear-gradient(135deg,#FF006E,#FF3366)', border: 'none', borderRadius: '14px', padding: '18px 44px', color: '#fff', fontSize: '17px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-dm-sans, system-ui)', letterSpacing: '0.05em', boxShadow: '0 0 60px rgba(255,0,110,0.5)', transition: 'all 200ms ease' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 0 80px rgba(255,0,110,0.7)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 0 60px rgba(255,0,110,0.5)' }}
        onClick={() => router.push('/login')}
      >
        CREATE FREE ACCOUNT
      </button>
    </section>
  )
}

// ─── Global CSS animations ────────────────────────────────────────────────────

const GLOBAL_STYLES = `
  @keyframes tickerScroll {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  @keyframes beamSweep1 {
    0%,100% { transform: rotate(-14deg); opacity: 0.7; }
    50%     { transform: rotate(14deg);  opacity: 1;   }
  }
  @keyframes beamSweep2 {
    0%,100% { transform: rotate(20deg);  opacity: 0.5; }
    50%     { transform: rotate(-20deg); opacity: 0.9; }
  }
  @keyframes beamSweep3 {
    0%,100% { transform: rotate(-8deg); opacity: 0.6; }
    50%     { transform: rotate(8deg);  opacity: 1;   }
  }
  @keyframes glowPulse {
    0%,100% { opacity: 0.5; }
    50%     { opacity: 1;   }
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.01ms !important; }
  }
`

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />
      <div style={{ background: '#030014', color: '#fff', minHeight: '100vh', fontFamily: 'var(--font-dm-sans, system-ui)' }}>
        <EventTicker />
        <PageNav />
        <HeroSection />
        <FeaturedDrops />
        <FinalCTA />
        <SuggestFooter />
      </div>
    </>
  )
}
