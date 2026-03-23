import { NextRequest } from 'next/server'

interface AudioDBArtist {
  strArtist?: string
  strArtistThumb?: string
  strArtistFanart?: string
  strArtistFanart2?: string
  strGenre?: string
  strCountry?: string
  strBiographyEN?: string
}

interface AudioDBResponse {
  artists: AudioDBArtist[] | null
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()
  if (!q) {
    return Response.json({ artists: [] })
  }

  try {
    const url = `https://www.theaudiodb.com/api/v1/json/2/search.php?s=${encodeURIComponent(q)}`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'LiveScore/1.0' },
      next: { revalidate: 3600 }, // cache 1hr
    })

    if (!res.ok) {
      return Response.json({ artists: [] })
    }

    const data: AudioDBResponse = await res.json()
    if (!data.artists) {
      return Response.json({ artists: [] })
    }

    const artists = data.artists.slice(0, 12).map((a: AudioDBArtist) => ({
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
