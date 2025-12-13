/**
 * Shared TypeScript types for the application
 */

export interface Representative {
  id: string
  name: string
  office: string
  level: 'federal' | 'state' | 'county' | 'city'
}

export interface ScorecardData {
  representativeId: string
  score: number
  lastUpdated: Date
}
