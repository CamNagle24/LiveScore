export type TrackEventMap = {
  search_submit: { query: string }
  artist_card_click: { artist: string }
  save_toggle: { performanceId: string; saved: boolean }
}

export function track<E extends keyof TrackEventMap>(event: E, props: TrackEventMap[E]): void {
  // no-op: swap for a real provider (e.g. Segment, PostHog) when ready
  void event
  void props
}
