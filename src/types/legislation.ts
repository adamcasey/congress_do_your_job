import { Bill } from './congress'

export interface RecentLegislationData {
  bills: Bill[]
  count: number
  lastUpdated: string
  error?: string
}

export interface UseRecentLegislationArgs {
  limit?: number
  days?: number
  enabled?: boolean
}

export interface UseRecentLegislationReturn {
  data: RecentLegislationData | null
  loading: boolean
  error: string | null
}
