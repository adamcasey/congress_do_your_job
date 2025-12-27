export type Status = 'advanced' | 'stalled' | 'overdue' | 'scheduled' | 'passed' | 'update'

export type BriefingItem = {
  title: string
  summary: string
  status: Status
  detail: string
}

export type ChoreItem = {
  title: string
  due: string
  status: Status
  impact: string
  source: string
}

export type Metric = {
  label: string
  value: string
  change: string
  tone?: 'good' | 'caution' | 'neutral'
}

export type Official = {
  name: string
  office: string
  score: number
  attendance: string
  civilityNotes: string
}

export type CivicAction = {
  title: string
  summary: string
  level: string
  action: string
}
