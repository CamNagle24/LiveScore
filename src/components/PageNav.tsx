'use client'

import { useRouter, usePathname } from 'next/navigation'

export function PageNav() {
  const router = useRouter()
  const pathname = usePathname()

  const activeTab =
    pathname === '/artists' ? 'Artists'
    : pathname === '/venues' ? 'Venues'
    : pathname.startsWith('/artist') ? 'Artists'
    : pathname.startsWith('/search') ? 'Performances'
    : pathname === '/profile' ? 'Profile'
    : pathname === '/landing' || pathname === '/' ? 'Discover'
    : 'Discover'

  const go = (tab: string) => {
    if (tab === 'Discover') router.push('/landing')
    else if (tab === 'Performances') router.push('/search')
    else if (tab === 'Artists') router.push('/artists')
    else if (tab === 'Venues') router.push('/venues')
    else if (tab === 'Profile') router.push('/profile')
  }

  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(3,0,20,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 24px', display: 'flex', alignItems: 'center', height: '64px', gap: '32px' }}>
      <div onClick={() => router.push('/landing')} style={{ fontFamily: 'var(--font-bebas, sans-serif)', fontSize: '26px', letterSpacing: '0.12em', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flexShrink: 0 }}>
        <span style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg,#FF006E,#FF7A00)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>▶</span>
        LIVESCORE
      </div>

      <div style={{ display: 'flex', gap: '2px', flex: 1 }}>
        {(['Discover', 'Performances', 'Artists', 'Venues'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => go(tab)}
            style={{ background: 'none', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'var(--font-dm-sans, system-ui)', fontSize: '14px', fontWeight: activeTab === tab ? 600 : 400, color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.55)', borderBottom: activeTab === tab ? '2px solid #FF006E' : '2px solid transparent', transition: 'all 150ms ease' }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '10px', flexShrink: 0, alignItems: 'center' }}>
        <button
          onClick={() => go('Profile')}
          style={{ background: activeTab === 'Profile' ? 'rgba(255,0,110,0.15)' : 'none', border: activeTab === 'Profile' ? '1px solid rgba(255,0,110,0.4)' : '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '7px 16px', color: activeTab === 'Profile' ? '#FF006E' : 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-dm-sans, system-ui)', transition: 'all 150ms ease', display: 'flex', alignItems: 'center', gap: '6px' }}
          onMouseEnter={e => { if (activeTab !== 'Profile') { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; e.currentTarget.style.color = '#fff' } }}
          onMouseLeave={e => { if (activeTab !== 'Profile') { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' } }}
        >
          <span style={{ fontSize: '14px' }}>◉</span> Profile
        </button>
        <button style={{ background: 'linear-gradient(135deg,#FF006E,#FF3366)', border: 'none', borderRadius: '8px', padding: '8px 18px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-dm-sans, system-ui)', boxShadow: '0 0 20px rgba(255,0,110,0.4)', transition: 'all 150ms ease' }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 30px rgba(255,0,110,0.7)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 20px rgba(255,0,110,0.4)'; e.currentTarget.style.transform = '' }}
        >Sign up free</button>
      </div>
    </nav>
  )
}
