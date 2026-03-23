export function getYouTubeThumbnail(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    let id: string | null = null
    if (u.hostname.includes('youtu.be')) {
      id = u.pathname.slice(1).split('?')[0]
    } else if (u.hostname.includes('youtube.com')) {
      id = u.searchParams.get('v')
    }
    if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) {
      return `https://img.youtube.com/vi/${id}/hqdefault.jpg`
    }
  } catch {}
  return null
}

export function getBestSource(
  sources: Array<{ url: string; source_status: string; subscription_service?: string | null }> | null
): { url: string; isYouTube: boolean; platform: string } | null {
  if (!sources?.length) return null
  const sorted = [...sources].sort((a, b) => {
    const score = (s: typeof a) =>
      s.source_status === 'verified' && s.url.includes('youtube') ? 3
      : s.source_status === 'verified' ? 2
      : 1
    return score(b) - score(a)
  })
  const s = sorted[0]
  return {
    url: s.url,
    isYouTube: s.url.includes('youtube') || s.url.includes('youtu.be'),
    platform: s.subscription_service || (s.url.includes('youtube') ? 'YouTube' : 'Watch'),
  }
}
