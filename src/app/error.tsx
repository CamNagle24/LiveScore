'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

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
      <div style={{ fontSize: '48px', opacity: 0.15, marginBottom: '24px' }}>!</div>
      <h2 style={{
        fontSize: 'clamp(22px,4vw,36px)',
        fontWeight: 700,
        margin: '0 0 12px',
        color: '#fff',
      }}>
        Something went wrong
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px', margin: '0 0 32px', maxWidth: '360px', lineHeight: 1.6 }}>
        An unexpected error occurred. Try refreshing or come back later.
      </p>
      <button
        onClick={() => unstable_retry()}
        style={{
          background: 'linear-gradient(135deg,#FF006E,#FF3366)',
          border: 'none',
          borderRadius: '10px',
          padding: '12px 28px',
          color: '#fff',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        Try again
      </button>
    </div>
  )
}
