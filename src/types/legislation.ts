import { Bill } from './congress'

export interface CongressStatsResponse {
  billsAdvancedThisWeek: number
  billsAdvancedLastWeek: number
  /** Positive = more bills advanced this week than last */
  billsChange: number
  billsChangeTone: 'good' | 'neutral' | 'caution'
  /** Human-readable label, e.g. "Feb 18 – Feb 25, 2026" */
  weekLabel: string
  lastUpdated: string
}

export interface UseCongressStatsReturn {
  data: CongressStatsResponse | null
  loading: boolean
  error: string | null
}

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
