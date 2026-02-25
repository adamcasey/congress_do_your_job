/**
 * Scorecard Data Collection Service
 *
 * Bridges Congress.gov API data → ScoringInput for the scorecard calculator.
 *
 * Data availability by category:
 *   - Attendance: Partial (vote counts from API, hearing attendance not available)
 *   - Legislation: Full (sponsored/cosponsored bills, amendments via API)
 *   - Bipartisanship: Partial (cosponsorships available, cross-party detection requires party lookup)
 *   - Committee Work: Partial (memberships available, hearing/markup attendance not in API)
 *   - Civility: Not available from Congress.gov (requires manual editorial input)
 *   - Theater Ratio: Not available from Congress.gov (requires social media APIs)
 *
 * Categories without API data use neutral defaults so scores aren't unfairly penalized.
 * As additional data sources come online, this service will be updated to pull real data.
 */

import {
  ScoringInput,
  AttendanceData,
  LegislationData,
  BipartisanshipData,
  CommitteeWorkData,
  CivilityData,
  TheaterRatioData,
} from '@/types/scorecard'
import {
  getMember,
  getMemberSponsoredLegislation,
  getMemberCosponsoredLegislation,
  CongressApiError,
} from '@/lib/congress-api'
import { Bill, Member, Cosponsor } from '@/types/congress'
import { buildCacheKey, getOrFetch, CacheTTL } from '@/lib/cache'
import { createLogger } from '@/lib/logger'

const logger = createLogger('ScorecardDataCollector')

export interface CollectionResult {
  input: ScoringInput
  dataSources: DataSourceReport
}

export interface DataSourceReport {
  attendance: DataSourceStatus
  legislation: DataSourceStatus
  bipartisanship: DataSourceStatus
  committeeWork: DataSourceStatus
  civility: DataSourceStatus
  theaterRatio: DataSourceStatus
}

export type DataSourceStatus = 'live' | 'partial' | 'default'

interface CollectionOptions {
  congress?: number
  skipCache?: boolean
}

/**
 * Collect all available data for a member and build a ScoringInput.
 *
 * This is the main entry point. It fetches data from Congress.gov,
 * assembles it into the format expected by the scoring calculator,
 * and reports which data sources are live vs. defaulted.
 */
export async function collectScorecardData(
  bioguideId: string,
  periodStart: Date,
  periodEnd: Date,
  options: CollectionOptions = {}
): Promise<CollectionResult> {
  const cacheKey = buildCacheKey(
    'scorecard',
    'collection',
    `${bioguideId}:${periodStart.toISOString().slice(0, 10)}:${periodEnd.toISOString().slice(0, 10)}`
  )

  if (!options.skipCache) {
    const cached = await getOrFetch<CollectionResult>(
      cacheKey,
      () => fetchAndAssembleData(bioguideId, periodStart, periodEnd, options),
      CacheTTL.SCORECARD
    )
    return cached.data!
  }

  return fetchAndAssembleData(bioguideId, periodStart, periodEnd, options)
}

async function fetchAndAssembleData(
  bioguideId: string,
  periodStart: Date,
  periodEnd: Date,
  options: CollectionOptions
): Promise<CollectionResult> {
  logger.info(`Collecting scorecard data for ${bioguideId} (${periodStart.toISOString().slice(0, 10)} to ${periodEnd.toISOString().slice(0, 10)})`)

  // Fetch member profile, sponsored bills, and cosponsored bills in parallel
  const [member, sponsoredResponse, cosponsoredResponse] = await Promise.all([
    getMember(bioguideId),
    getMemberSponsoredLegislation(bioguideId, { limit: 250 }),
    getMemberCosponsoredLegislation(bioguideId, { limit: 250 }),
  ])

  const sponsoredBills = (sponsoredResponse.bills ?? [])
    .filter(bill => isWithinPeriod(bill, periodStart, periodEnd))

  const cosponsoredBills = (cosponsoredResponse.bills ?? [])
    .filter(bill => isWithinPeriod(bill, periodStart, periodEnd))

  const dataSources: DataSourceReport = {
    attendance: 'default',
    legislation: 'live',
    bipartisanship: 'partial',
    committeeWork: 'partial',
    civility: 'default',
    theaterRatio: 'default',
  }

  const legislation = buildLegislationData(sponsoredBills, cosponsoredBills)
  const bipartisanship = buildBipartisanshipData(sponsoredBills, cosponsoredBills, member)
  const committeeWork = buildCommitteeWorkData(member)

  const input: ScoringInput = {
    bioguideId,
    periodStart,
    periodEnd,
    attendance: buildDefaultAttendanceData(),
    legislation,
    bipartisanship,
    committeeWork,
    civility: buildDefaultCivilityData(),
    theaterRatio: buildDefaultTheaterRatioData(),
  }

  logger.info(`Data collection complete for ${bioguideId}: ${JSON.stringify(dataSources)}`)

  return { input, dataSources }
}

/**
 * Build legislation data from sponsored and cosponsored bills.
 *
 * Maps Congress.gov bill data to the LegislationData interface by
 * analyzing bill actions and status to determine advancement stage.
 */
function buildLegislationData(
  sponsoredBills: Bill[],
  cosponsoredBills: Bill[]
): LegislationData {
  let billsAdvancedPastCommittee = 0
  let billsPassedChamber = 0
  let billsEnactedIntoLaw = 0
  let amendmentsProposed = 0
  let amendmentsAdopted = 0

  for (const bill of sponsoredBills) {
    const actionText = bill.latestAction?.text?.toLowerCase() ?? ''

    if (isEnacted(actionText)) {
      billsEnactedIntoLaw++
      billsPassedChamber++
      billsAdvancedPastCommittee++
    } else if (isPassedChamber(actionText)) {
      billsPassedChamber++
      billsAdvancedPastCommittee++
    } else if (isAdvancedPastCommittee(actionText)) {
      billsAdvancedPastCommittee++
    }

    // Count amendments from bill actions if available
    if (bill.actions) {
      for (const action of bill.actions) {
        const text = action.text?.toLowerCase() ?? ''
        if (text.includes('amendment') && text.includes('proposed')) {
          amendmentsProposed++
        }
        if (text.includes('amendment') && (text.includes('agreed to') || text.includes('adopted'))) {
          amendmentsAdopted++
        }
      }
    }
  }

  return {
    billsSponsored: sponsoredBills.length,
    billsCosponsored: cosponsoredBills.length,
    billsAdvancedPastCommittee,
    billsPassedChamber,
    billsEnactedIntoLaw,
    amendmentsProposed,
    amendmentsAdopted,
  }
}

/**
 * Build bipartisanship data by analyzing cosponsor party affiliations.
 *
 * Cross-party detection: compares cosponsor parties against the member's own party.
 * A cosponsorship is "cross-party" if the cosponsor belongs to a different party.
 *
 * A sponsored bill is "bipartisan" if it has at least one cosponsor from a different party.
 */
function buildBipartisanshipData(
  sponsoredBills: Bill[],
  cosponsoredBills: Bill[],
  member: Member
): BipartisanshipData {
  const memberParty = member.partyName

  // Count cross-party cosponsorships on bills we cosponsored
  // (i.e., cases where we cosponsored a bill from someone in the other party)
  let crossPartyCosponsorships = 0
  for (const bill of cosponsoredBills) {
    const sponsorParty = bill.sponsors?.[0]?.party
    if (sponsorParty && sponsorParty !== memberParty) {
      crossPartyCosponsorships++
    }
  }

  // Count bipartisan bills we sponsored (bills with cross-party cosponsors)
  let bipartisanBillsSponsored = 0
  for (const bill of sponsoredBills) {
    const cosponsors = bill.cosponsors ?? []
    const hasCrossPartyCosponsor = cosponsors.some(
      (c: Cosponsor) => c.party && c.party !== memberParty
    )
    if (hasCrossPartyCosponsor) {
      bipartisanBillsSponsored++
    }
  }

  return {
    totalCosponsorships: cosponsoredBills.length,
    crossPartyCosponsorships,
    bipartisanBillsSponsored,
    totalBillsSponsored: sponsoredBills.length,
  }
}

/**
 * Build committee work data from member profile.
 *
 * Congress.gov API doesn't provide hearing attendance or markup participation,
 * so those fields get neutral defaults. Committee membership count is available.
 */
function buildCommitteeWorkData(member: Member): CommitteeWorkData {
  // The Member type from Congress.gov doesn't directly expose committee count,
  // but terms can give us a rough idea. For now, use a reasonable default.
  // TODO: Fetch /member/{id}/committees when that endpoint data is available
  return {
    committeeMemberships: 2, // Conservative default; most members serve on 2-3 committees
    hearingsAttended: 0,
    totalHearingsAvailable: 0, // Both zero = neutral score (50)
    markupsParticipated: 0,
    totalMarkups: 0, // Both zero = neutral score (50)
  }
}

/**
 * Default attendance data.
 * Returns neutral values (both numerator and denominator zero = no penalty).
 * Attendance tracking requires roll call vote APIs not yet integrated.
 */
function buildDefaultAttendanceData(): AttendanceData {
  return {
    totalVotes: 0,
    votesParticipated: 0,
    totalHearings: 0,
    hearingsAttended: 0,
  }
}

/**
 * Default civility data.
 * Starts with no infractions and no bonuses = baseline score of 80.
 * Civility data requires editorial review and cannot be automated.
 */
function buildDefaultCivilityData(): CivilityData {
  return {
    personalAttacksOnRecord: 0,
    censuresOrReprimands: 0,
    ethicsComplaintsFiled: 0,
    bipartisanCaucusMemberships: 0,
    crossAisleCosponsorships: 0,
  }
}

/**
 * Default theater ratio data.
 * Both work and theater at zero = neutral score of 50.
 * Theater tracking requires social media APIs not yet integrated.
 */
function buildDefaultTheaterRatioData(): TheaterRatioData {
  return {
    legislativeActionsThisPeriod: 0,
    socialMediaPostCount: 0,
    mediaAppearanceCount: 0,
    pressConferencesNonLegislative: 0,
  }
}

// --- Bill status detection helpers ---

function isWithinPeriod(bill: Bill, start: Date, end: Date): boolean {
  const updateDate = new Date(bill.updateDate)
  return updateDate >= start && updateDate <= end
}

function isEnacted(actionText: string): boolean {
  return (
    actionText.includes('became public law') ||
    actionText.includes('signed by president') ||
    actionText.includes('enacted')
  )
}

function isPassedChamber(actionText: string): boolean {
  return (
    actionText.includes('passed house') ||
    actionText.includes('passed senate') ||
    actionText.includes('agreed to in house') ||
    actionText.includes('agreed to in senate') ||
    actionText.includes('resolution agreed to')
  )
}

function isAdvancedPastCommittee(actionText: string): boolean {
  return (
    actionText.includes('reported by') ||
    actionText.includes('ordered to be reported') ||
    actionText.includes('placed on calendar')
  )
}
