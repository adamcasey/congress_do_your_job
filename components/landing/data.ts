import { BriefingItem, ChoreItem, CivicAction, Metric, Official } from './types'

// Last full-year federal budget (not a continuing resolution): Consolidated Appropriations Act, 2023
export const LAST_FULL_BUDGET_PASSED_AT = '2022-12-29T00:00:00Z'

type RepresentativesApi = {
  success: boolean
  data?: {
    officials: Array<{
      id?: string
      fullName?: string
      firstName?: string
      lastName?: string
      office?: string
      level?: string
      chamber?: string
      jurisdiction?: string
      currentScore?: number
      isCurrentOfficial?: boolean
    }>
  }
}

type PetitionsApi = {
  success: boolean
  data?: {
    petitions: Array<{
      id: string
      slug?: string
      title: string
      description?: string
      targetLevel?: string
      status?: string
    }>
  }
}

type BriefingApi = {
  success: boolean
  data?: {
    items: BriefingItem[]
    deadlines: BriefingItem[]
  }
}

type ChoresApi = {
  success: boolean
  data?: {
    chores: ChoreItem[]
  }
}

type ProductivityApi = {
  success: boolean
  data?: {
    metrics: Metric[]
  }
}

export const defaultWeeklyBriefing: BriefingItem[] = [
  {
    title: 'Appropriations: Senate advanced 7 of 12 spending bills',
    summary: 'Committee marked up Transportation and Energy packages with near-unanimous votes.',
    status: 'advanced',
    detail: 'Next: full Senate consideration. House versions still pending.',
  },
  {
    title: 'FAA reauthorization still awaiting floor time',
    summary: 'Renewal remains stalled while temporary extension covers airport operations.',
    status: 'stalled',
    detail: 'Deadline approaching; no confirmed debate window.',
  },
  {
    title: 'Disaster aid supplemental cleared the House',
    summary: 'Passed with broad support after amendment debate focused on reporting requirements.',
    status: 'passed',
    detail: 'Heads to Senate; agency funding needs to be released before October.',
  },
  {
    title: 'AI framework hearing held in Senate Commerce',
    summary: 'Experts testified on transparency standards; draft bill promised “before recess.”',
    status: 'update',
    detail: 'Committee staff compiling recommendations; no vote scheduled.',
  },
]

export const defaultDeadlines: BriefingItem[] = [
  {
    title: 'Government funding runs out',
    summary: 'Current stopgap expires; House has 4 of 12 bills drafted, none on floor calendar.',
    status: 'overdue',
    detail: 'Congressional Research Service notes seven-day notice needed for orderly transition.',
  },
  {
    title: 'National Flood Insurance Program renewal',
    summary: 'Short-term extension expires; lapse would pause new policies.',
    status: 'overdue',
    detail: 'Floor time not yet reserved in either chamber.',
  },
  {
    title: 'Defense authorization conference report',
    summary: 'Chambers still reconciling procurement sections; conferees not announced.',
    status: 'scheduled',
    detail: 'Leaders said “before end of month,” but no public timeline released.',
  },
]

export const defaultChoreList: ChoreItem[] = [
  {
    title: 'FAA Reauthorization (multi-year)',
    due: 'Past due — temporary patch ends in weeks',
    status: 'overdue',
    impact: 'Keeps airports, safety inspectors, and modernization projects funded.',
    source: 'Congress.gov — FAA reauthorization',
  },
  {
    title: 'Appropriations x12',
    due: 'Next shutdown date: 4 weeks',
    status: 'scheduled',
    impact: 'Full-year budgets prevent automatic cuts and agency slowdowns.',
    source: 'Congress.gov — Appropriations tracker',
  },
  {
    title: 'Defense Authorization (NDAA)',
    due: 'Conference report pending',
    status: 'advanced',
    impact: 'Sets pay, procurement, and policy guidance for the services.',
    source: 'Congress.gov — NDAA actions',
  },
  {
    title: 'Data privacy baseline',
    due: 'Draft expected; no vote scheduled',
    status: 'stalled',
    impact: 'National rules for data handling and consumer transparency.',
    source: 'Energy & Commerce docket',
  },
]

export const defaultProductivityMetrics: Metric[] = [
  { label: 'Bills advanced this week', value: '14', change: '+4 vs last week', tone: 'good' },
  { label: 'Hearings held', value: '22', change: 'steady', tone: 'neutral' },
  { label: 'Floor hours worked', value: '31h', change: '+6h vs last week', tone: 'good' },
  { label: 'Vote attendance', value: '94%', change: '+1.5 pts', tone: 'good' },
  { label: 'Committee attendance', value: '88%', change: '-2 pts', tone: 'caution' },
  { label: 'Deadlines missed', value: '3', change: 'overdue tasks', tone: 'caution' },
]

export const defaultOfficials: Official[] = [
  {
    id: 'senate-jordan-lee',
    slug: 'senate-jordan-lee',
    name: 'Jordan Lee',
    office: 'U.S. Senator — Mid-Atlantic',
    score: 86,
    attendance: '98% vote attendance • 94% committee attendance',
    civilityNotes: 'No recorded decorum issues this session.',
  },
  {
    id: 'house-avery-chen',
    slug: 'house-avery-chen',
    name: 'Avery Chen',
    office: 'U.S. Representative — 7th District',
    score: 72,
    attendance: '93% vote attendance • 88% committee attendance',
    civilityNotes: 'Filed 3 bipartisan co-sponsor clusters in June.',
  },
  {
    id: 'senate-samira-patel',
    slug: 'senate-samira-patel',
    name: 'Samira Patel',
    office: 'U.S. Senator — Southwest',
    score: 64,
    attendance: '89% vote attendance • 80% committee attendance',
    civilityNotes: 'One formal warning for withdrawn remarks; resolved.',
  },
]

export const defaultCivicActions: CivicAction[] = [
  {
    id: 'letter-fy-budgets',
    slug: 'letter-fy-budgets',
    title: 'Letter: Finish full-year budgets',
    summary: 'Direct, neutral message reminding members to move all 12 appropriations bills before the next deadline.',
    level: 'Federal',
    action: 'Send to your delegation',
  },
  {
    id: 'petition-hearing-materials',
    slug: 'petition-hearing-materials',
    title: 'Petition: Publish hearing materials on time',
    summary: 'Requests committees to post witness lists, slides, and recordings within 48 hours of each hearing.',
    level: 'Congressional committees',
    action: 'Add your name',
  },
  {
    id: 'alert-faa-reauthorization',
    slug: 'alert-faa-reauthorization',
    title: 'Alert: Track FAA reauthorization',
    summary: 'Get updates when the reauthorization bill moves committees or is scheduled for floor debate.',
    level: 'Federal aviation policy',
    action: 'Start tracking',
  },
]

async function safeFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(path, { next: { revalidate: 300 } })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch (err) {
    console.error('Data fetch failed', err)
    return null
  }
}

export async function getBriefingData(): Promise<{ items: BriefingItem[]; deadlines: BriefingItem[] }> {
  const apiData = await safeFetch<BriefingApi>('/api/v1/briefing')

  if (apiData?.success && apiData.data) {
    return {
      items: apiData.data.items ?? defaultWeeklyBriefing,
      deadlines: apiData.data.deadlines ?? defaultDeadlines,
    }
  }

  return { items: defaultWeeklyBriefing, deadlines: defaultDeadlines }
}

export async function getChoreList(): Promise<ChoreItem[]> {
  const apiData = await safeFetch<ChoresApi>('/api/v1/chores')
  if (apiData?.success && apiData.data?.chores?.length) {
    return apiData.data.chores
  }
  return defaultChoreList
}

export async function getProductivityMetrics(): Promise<Metric[]> {
  const apiData = await safeFetch<ProductivityApi>('/api/v1/productivity')
  if (apiData?.success && apiData.data?.metrics?.length) {
    return apiData.data.metrics
  }
  return defaultProductivityMetrics
}

export async function getOfficials(): Promise<Official[]> {
  const apiData = await safeFetch<RepresentativesApi>('/api/v1/representatives?limit=6')

  if (apiData?.success && apiData.data?.officials?.length) {
    return apiData.data.officials.map((official) => {
      const name = official.fullName || [official.firstName, official.lastName].filter(Boolean).join(' ')
      const office =
        official.office ||
        [official.level, official.chamber].filter(Boolean).join(' • ') ||
        'Elected official'

      return {
        id: official.id,
        slug: official.id,
        name: name || 'Elected official',
        office,
        score: official.currentScore ?? 0,
        attendance: 'Attendance data coming soon',
        civilityNotes: official.isCurrentOfficial
          ? 'No recorded decorum notes yet — data feed coming soon.'
          : 'Former official — decorum data pending.',
      }
    })
  }

  return defaultOfficials
}

export async function getCivicActions(): Promise<CivicAction[]> {
  const apiData = await safeFetch<PetitionsApi>('/api/v1/petitions?status=active&limit=6')

  if (apiData?.success && apiData.data?.petitions?.length) {
    return apiData.data.petitions.map((petition) => ({
      id: petition.id,
      slug: petition.slug || petition.id,
      title: petition.title,
      summary: petition.description || 'Neutral petition text coming soon.',
      level: petition.targetLevel || 'Federal',
      action: petition.status === 'closed' ? 'View summary' : 'Add your name',
    }))
  }

  return defaultCivicActions
}
