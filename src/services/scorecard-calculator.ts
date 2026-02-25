/**
 * Scorecard Calculator
 *
 * Pure-function scoring engine for the Civility & Productivity Scorecard.
 * All calculations are deterministic, transparent, and version-controlled.
 *
 * Methodology version history:
 *   1.0.0 - Initial scoring algorithm with 6 categories
 *
 * Scoring philosophy:
 *   - Reward doing the job (attendance, legislation, committee work)
 *   - Reward working across the aisle (bipartisanship)
 *   - Penalize theater over substance (theater ratio)
 *   - Penalize incivility (personal attacks, ethics violations)
 *   - All inputs are from verifiable public records
 */

import {
  ScoreCategory,
  ScoringWeights,
  ScoringInput,
  AttendanceData,
  LegislationData,
  BipartisanshipData,
  CommitteeWorkData,
  CivilityData,
  TheaterRatioData,
  CategoryScore,
  CategoryScoreDetails,
  CalculatedScorecard,
  ScorecardGrade,
} from '@/types/scorecard'

export const METHODOLOGY_VERSION = '1.0.0'

// Default weights — sum to 1.0
export const DEFAULT_WEIGHTS: ScoringWeights = {
  [ScoreCategory.ATTENDANCE]: 0.20,
  [ScoreCategory.LEGISLATION]: 0.25,
  [ScoreCategory.BIPARTISANSHIP]: 0.15,
  [ScoreCategory.COMMITTEE_WORK]: 0.15,
  [ScoreCategory.CIVILITY]: 0.10,
  [ScoreCategory.THEATER_RATIO]: 0.15,
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function round(value: number, decimals: number = 1): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

/**
 * Calculate attendance score (0-100)
 *
 * Formula: weighted average of vote participation and hearing attendance.
 * Vote participation is weighted more heavily (70/30) because votes
 * are the core legislative function.
 */
export function calculateAttendanceScore(data: AttendanceData): CategoryScore {
  const voteRate = data.totalVotes > 0
    ? (data.votesParticipated / data.totalVotes) * 100
    : 100 // No votes scheduled = no penalty

  const hearingRate = data.totalHearings > 0
    ? (data.hearingsAttended / data.totalHearings) * 100
    : 100

  const rawScore = clamp(round(voteRate * 0.7 + hearingRate * 0.3), 0, 100)

  const details: CategoryScoreDetails = {
    description: 'Measures participation in floor votes and committee hearings',
    inputs: {
      totalVotes: data.totalVotes,
      votesParticipated: data.votesParticipated,
      totalHearings: data.totalHearings,
      hearingsAttended: data.hearingsAttended,
    },
    formula: '(voteParticipationRate × 0.7) + (hearingAttendanceRate × 0.3)',
  }

  return {
    category: ScoreCategory.ATTENDANCE,
    rawScore,
    weight: DEFAULT_WEIGHTS[ScoreCategory.ATTENDANCE],
    weightedScore: round(rawScore * DEFAULT_WEIGHTS[ScoreCategory.ATTENDANCE]),
    details,
  }
}

/**
 * Calculate legislation score (0-100)
 *
 * Uses a points system that rewards legislative productivity at each stage.
 * Points are normalized against the period median to avoid penalizing
 * members during slow legislative periods.
 *
 * Points per action:
 *   Bill sponsored: 3
 *   Bill cosponsored: 1
 *   Bill advanced past committee: 5
 *   Bill passed chamber: 8
 *   Bill enacted into law: 15
 *   Amendment proposed: 2
 *   Amendment adopted: 4
 */
export function calculateLegislationScore(data: LegislationData): CategoryScore {
  const points =
    data.billsSponsored * 3 +
    data.billsCosponsored * 1 +
    data.billsAdvancedPastCommittee * 5 +
    data.billsPassedChamber * 8 +
    data.billsEnactedIntoLaw * 15 +
    data.amendmentsProposed * 2 +
    data.amendmentsAdopted * 4

  // Normalize: 50 points = solid performance (score of 75).
  // Scale is logarithmic to prevent runaway scores from bulk cosponsorships.
  // Floor of 10 if any activity exists; 0 only for truly inactive members.
  let rawScore: number
  if (points === 0) {
    rawScore = 0
  } else {
    rawScore = clamp(round(25 * Math.log2(points + 1)), 10, 100)
  }

  const details: CategoryScoreDetails = {
    description: 'Measures legislative productivity across sponsorship, committee advancement, and enactment',
    inputs: {
      billsSponsored: data.billsSponsored,
      billsCosponsored: data.billsCosponsored,
      billsAdvancedPastCommittee: data.billsAdvancedPastCommittee,
      billsPassedChamber: data.billsPassedChamber,
      billsEnactedIntoLaw: data.billsEnactedIntoLaw,
      amendmentsProposed: data.amendmentsProposed,
      amendmentsAdopted: data.amendmentsAdopted,
      totalPoints: points,
    },
    formula: 'clamp(25 × log₂(points + 1), 10, 100) where points = Σ(action × weight)',
  }

  return {
    category: ScoreCategory.LEGISLATION,
    rawScore,
    weight: DEFAULT_WEIGHTS[ScoreCategory.LEGISLATION],
    weightedScore: round(rawScore * DEFAULT_WEIGHTS[ScoreCategory.LEGISLATION]),
    details,
  }
}

/**
 * Calculate bipartisanship score (0-100)
 *
 * Rewards working across party lines. Measures the ratio of cross-party
 * cosponsorships and bipartisan bill sponsorship.
 */
export function calculateBipartisanshipScore(data: BipartisanshipData): CategoryScore {
  const crossPartyRate = data.totalCosponsorships > 0
    ? (data.crossPartyCosponsorships / data.totalCosponsorships) * 100
    : 50 // Neutral if no cosponsorships

  const bipartisanSponsorRate = data.totalBillsSponsored > 0
    ? (data.bipartisanBillsSponsored / data.totalBillsSponsored) * 100
    : 50

  // Weight: 60% cross-party cosponsorships, 40% bipartisan sponsorship
  const rawScore = clamp(round(crossPartyRate * 0.6 + bipartisanSponsorRate * 0.4), 0, 100)

  const details: CategoryScoreDetails = {
    description: 'Measures willingness to work across party lines through cosponsorships and bipartisan bills',
    inputs: {
      totalCosponsorships: data.totalCosponsorships,
      crossPartyCosponsorships: data.crossPartyCosponsorships,
      bipartisanBillsSponsored: data.bipartisanBillsSponsored,
      totalBillsSponsored: data.totalBillsSponsored,
    },
    formula: '(crossPartyCosponsorshipRate × 0.6) + (bipartisanSponsorRate × 0.4)',
  }

  return {
    category: ScoreCategory.BIPARTISANSHIP,
    rawScore,
    weight: DEFAULT_WEIGHTS[ScoreCategory.BIPARTISANSHIP],
    weightedScore: round(rawScore * DEFAULT_WEIGHTS[ScoreCategory.BIPARTISANSHIP]),
    details,
  }
}

/**
 * Calculate committee work score (0-100)
 *
 * Measures active participation in committee business beyond attendance.
 */
export function calculateCommitteeWorkScore(data: CommitteeWorkData): CategoryScore {
  const hearingRate = data.totalHearingsAvailable > 0
    ? (data.hearingsAttended / data.totalHearingsAvailable) * 100
    : 50

  const markupRate = data.totalMarkups > 0
    ? (data.markupsParticipated / data.totalMarkups) * 100
    : 50

  // Bonus for serving on multiple committees (capped at +10)
  const committeeBonus = clamp(data.committeeMemberships * 3, 0, 10)

  const rawScore = clamp(
    round(hearingRate * 0.5 + markupRate * 0.4 + committeeBonus),
    0,
    100
  )

  const details: CategoryScoreDetails = {
    description: 'Measures active participation in committee hearings, markups, and service breadth',
    inputs: {
      committeeMemberships: data.committeeMemberships,
      hearingsAttended: data.hearingsAttended,
      totalHearingsAvailable: data.totalHearingsAvailable,
      markupsParticipated: data.markupsParticipated,
      totalMarkups: data.totalMarkups,
    },
    formula: '(hearingAttendanceRate × 0.5) + (markupParticipationRate × 0.4) + min(committees × 3, 10)',
  }

  return {
    category: ScoreCategory.COMMITTEE_WORK,
    rawScore,
    weight: DEFAULT_WEIGHTS[ScoreCategory.COMMITTEE_WORK],
    weightedScore: round(rawScore * DEFAULT_WEIGHTS[ScoreCategory.COMMITTEE_WORK]),
    details,
  }
}

/**
 * Calculate civility score (0-100)
 *
 * Starts at 80 (baseline assumption of professional conduct).
 * Deductions for documented incivility; bonuses for bipartisan engagement.
 *
 * Deductions:
 *   Personal attacks on record: -10 each
 *   Censures or reprimands: -25 each
 *   Ethics complaints filed: -5 each
 *
 * Bonuses:
 *   Bipartisan caucus memberships: +5 each (max +15)
 *   Cross-aisle cosponsorships: +1 per 5 (max +10)
 */
export function calculateCivilityScore(data: CivilityData): CategoryScore {
  const baseline = 80

  const deductions =
    data.personalAttacksOnRecord * 10 +
    data.censuresOrReprimands * 25 +
    data.ethicsComplaintsFiled * 5

  const caucusBonus = clamp(data.bipartisanCaucusMemberships * 5, 0, 15)
  const cosponsorBonus = clamp(Math.floor(data.crossAisleCosponsorships / 5), 0, 10)

  const rawScore = clamp(round(baseline - deductions + caucusBonus + cosponsorBonus), 0, 100)

  const details: CategoryScoreDetails = {
    description: 'Measures professional conduct based on verified public records; penalizes documented incivility, rewards bipartisan engagement',
    inputs: {
      personalAttacksOnRecord: data.personalAttacksOnRecord,
      censuresOrReprimands: data.censuresOrReprimands,
      ethicsComplaintsFiled: data.ethicsComplaintsFiled,
      bipartisanCaucusMemberships: data.bipartisanCaucusMemberships,
      crossAisleCosponsorships: data.crossAisleCosponsorships,
    },
    formula: 'clamp(80 - (attacks × 10) - (censures × 25) - (ethics × 5) + min(caucuses × 5, 15) + min(⌊cosponsorships/5⌋, 10), 0, 100)',
  }

  return {
    category: ScoreCategory.CIVILITY,
    rawScore,
    weight: DEFAULT_WEIGHTS[ScoreCategory.CIVILITY],
    weightedScore: round(rawScore * DEFAULT_WEIGHTS[ScoreCategory.CIVILITY]),
    details,
  }
}

/**
 * Calculate theater-to-work ratio score (0-100)
 *
 * Measures whether a member spends proportionate time governing vs. performing.
 * High legislative activity + moderate media = good score.
 * Low legislative activity + high media = poor score.
 *
 * Ratio = legislativeActions / (socialMedia + mediaAppearances + pressConferences + 1)
 * The +1 prevents division by zero.
 *
 * Score mapping:
 *   ratio >= 1.0: 90-100 (more work than theater)
 *   ratio >= 0.5: 70-89  (balanced)
 *   ratio >= 0.2: 40-69  (leaning theater)
 *   ratio < 0.2:  0-39   (all theater, no work)
 */
export function calculateTheaterRatioScore(data: TheaterRatioData): CategoryScore {
  const theaterActivity =
    data.socialMediaPostCount +
    data.mediaAppearanceCount +
    data.pressConferencesNonLegislative

  const ratio = data.legislativeActionsThisPeriod / (theaterActivity + 1)

  let rawScore: number
  if (theaterActivity === 0 && data.legislativeActionsThisPeriod === 0) {
    rawScore = 50 // No data = neutral
  } else if (ratio >= 1.0) {
    rawScore = clamp(round(90 + (ratio - 1.0) * 5), 90, 100)
  } else if (ratio >= 0.5) {
    rawScore = round(70 + (ratio - 0.5) * 40)
  } else if (ratio >= 0.2) {
    rawScore = round(40 + (ratio - 0.2) * 100)
  } else {
    rawScore = clamp(round(ratio * 200), 0, 39)
  }

  const details: CategoryScoreDetails = {
    description: 'Measures time allocation between governing and performing; rewards substance over spectacle',
    inputs: {
      legislativeActionsThisPeriod: data.legislativeActionsThisPeriod,
      socialMediaPostCount: data.socialMediaPostCount,
      mediaAppearanceCount: data.mediaAppearanceCount,
      pressConferencesNonLegislative: data.pressConferencesNonLegislative,
      theaterToWorkRatio: round(ratio, 3),
    },
    formula: 'ratio = legislativeActions / (socialMedia + media + pressConferences + 1), then mapped to 0-100 scale',
  }

  return {
    category: ScoreCategory.THEATER_RATIO,
    rawScore,
    weight: DEFAULT_WEIGHTS[ScoreCategory.THEATER_RATIO],
    weightedScore: round(rawScore * DEFAULT_WEIGHTS[ScoreCategory.THEATER_RATIO]),
    details,
  }
}

/**
 * Map a 0-100 score to a letter grade
 */
export function scoreToGrade(score: number): ScorecardGrade {
  if (score >= 97) return 'A+'
  if (score >= 93) return 'A'
  if (score >= 90) return 'A-'
  if (score >= 87) return 'B+'
  if (score >= 83) return 'B'
  if (score >= 80) return 'B-'
  if (score >= 77) return 'C+'
  if (score >= 73) return 'C'
  if (score >= 70) return 'C-'
  if (score >= 67) return 'D+'
  if (score >= 63) return 'D'
  if (score >= 60) return 'D-'
  return 'F'
}

/**
 * Validate that weights sum to 1.0 (within floating point tolerance)
 */
export function validateWeights(weights: ScoringWeights): boolean {
  const sum = Object.values(weights).reduce((a, b) => a + b, 0)
  return Math.abs(sum - 1.0) < 0.001
}

/**
 * Calculate a complete scorecard from raw input data.
 *
 * This is the main entry point. It takes verified input data and produces
 * a fully calculated scorecard with transparent breakdowns.
 */
export function calculateScorecard(
  input: ScoringInput,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): CalculatedScorecard {
  if (!validateWeights(weights)) {
    throw new Error(
      `Scoring weights must sum to 1.0. Current sum: ${Object.values(weights).reduce((a, b) => a + b, 0)}`
    )
  }

  const categoryScores: CategoryScore[] = [
    { ...calculateAttendanceScore(input.attendance), weight: weights[ScoreCategory.ATTENDANCE] },
    { ...calculateLegislationScore(input.legislation), weight: weights[ScoreCategory.LEGISLATION] },
    { ...calculateBipartisanshipScore(input.bipartisanship), weight: weights[ScoreCategory.BIPARTISANSHIP] },
    { ...calculateCommitteeWorkScore(input.committeeWork), weight: weights[ScoreCategory.COMMITTEE_WORK] },
    { ...calculateCivilityScore(input.civility), weight: weights[ScoreCategory.CIVILITY] },
    { ...calculateTheaterRatioScore(input.theaterRatio), weight: weights[ScoreCategory.THEATER_RATIO] },
  ]

  // Recalculate weighted scores with potentially custom weights
  for (const cs of categoryScores) {
    cs.weightedScore = round(cs.rawScore * cs.weight)
  }

  const totalScore = clamp(
    round(categoryScores.reduce((sum, cs) => sum + cs.weightedScore, 0)),
    0,
    100
  )

  return {
    bioguideId: input.bioguideId,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    totalScore,
    grade: scoreToGrade(totalScore),
    categoryScores,
    methodologyVersion: METHODOLOGY_VERSION,
    calculatedAt: new Date(),
  }
}
