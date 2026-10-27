/**
 * Scorecard Calculator — Methodology v2
 *
 * Two scores, equal weight, both from public records:
 *   Participation (50%): roll-call vote attendance rate
 *   Civility (50%):      share of legislative activity that crosses party lines
 *
 * For Senate members, participation data is unavailable; civility carries 100%.
 */

import {
  ScoreCategory,
  ScoringInput,
  ParticipationData,
  CivilityData,
  CategoryScore,
  CalculatedScorecard,
  ScorecardGrade,
} from "@/types/scorecard";

export const METHODOLOGY_VERSION = "2.0.0";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function round(value: number, decimals: number = 1): number {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Participation score (0-100).
 * Simple rate: votes cast / votes sampled × 100.
 * Not Voting counts as a miss — showing up is the job.
 */
export function calculateParticipationScore(data: ParticipationData): CategoryScore {
  if (!data.available) {
    return {
      category: ScoreCategory.PARTICIPATION,
      rawScore: 0,
      weight: 0,
      weightedScore: 0,
      details: {
        description: "Senate roll-call vote data is not yet available from Congress.gov.",
        inputs: {},
        formula: "N/A",
      },
    };
  }

  const rawScore =
    data.totalVotesSampled > 0
      ? clamp(round((data.votesParticipated / data.totalVotesSampled) * 100), 0, 100)
      : 100; // no votes scheduled in period = no penalty

  return {
    category: ScoreCategory.PARTICIPATION,
    rawScore,
    weight: 0.5,
    weightedScore: round(rawScore * 0.5),
    details: {
      description:
        "Percentage of roll-call votes the member cast a position on (Yea, Nay, or Present). Not Voting counts as a miss.",
      inputs: {
        votesParticipated: data.votesParticipated,
        totalVotesSampled: data.totalVotesSampled,
        totalVotesInSession: data.totalVotesInSession,
      },
      formula: "votesParticipated / totalVotesSampled × 100",
    },
  };
}

/**
 * Civility / bipartisan engagement score (0-100).
 *
 * Counts the share of all legislative activity (sponsorships + co-sponsorships)
 * that crosses party lines. Scale: 40%+ bipartisan → 100.
 */
export function calculateCivilityScore(data: CivilityData): CategoryScore {
  const totalBipartisan = data.crossPartyCosponsorships + data.bipartisanBillsSponsored;
  const totalActivity = data.totalCosponsorships + data.totalBillsSponsored;

  const rawScore =
    totalActivity === 0
      ? 0
      : clamp(round((totalBipartisan / totalActivity) * 250), 0, 100);

  return {
    category: ScoreCategory.CIVILITY,
    rawScore,
    weight: 0.5,
    weightedScore: round(rawScore * 0.5),
    details: {
      description:
        "Share of legislative activity that crosses party lines. Bills co-sponsored across the aisle and own bills attracting cross-party co-sponsors both count.",
      inputs: {
        crossPartyCosponsorships: data.crossPartyCosponsorships,
        bipartisanBillsSponsored: data.bipartisanBillsSponsored,
        totalCosponsorships: data.totalCosponsorships,
        totalBillsSponsored: data.totalBillsSponsored,
      },
      formula:
        "min(100, (crossPartyCosponsorships + bipartisanBillsSponsored) / (totalCosponsorships + totalBillsSponsored) × 250)",
    },
  };
}

export function scoreToGrade(score: number): ScorecardGrade {
  if (score >= 97) return "A+";
  if (score >= 93) return "A";
  if (score >= 90) return "A-";
  if (score >= 87) return "B+";
  if (score >= 83) return "B";
  if (score >= 80) return "B-";
  if (score >= 77) return "C+";
  if (score >= 73) return "C";
  if (score >= 70) return "C-";
  if (score >= 67) return "D+";
  if (score >= 63) return "D";
  if (score >= 60) return "D-";
  return "F";
}

export function calculateScorecard(input: ScoringInput): CalculatedScorecard {
  const participation = calculateParticipationScore(input.participation);
  const civility = calculateCivilityScore(input.civility);

  let totalScore: number;
  if (!input.participation.available) {
    // Senate: civility carries full weight since participation is unavailable
    civility.weight = 1.0;
    civility.weightedScore = civility.rawScore;
    totalScore = civility.rawScore;
  } else {
    totalScore = clamp(round(participation.weightedScore + civility.weightedScore), 0, 100);
  }

  return {
    bioguideId: input.bioguideId,
    chamber: input.chamber,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    totalScore,
    grade: scoreToGrade(totalScore),
    categoryScores: [participation, civility],
    methodologyVersion: METHODOLOGY_VERSION,
    calculatedAt: new Date(),
  };
}
