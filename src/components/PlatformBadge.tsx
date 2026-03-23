import React from 'react'

interface PlatformBadgeProps {
  platform: string
  isYouTube: boolean
  size?: 'sm' | 'md'
}

const PLATFORM: Record<string, { label: string; bg: string; color: string; icon: string }> = {
  'YouTube':                                      { label: 'YouTube',    bg: '#FF0000', color: '#fff', icon: '▶' },
  'Amazon Prime Video':                          { label: 'Prime',       bg: '#00A8E1', color: '#fff', icon: '⬡' },
  'Netflix':                                     { label: 'Netflix',     bg: '#E50914', color: '#fff', icon: 'N' },
  'Max':                                         { label: 'Max',         bg: '#002BE7', color: '#fff', icon: '◼' },
  'HBO Max':                                     { label: 'Max',         bg: '#002BE7', color: '#fff', icon: '◼' },
  'Hulu':                                        { label: 'Hulu',        bg: '#1CE783', color: '#000', icon: '▷' },
  'Peacock':                                     { label: 'Peacock',     bg: '#E8650A', color: '#fff', icon: '✦' },
  'Paramount+':                                  { label: 'P+',          bg: '#0064FF', color: '#fff', icon: '★' },
  'Apple TV+':                                   { label: 'Apple TV+',   bg: '#1C1C1E', color: '#fff', icon: '◉' },
  'Disney+':                                     { label: 'Disney+',     bg: '#113CCF', color: '#fff', icon: '✦' },
  'Spotify':                                     { label: 'Spotify',     bg: '#1DB954', color: '#000', icon: '♫' },
  'BBC iPlayer':                                 { label: 'BBC iPlayer', bg: '#BB1919', color: '#fff', icon: '◉' },
  'Tubi':                                        { label: 'Tubi',        bg: '#FA5A05', color: '#fff', icon: '▶' },
  'Pluto TV':                                    { label: 'Pluto TV',    bg: '#6D50D4', color: '#fff', icon: '◎' },
  'YouTube Premium':                             { label: 'YT Premium',  bg: '#FF0000', color: '#fff', icon: '▶' },
  'Qello Concerts by Stingray Amazon Channel':   { label: 'Qello',       bg: '#1a0a35', color: '#8070c0', icon: '🔒' },
  'Apple Music':                                 { label: 'Apple Music', bg: '#FC3C44', color: '#fff', icon: '♫' },
}

export function PlatformBadge({ platform, isYouTube, size = 'sm' }: PlatformBadgeProps) {
  const key = isYouTube ? 'YouTube' : platform
  const cfg = PLATFORM[key] || { label: platform || 'Watch', bg: '#2a1a40', color: '#a090d0', icon: '🔒' }
  const padH = size === 'md' ? '10px' : '7px'
  const padV = size === 'md' ? '5px' : '3px'
  const fs = size === 'md' ? '12px' : '10px'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        background: cfg.bg,
        color: cfg.color,
        borderRadius: '5px',
        padding: `${padV} ${padH}`,
        fontSize: fs,
        fontWeight: 700,
        letterSpacing: '0.03em',
        fontFamily: 'var(--font-dm-sans, system-ui)',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: size === 'md' ? '11px' : '9px' }}>{cfg.icon}</span>
      {cfg.label}
    </span>
  )
}
