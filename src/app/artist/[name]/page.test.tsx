import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

const { mockNotFound, mockParams, mockFrom, mockGetBestSource } = vi.hoisted(() => ({
  mockNotFound: vi.fn(),
  mockParams: { name: 'Taylor%20Swift' } as { name: string },
  mockFrom: vi.fn(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockGetBestSource: vi.fn<() => any>(() => null),
}))

vi.mock('next/navigation', () => ({
  useParams: () => mockParams,
  notFound: mockNotFound,
}))
vi.mock('@/lib/supabase', () => ({ supabase: { from: mockFrom } }))
vi.mock('@/lib/youtube', () => ({
  getYouTubeThumbnail: vi.fn(() => null),
  getBestSource: mockGetBestSource,
}))
vi.mock('@/components/PageNav', () => ({ PageNav: () => null }))
vi.mock('@/components/SuggestFooter', () => ({ SuggestFooter: () => null }))
vi.mock('@/components/PlatformBadge', () => ({ PlatformBadge: () => null }))
vi.mock('@/components/SaveButton', () => ({ SaveButton: () => null }))

import ArtistPage from './page'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.fetch = vi.fn().mockResolvedValue({ json: () => Promise.resolve({ artists: [] }) }) as any

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeBuilder(result: { data: any; error: any }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b: any = {
    select: () => b,
    ilike: () => b,
    order: () => b,
    then: (resolve: (v: unknown) => unknown, reject: (v: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  }
  return b
}

function makePerf(id: string) {
  return {
    id,
    artist_name: 'Taylor Swift',
    event_name: `Concert ${id}`,
    venue_name: null,
    performance_date: null,
    performance_type: null,
    duration_minutes: null,
    watch_sources: [],
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockParams.name = 'Taylor%20Swift'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(global.fetch as any).mockResolvedValue({ json: () => Promise.resolve({ artists: [] }) })
})

describe('ArtistPage', () => {
  it('shows a loading spinner while data is being fetched', () => {
    const b: Record<string, unknown> = {}
    b.select = () => b; b.ilike = () => b; b.order = () => b
    b.then = () => new Promise(() => {})
    mockFrom.mockReturnValue(b)
    render(<ArtistPage />)
    expect(screen.getByText('Loading performances...')).toBeTruthy()
  })

  it('"More from this artist" section is hidden when artist has only 1 performance', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: [makePerf('p1')], error: null }))
    render(<ArtistPage />)
    await waitFor(() => expect(screen.queryByText('Loading performances...')).toBeNull())
    expect(screen.queryByLabelText('More from this artist')).toBeNull()
  })

  it('"More from this artist" section renders up to 4 cards when artist has >1 performances', async () => {
    const perfs = ['p1', 'p2', 'p3', 'p4', 'p5'].map(makePerf)
    mockFrom.mockReturnValue(makeBuilder({ data: perfs, error: null }))
    render(<ArtistPage />)
    await waitFor(() => expect(screen.queryByText('Loading performances...')).toBeNull())

    const section = screen.getByRole('region', { name: 'More from this artist' })
    expect(section).toBeTruthy()

    // The section should show only 4 of the 5 performances (by event_name in cards)
    const cards = section.querySelectorAll('[style*="border-radius: 14px"]')
    expect(cards.length).toBe(4)
  })

  it('"More from this artist" shows 4 cards when artist has exactly 4 performances', async () => {
    const perfs = ['p1', 'p2', 'p3', 'p4'].map(makePerf)
    mockFrom.mockReturnValue(makeBuilder({ data: perfs, error: null }))
    render(<ArtistPage />)
    await waitFor(() => expect(screen.queryByText('Loading performances...')).toBeNull())

    const section = screen.getByRole('region', { name: 'More from this artist' })
    const cards = section.querySelectorAll('[style*="border-radius: 14px"]')
    expect(cards.length).toBe(4)
  })

  it('"More from this artist" shows section when artist has exactly 2 performances', async () => {
    const perfs = ['p1', 'p2'].map(makePerf)
    mockFrom.mockReturnValue(makeBuilder({ data: perfs, error: null }))
    render(<ArtistPage />)
    await waitFor(() => expect(screen.queryByText('Loading performances...')).toBeNull())

    expect(screen.getByRole('region', { name: 'More from this artist' })).toBeTruthy()
  })

  it('shows "WATCHABLE PERFORMANCES" heading with all performances', async () => {
    const perfs = ['p1', 'p2', 'p3'].map(makePerf)
    mockFrom.mockReturnValue(makeBuilder({ data: perfs, error: null }))
    render(<ArtistPage />)
    await waitFor(() => expect(screen.getByText('WATCHABLE PERFORMANCES')).toBeTruthy())
  })

  it('shows error message on Supabase failure', async () => {
    mockFrom.mockReturnValue(makeBuilder({ data: null, error: new Error('db error') }))
    render(<ArtistPage />)
    await waitFor(() =>
      expect(screen.getByText(/Couldn't load performances/)).toBeTruthy()
    )
  })
})
