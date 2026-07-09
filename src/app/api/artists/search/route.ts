import { NextRequest } from 'next/server'
import { consumeToken, getClientIp } from '@/lib/rateLimit'
import { searchArtists, AudioDbArtist } from '@/lib/audioDb'

const MAX_QUERY_LENGTH = 100

// ~10 requests per 10s per IP: generous enough for normal interactive typing
// (debounced client-side) while still blocking a scripted client from
// hammering the rate-limited upstream AudioDB API.
const RATE_LIMIT = 10
const RATE_LIMIT_WINDOW_MS = 10_000

export async function GET(request: NextRequest) {
  const ip = getClientIp(request.headers)
  const { ok, retryAfterSeconds } = consumeToken(ip, {
    limit: RATE_LIMIT,
    windowMs: RATE_LIMIT_WINDOW_MS,
  })
  if (!ok) {
    return Response.json(
      { artists: [], error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
    )
  }

  const q = request.nextUrl.searchParams.get('q')?.trim()
  if (!q) {
    return Response.json({ artists: [] })
  }
  if (q.length > MAX_QUERY_LENGTH) {
    return Response.json({ artists: [] }, { status: 400 })
  }

  try {
    const raw = await searchArtists(q)
    const artists = raw.slice(0, 12).map((a: AudioDbArtist) => ({
      name: a.strArtist || '',
      genre: a.strGenre || '',
      country: a.strCountry || '',
      thumb: a.strArtistThumb || null,
      fanart: a.strArtistFanart || a.strArtistFanart2 || null,
      biography: (a.strBiographyEN || '').slice(0, 200),
    }))
    return Response.json({ artists })
  } catch {
    return Response.json({ artists: [] }, { status: 500 })
  }
}
