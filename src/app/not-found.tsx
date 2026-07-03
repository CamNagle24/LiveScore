import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      background: '#030014',
      color: '#fff',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      padding: '24px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '48px', opacity: 0.15, marginBottom: '24px' }}>♪</div>
      <h1 style={{
        fontFamily: 'system-ui, sans-serif',
        fontSize: 'clamp(24px,5vw,40px)',
        fontWeight: 700,
        margin: '0 0 12px',
        color: '#fff',
      }}>
        Page not found
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px', margin: '0 0 32px', maxWidth: '360px', lineHeight: 1.6 }}>
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <Link
        href="/landing"
        style={{
          background: 'linear-gradient(135deg,#FF006E,#FF3366)',
          border: 'none',
          borderRadius: '10px',
          padding: '12px 28px',
          color: '#fff',
          fontSize: '14px',
          fontWeight: 600,
          textDecoration: 'none',
          display: 'inline-block',
        }}
      >
        Back to LiveScore
      </Link>
    </div>
  )
}
