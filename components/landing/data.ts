import { BriefingItem, ChoreItem, CivicAction, Metric, Official } from './types'

export const weeklyBriefing: BriefingItem[] = [
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

export const deadlines: BriefingItem[] = [
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

export const choreList: ChoreItem[] = [
  {
    title: 'FAA Reauthorization (multi-year)',
    due: 'Past due — temporary patch ends in weeks',
    status: 'overdue',
    impact: 'Keeps airports, safety inspectors, and modernization projects funded.',
    source: 'TODO: link to primary source (Congress.gov)',
  },
  {
    title: 'Appropriations x12',
    due: 'Next shutdown date: 4 weeks',
    status: 'scheduled',
    impact: 'Full-year budgets prevent automatic cuts and agency slowdowns.',
    source: 'TODO: pull current calendar and status from Congress.gov',
  },
  {
    title: 'Defense Authorization (NDAA)',
    due: 'Conference report pending',
    status: 'advanced',
    impact: 'Sets pay, procurement, and policy guidance for the services.',
    source: 'TODO: sync with bill actions feed',
  },
  {
    title: 'Data privacy baseline',
    due: 'Draft expected; no vote scheduled',
    status: 'stalled',
    impact: 'National rules for data handling and consumer transparency.',
    source: 'TODO: add primary source references',
  },
]

export const productivityMetrics: Metric[] = [
  { label: 'Bills advanced this week', value: '14', change: '+4 vs last week', tone: 'good' },
  { label: 'Hearings held', value: '22', change: 'steady', tone: 'neutral' },
  { label: 'Floor hours worked', value: '31h', change: '+6h vs last week', tone: 'good' },
  { label: 'Vote attendance', value: '94%', change: '+1.5 pts', tone: 'good' },
  { label: 'Committee attendance', value: '88%', change: '-2 pts', tone: 'caution' },
  { label: 'Deadlines missed', value: '3', change: 'overdue tasks', tone: 'caution' },
]

export const officials: Official[] = [
  {
    name: 'Jordan Lee',
    office: 'U.S. Senator — Mid-Atlantic',
    score: 86,
    attendance: '98% vote attendance • 94% committee attendance',
    civilityNotes: 'No recorded decorum issues this session.',
  },
  {
    name: 'Avery Chen',
    office: 'U.S. Representative — 7th District',
    score: 72,
    attendance: '93% vote attendance • 88% committee attendance',
    civilityNotes: 'Filed 3 bipartisan co-sponsor clusters in June.',
  },
  {
    name: 'Samira Patel',
    office: 'U.S. Senator — Southwest',
    score: 64,
    attendance: '89% vote attendance • 80% committee attendance',
    civilityNotes: 'One formal warning for withdrawn remarks; resolved.',
  },
]

export const civicActions: CivicAction[] = [
  {
    title: 'Letter: Finish full-year budgets',
    summary: 'Direct, neutral message reminding members to move all 12 appropriations bills before the next deadline.',
    level: 'Federal',
    action: 'Send to your delegation',
  },
  {
    title: 'Petition: Publish hearing materials on time',
    summary: 'Requests committees to post witness lists, slides, and recordings within 48 hours of each hearing.',
    level: 'Congressional committees',
    action: 'Add your name',
  },
  {
    title: 'Alert: Track FAA reauthorization',
    summary: 'Get updates when the reauthorization bill moves committees or is scheduled for floor debate.',
    level: 'Federal aviation policy',
    action: 'Start tracking',
  },
]
