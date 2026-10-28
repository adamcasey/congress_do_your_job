import { describe, it, expect } from "vitest";
import {
  calculateParticipationScore,
  calculateCivilityScore,
  calculateScorecard,
  scoreToGrade,
} from "@/services/scorecard-calculator";
import { ScoreCategory } from "@/types/scorecard";

describe("calculateParticipationScore", () => {
  it("perfect attendance scores 100", () => {
    const s = calculateParticipationScore({
      votesParticipated: 50,
      totalVotesSampled: 50,
      totalVotesInSession: 400,
      available: true,
    });
    expect(s.rawScore).toBe(100);
    expect(s.category).toBe(ScoreCategory.PARTICIPATION);
  });

  it("missing half the votes scores 50", () => {
    const s = calculateParticipationScore({
      votesParticipated: 25,
      totalVotesSampled: 50,
      totalVotesInSession: 400,
      available: true,
    });
    expect(s.rawScore).toBe(50);
  });

  it("unavailable data scores 0 with weight 0", () => {
    const s = calculateParticipationScore({
      votesParticipated: 0,
      totalVotesSampled: 0,
      totalVotesInSession: 0,
      available: false,
    });
    expect(s.rawScore).toBe(0);
    expect(s.weight).toBe(0);
    expect(s.weightedScore).toBe(0);
  });

  it("no votes scheduled does not penalize", () => {
    const s = calculateParticipationScore({
      votesParticipated: 0,
      totalVotesSampled: 0,
      totalVotesInSession: 0,
      available: true,
    });
    expect(s.rawScore).toBe(100);
  });
});

describe("calculateCivilityScore", () => {
  it("zero bipartisan activity scores 0", () => {
    const s = calculateCivilityScore({
      crossPartyCosponsorships: 0,
      bipartisanBillsSponsored: 0,
      totalCosponsorships: 100,
      totalBillsSponsored: 20,
    });
    expect(s.rawScore).toBe(0);
  });

  it("40% bipartisan engagement scores 100", () => {
    const s = calculateCivilityScore({
      crossPartyCosponsorships: 40,
      bipartisanBillsSponsored: 8,
      totalCosponsorships: 100,
      totalBillsSponsored: 20,
    });
    // 48 bipartisan / 120 total = 40% → 40 * 250 / 100 = 100
    expect(s.rawScore).toBe(100);
  });

  it("no legislative activity at all scores 0", () => {
    const s = calculateCivilityScore({
      crossPartyCosponsorships: 0,
      bipartisanBillsSponsored: 0,
      totalCosponsorships: 0,
      totalBillsSponsored: 0,
    });
    expect(s.rawScore).toBe(0);
  });

  it("score is capped at 100", () => {
    const s = calculateCivilityScore({
      crossPartyCosponsorships: 100,
      bipartisanBillsSponsored: 10,
      totalCosponsorships: 100,
      totalBillsSponsored: 10,
    });
    expect(s.rawScore).toBe(100);
  });
});

describe("calculateScorecard", () => {
  it("House member: total is average of both scores", () => {
    const sc = calculateScorecard({
      bioguideId: "T000001",
      chamber: "House",
      periodStart: new Date("2025-01-03"),
      periodEnd: new Date("2025-10-01"),
      participation: { votesParticipated: 50, totalVotesSampled: 50, totalVotesInSession: 400, available: true },
      civility: {
        crossPartyCosponsorships: 20,
        bipartisanBillsSponsored: 4,
        totalCosponsorships: 100,
        totalBillsSponsored: 20,
      },
    });
    // participation = 100, civility = 24/120 * 250 = 50 → total = (50 + 25) = 75
    expect(sc.totalScore).toBe(75);
    expect(sc.chamber).toBe("House");
  });

  it("Senate member: civility carries full weight", () => {
    const sc = calculateScorecard({
      bioguideId: "W000001",
      chamber: "Senate",
      periodStart: new Date("2025-01-03"),
      periodEnd: new Date("2025-10-01"),
      participation: { votesParticipated: 0, totalVotesSampled: 0, totalVotesInSession: 0, available: false },
      civility: {
        crossPartyCosponsorships: 20,
        bipartisanBillsSponsored: 4,
        totalCosponsorships: 100,
        totalBillsSponsored: 20,
      },
    });
    const civilityRaw = Math.round((24 / 120) * 250 * 10) / 10; // 50
    expect(sc.totalScore).toBe(civilityRaw);
    expect(sc.chamber).toBe("Senate");
    const civScore = sc.categoryScores.find((c) => c.category === ScoreCategory.CIVILITY)!;
    expect(civScore.weight).toBe(1.0);
  });

  it("House member with failed vote fetch uses House weighting, not Senate", () => {
    // Before the fix, available:false caused civility to get weight 1.0 regardless of chamber.
    const sc = calculateScorecard({
      bioguideId: "H000001",
      chamber: "House",
      periodStart: new Date("2025-01-03"),
      periodEnd: new Date("2025-10-01"),
      participation: { votesParticipated: 0, totalVotesSampled: 0, totalVotesInSession: 0, available: false },
      civility: {
        crossPartyCosponsorships: 20,
        bipartisanBillsSponsored: 4,
        totalCosponsorships: 100,
        totalBillsSponsored: 20,
      },
    });
    const civScore = sc.categoryScores.find((c) => c.category === ScoreCategory.CIVILITY)!;
    // House: civility stays at weight 0.5 (50/50 split), NOT 1.0 like Senate
    expect(civScore.weight).toBe(0.5);
  });

  it("grade corresponds to score", () => {
    expect(scoreToGrade(100)).toBe("A+");
    expect(scoreToGrade(77)).toBe("C+");
    expect(scoreToGrade(59)).toBe("F");
  });
});
