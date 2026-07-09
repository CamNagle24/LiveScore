const AUDIODB_URL = 'https://www.theaudiodb.com/api/v1/json/2/search.php'
const TIMEOUT_MS = 5000

export interface AudioDbArtist {
  strArtist?: string
  strArtistThumb?: string
  strArtistFanart?: string
  strArtistFanart2?: string
  strGenre?: string
  strCountry?: string
  strBiographyEN?: string
}

interface AudioDbResponse {
  artists: AudioDbArtist[] | null
}

export async function searchArtists(
  query: string,
  signal?: AbortSignal
): Promise<AudioDbArtist[]> {
  const url = `${AUDIODB_URL}?s=${encodeURIComponent(query)}`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'LiveScore/1.0' },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    next: { revalidate: 3600 } as any,
    signal: signal ?? AbortSignal.timeout(TIMEOUT_MS),
  })

  if (!res.ok) return []

  const data: AudioDbResponse = await res.json()
  return data.artists ?? []
}
