export interface WatchSource {
  id: number
  url: string
  source_status: string
  subscription_service: string | null
}

export interface Performance {
  id: string
  artist_name: string
  event_name: string | null
  venue_name: string | null
  performance_date: string | null
  performance_type: string | null
  duration_minutes: number | null
  watch_sources: WatchSource[]
}
