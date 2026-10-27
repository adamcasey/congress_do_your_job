/**
 * Scorecard Scoring Types — Methodology v2
 *
 * Two transparent metrics grounded entirely in verifiable public records:
 *   1. Participation — vote attendance rate
 *   2. Civility — bipartisan legislative engagement
 */

export enum ScoreCategory {
  PARTICIPATION = "participation",
  CIVILITY = "civility",
}

export interface ParticipationData {
  votesParticipated: number;
  totalVotesSampled: number;
  totalVotesInSession: number;
  available: boolean; // false for Senate (data not yet integrated)
}

export interface CivilityData {
  crossPartyCosponsorships: number;  // other-party bills this member co-signed
  bipartisanBillsSponsored: number;  // own bills with at least one cross-party cosponsor
  totalCosponsorships: number;
  totalBillsSponsored: number;
}

export interface ScoringInput {
  bioguideId: string;
  chamber: "House" | "Senate";
  periodStart: Date;
  periodEnd: Date;
  participation: ParticipationData;
  civility: CivilityData;
}

export interface CategoryScoreDetails {
  description: string;
  inputs: Record<string, number | string>;
  formula: string;
}

export interface CategoryScore {
  category: ScoreCategory;
  rawScore: number;     // 0-100 before weighting
  weight: number;       // 0-1
  weightedScore: number;
  details: CategoryScoreDetails;
}

export interface CalculatedScorecard {
  bioguideId: string;
  chamber: "House" | "Senate";
  periodStart: Date;
  periodEnd: Date;
  totalScore: number;
  grade: ScorecardGrade;
  categoryScores: CategoryScore[];
  methodologyVersion: string;
  calculatedAt: Date;
}

export type ScorecardGrade = "A+" | "A" | "A-" | "B+" | "B" | "B-" | "C+" | "C" | "C-" | "D+" | "D" | "D-" | "F";

export type ScorecardPeriod = "weekly" | "monthly" | "quarterly" | "yearly" | "session";
