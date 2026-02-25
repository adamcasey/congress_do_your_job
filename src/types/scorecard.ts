/**
 * Scorecard Scoring Types
 *
 * Types for the Civility & Productivity Scorecard system.
 * All scoring methodology is version-controlled and publicly documented.
 */

// Score categories that make up the overall 0-100 score
export enum ScoreCategory {
  ATTENDANCE = 'attendance',
  LEGISLATION = 'legislation',
  BIPARTISANSHIP = 'bipartisanship',
  COMMITTEE_WORK = 'committee_work',
  CIVILITY = 'civility',
  THEATER_RATIO = 'theater_ratio',
}

// Weights for each category (must sum to 1.0)
export interface ScoringWeights {
  [ScoreCategory.ATTENDANCE]: number
  [ScoreCategory.LEGISLATION]: number
  [ScoreCategory.BIPARTISANSHIP]: number
  [ScoreCategory.COMMITTEE_WORK]: number
  [ScoreCategory.CIVILITY]: number
  [ScoreCategory.THEATER_RATIO]: number
}

// Raw input data used to calculate scores
export interface ScoringInput {
  bioguideId: string
  periodStart: Date
  periodEnd: Date

  attendance: AttendanceData
  legislation: LegislationData
  bipartisanship: BipartisanshipData
  committeeWork: CommitteeWorkData
  civility: CivilityData
  theaterRatio: TheaterRatioData
}

export interface AttendanceData {
  totalVotes: number
  votesParticipated: number
  totalHearings: number
  hearingsAttended: number
}

export interface LegislationData {
  billsSponsored: number
  billsCosponsored: number
  billsAdvancedPastCommittee: number
  billsPassedChamber: number
  billsEnactedIntoLaw: number
  amendmentsProposed: number
  amendmentsAdopted: number
}

export interface BipartisanshipData {
  totalCosponsorships: number
  crossPartyCosponsorships: number
  bipartisanBillsSponsored: number
  totalBillsSponsored: number
}

export interface CommitteeWorkData {
  committeeMemberships: number
  hearingsAttended: number
  totalHearingsAvailable: number
  markupsParticipated: number
  totalMarkups: number
}

export interface CivilityData {
  // Verified infractions from Congressional Record or official proceedings
  personalAttacksOnRecord: number
  censuresOrReprimands: number
  ethicsComplaintsFiled: number
  // Positive civility signals
  bipartisanCaucusMemberships: number
  crossAisleCosponsorships: number
}

export interface TheaterRatioData {
  // Legislative work (The Job)
  legislativeActionsThisPeriod: number
  // Media/theater activity
  socialMediaPostCount: number
  mediaAppearanceCount: number
  pressConferencesNonLegislative: number
}

// Calculated score for a single category
export interface CategoryScore {
  category: ScoreCategory
  rawScore: number     // 0-100 before weighting
  weight: number       // 0-1 weight factor
  weightedScore: number // rawScore * weight
  details: CategoryScoreDetails
}

// Breakdown of how a category score was calculated
export interface CategoryScoreDetails {
  description: string
  inputs: Record<string, number>
  formula: string
}

// Final calculated scorecard
export interface CalculatedScorecard {
  bioguideId: string
  periodStart: Date
  periodEnd: Date
  totalScore: number           // 0-100
  grade: ScorecardGrade
  categoryScores: CategoryScore[]
  methodologyVersion: string
  calculatedAt: Date
}

// Letter grades for display
export type ScorecardGrade = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D+' | 'D' | 'D-' | 'F'

// Period types for scorecard calculation
export type ScorecardPeriod = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'session'
