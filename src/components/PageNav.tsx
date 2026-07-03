'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useUser, useSignOut } from '@/lib/useUser'

export function PageNav() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading } = useUser()
  const signOut = useSignOut()
  const [menuOpen, setMenuOpen] = useState(false)

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

  const avatarUrl = (user?.user_metadata?.avatar_url as string | undefined) || null
  const initial = (user?.email?.[0] || '?').toUpperCase()

  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(3,0,20,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 24px', display: 'flex', alignItems: 'center', height: '64px', gap: '32px' }}>
      <div onClick={() => router.push('/landing')} style={{ fontFamily: 'var(--font-bebas, sans-serif)', fontSize: '26px', letterSpacing: '0.12em', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flexShrink: 0 }}>
        <span style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg,#FF006E,#FF7A00)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>▶</span>
        LIVESCORE
      </div>

      <div className="nav-tabs" style={{ display: 'flex', gap: '2px', flex: 1 }}>
        {(['Discover', 'Performances', 'Artists', 'Venues'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => go(tab)}
            aria-current={activeTab === tab ? 'page' : undefined}
            style={{ background: 'none', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'var(--font-dm-sans, system-ui)', fontSize: '14px', fontWeight: activeTab === tab ? 600 : 400, color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.55)', borderBottom: activeTab === tab ? '2px solid #FF006E' : '2px solid transparent', transition: 'all 150ms ease', whiteSpace: 'nowrap' }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '10px', flexShrink: 0, alignItems: 'center' }}>
        {loading ? null : user ? (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Account menu"
              style={{ width: '38px', height: '38px', borderRadius: '50%', border: menuOpen ? '2px solid #FF006E' : '2px solid rgba(255,255,255,0.2)', background: avatarUrl ? 'transparent' : 'linear-gradient(135deg,#FF006E,#FF7A00)', overflow: 'hidden', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '15px', fontFamily: 'var(--font-dm-sans, system-ui)' }}
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : initial}
            </button>
            {menuOpen && (
              <>
                <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                <div style={{ position: 'absolute', top: '46px', right: 0, zIndex: 41, background: '#0d0820', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '6px', minWidth: '180px', boxShadow: '0 12px 32px rgba(0,0,0,0.6)' }}>
                  <div style={{ padding: '8px 12px', fontSize: '12px', color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />
                  <button onClick={() => { setMenuOpen(false); router.push('/profile') }} style={menuItemStyle}>Profile</button>
                  <button onClick={() => { setMenuOpen(false); signOut() }} style={menuItemStyle}>Sign out</button>
                </div>
              </>
            )}
          </div>
        ) : (
          <button
            onClick={() => router.push('/login')}
            style={{ background: 'linear-gradient(135deg,#FF006E,#FF3366)', border: 'none', borderRadius: '8px', padding: '8px 18px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-dm-sans, system-ui)', boxShadow: '0 0 20px rgba(255,0,110,0.4)', transition: 'all 150ms ease', whiteSpace: 'nowrap' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 30px rgba(255,0,110,0.7)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 20px rgba(255,0,110,0.4)'; e.currentTarget.style.transform = '' }}
          >Sign up free</button>
        )}
      </div>
    </nav>
  )
}

const menuItemStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  background: 'none',
  border: 'none',
  padding: '9px 12px',
  borderRadius: '6px',
  color: 'rgba(255,255,255,0.85)',
  fontSize: '13px',
  cursor: 'pointer',
  fontFamily: 'var(--font-dm-sans, system-ui)',
}
