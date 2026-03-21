import { describe, it, expect } from "vitest";
import {
  calculateAttendanceScore,
  calculateLegislationScore,
  calculateBipartisanshipScore,
  calculateCommitteeWorkScore,
  calculateCivilityScore,
  calculateTheaterRatioScore,
  calculateScorecard,
  scoreToGrade,
  validateWeights,
  DEFAULT_WEIGHTS,
  METHODOLOGY_VERSION,
} from "@/services/scorecard-calculator";
import { ScoreCategory, ScoringInput, ScoringWeights } from "@/types/scorecard";

// --- Helpers ---

function makeScoringInput(overrides: Partial<ScoringInput> = {}): ScoringInput {
  return {
    bioguideId: "T000123",
    periodStart: new Date("2025-01-01"),
    periodEnd: new Date("2025-03-31"),
    attendance: {
      totalVotes: 100,
      votesParticipated: 90,
      totalHearings: 20,
      hearingsAttended: 18,
    },
    legislation: {
      billsSponsored: 5,
      billsCosponsored: 12,
      billsAdvancedPastCommittee: 2,
      billsPassedChamber: 1,
      billsEnactedIntoLaw: 0,
      amendmentsProposed: 3,
      amendmentsAdopted: 1,
    },
    bipartisanship: {
      totalCosponsorships: 20,
      crossPartyCosponsorships: 8,
      bipartisanBillsSponsored: 2,
      totalBillsSponsored: 5,
    },
    committeeWork: {
      committeeMemberships: 3,
      hearingsAttended: 15,
      totalHearingsAvailable: 20,
      markupsParticipated: 4,
      totalMarkups: 6,
    },
    civility: {
      personalAttacksOnRecord: 0,
      censuresOrReprimands: 0,
      ethicsComplaintsFiled: 0,
      bipartisanCaucusMemberships: 2,
      crossAisleCosponsorships: 8,
    },
    theaterRatio: {
      legislativeActionsThisPeriod: 15,
      socialMediaPostCount: 20,
      mediaAppearanceCount: 3,
      pressConferencesNonLegislative: 1,
    },
    ...overrides,
  };
}

// --- Attendance ---

describe("calculateAttendanceScore", () => {
  it("calculates perfect attendance", () => {
    const result = calculateAttendanceScore({
      totalVotes: 50,
      votesParticipated: 50,
      totalHearings: 10,
      hearingsAttended: 10,
    });
    expect(result.rawScore).toBe(100);
    expect(result.category).toBe(ScoreCategory.ATTENDANCE);
  });

  it("calculates partial attendance", () => {
    const result = calculateAttendanceScore({
      totalVotes: 100,
      votesParticipated: 80,
      totalHearings: 20,
      hearingsAttended: 10,
    });
    // votes: 80% * 0.7 = 56, hearings: 50% * 0.3 = 15 → 71
    expect(result.rawScore).toBe(71);
  });

  it("scores 100 when no votes or hearings scheduled", () => {
    const result = calculateAttendanceScore({
      totalVotes: 0,
      votesParticipated: 0,
      totalHearings: 0,
      hearingsAttended: 0,
    });
    expect(result.rawScore).toBe(100);
  });

  it("handles zero attendance", () => {
    const result = calculateAttendanceScore({
      totalVotes: 100,
      votesParticipated: 0,
      totalHearings: 20,
      hearingsAttended: 0,
    });
    expect(result.rawScore).toBe(0);
  });

  it("includes formula in details", () => {
    const result = calculateAttendanceScore({
      totalVotes: 10,
      votesParticipated: 10,
      totalHearings: 5,
      hearingsAttended: 5,
    });
    expect(result.details.formula).toContain("voteParticipationRate");
  });
});

// --- Legislation ---

describe("calculateLegislationScore", () => {
  it("scores zero for no activity", () => {
    const result = calculateLegislationScore({
      billsSponsored: 0,
      billsCosponsored: 0,
      billsAdvancedPastCommittee: 0,
      billsPassedChamber: 0,
      billsEnactedIntoLaw: 0,
      amendmentsProposed: 0,
      amendmentsAdopted: 0,
    });
    expect(result.rawScore).toBe(0);
  });

  it("gives minimum floor of 10 for any activity", () => {
    const result = calculateLegislationScore({
      billsSponsored: 0,
      billsCosponsored: 1,
      billsAdvancedPastCommittee: 0,
      billsPassedChamber: 0,
      billsEnactedIntoLaw: 0,
      amendmentsProposed: 0,
      amendmentsAdopted: 0,
    });
    // 1 point → 25 * log2(2) = 25
    expect(result.rawScore).toBeGreaterThanOrEqual(10);
  });

  it("rewards enacted legislation heavily", () => {
    const withoutEnacted = calculateLegislationScore({
      billsSponsored: 2,
      billsCosponsored: 3,
      billsAdvancedPastCommittee: 0,
      billsPassedChamber: 0,
      billsEnactedIntoLaw: 0,
      amendmentsProposed: 1,
      amendmentsAdopted: 0,
    });
    const withEnacted = calculateLegislationScore({
      billsSponsored: 2,
      billsCosponsored: 3,
      billsAdvancedPastCommittee: 0,
      billsPassedChamber: 0,
      billsEnactedIntoLaw: 2,
      amendmentsProposed: 1,
      amendmentsAdopted: 0,
    });
    expect(withEnacted.rawScore).toBeGreaterThan(withoutEnacted.rawScore);
  });

  it("caps at 100", () => {
    const result = calculateLegislationScore({
      billsSponsored: 50,
      billsCosponsored: 200,
      billsAdvancedPastCommittee: 20,
      billsPassedChamber: 10,
      billsEnactedIntoLaw: 5,
      amendmentsProposed: 30,
      amendmentsAdopted: 15,
    });
    expect(result.rawScore).toBeLessThanOrEqual(100);
  });

  it("uses logarithmic scale to prevent bulk cosponsorship gaming", () => {
    const modest = calculateLegislationScore({
      billsSponsored: 0,
      billsCosponsored: 10,
      billsAdvancedPastCommittee: 0,
      billsPassedChamber: 0,
      billsEnactedIntoLaw: 0,
      amendmentsProposed: 0,
      amendmentsAdopted: 0,
    });
    const bulk = calculateLegislationScore({
      billsSponsored: 0,
      billsCosponsored: 100,
      billsAdvancedPastCommittee: 0,
      billsPassedChamber: 0,
      billsEnactedIntoLaw: 0,
      amendmentsProposed: 0,
      amendmentsAdopted: 0,
    });
    // 10x more cosponsorships should NOT yield 10x higher score
    expect(bulk.rawScore / modest.rawScore).toBeLessThan(3);
  });
});

// --- Bipartisanship ---

describe("calculateBipartisanshipScore", () => {
  it("scores high for fully bipartisan record", () => {
    const result = calculateBipartisanshipScore({
      totalCosponsorships: 20,
      crossPartyCosponsorships: 20,
      bipartisanBillsSponsored: 5,
      totalBillsSponsored: 5,
    });
    expect(result.rawScore).toBe(100);
  });

  it("scores 50 (neutral) with no data", () => {
    const result = calculateBipartisanshipScore({
      totalCosponsorships: 0,
      crossPartyCosponsorships: 0,
      bipartisanBillsSponsored: 0,
      totalBillsSponsored: 0,
    });
    expect(result.rawScore).toBe(50);
  });

  it("penalizes purely partisan behavior", () => {
    const result = calculateBipartisanshipScore({
      totalCosponsorships: 30,
      crossPartyCosponsorships: 0,
      bipartisanBillsSponsored: 0,
      totalBillsSponsored: 10,
    });
    expect(result.rawScore).toBe(0);
  });
});

// --- Committee Work ---

describe("calculateCommitteeWorkScore", () => {
  it("rewards active committee participation", () => {
    const result = calculateCommitteeWorkScore({
      committeeMemberships: 3,
      hearingsAttended: 18,
      totalHearingsAvailable: 20,
      markupsParticipated: 5,
      totalMarkups: 6,
    });
    expect(result.rawScore).toBeGreaterThan(80);
  });

  it("caps committee membership bonus at 10", () => {
    const manyCommittees = calculateCommitteeWorkScore({
      committeeMemberships: 10,
      hearingsAttended: 10,
      totalHearingsAvailable: 20,
      markupsParticipated: 3,
      totalMarkups: 6,
    });
    const maxedCommittees = calculateCommitteeWorkScore({
      committeeMemberships: 4, // 4*3=12, capped at 10
      hearingsAttended: 10,
      totalHearingsAvailable: 20,
      markupsParticipated: 3,
      totalMarkups: 6,
    });
    // Both should have the same committee bonus (capped at 10)
    expect(manyCommittees.rawScore).toBe(maxedCommittees.rawScore);
  });
});

// --- Civility ---

describe("calculateCivilityScore", () => {
  it("starts at baseline of 80 with no data", () => {
    const result = calculateCivilityScore({
      personalAttacksOnRecord: 0,
      censuresOrReprimands: 0,
      ethicsComplaintsFiled: 0,
      bipartisanCaucusMemberships: 0,
      crossAisleCosponsorships: 0,
    });
    expect(result.rawScore).toBe(80);
  });

  it("deducts heavily for censures", () => {
    const result = calculateCivilityScore({
      personalAttacksOnRecord: 0,
      censuresOrReprimands: 1,
      ethicsComplaintsFiled: 0,
      bipartisanCaucusMemberships: 0,
      crossAisleCosponsorships: 0,
    });
    expect(result.rawScore).toBe(55);
  });

  it("adds bonuses for bipartisan engagement", () => {
    const result = calculateCivilityScore({
      personalAttacksOnRecord: 0,
      censuresOrReprimands: 0,
      ethicsComplaintsFiled: 0,
      bipartisanCaucusMemberships: 3,
      crossAisleCosponsorships: 25,
    });
    // 80 + 15 (capped) + 5 = 100
    expect(result.rawScore).toBe(100);
  });

  it("floors at zero for extreme incivility", () => {
    const result = calculateCivilityScore({
      personalAttacksOnRecord: 5,
      censuresOrReprimands: 2,
      ethicsComplaintsFiled: 3,
      bipartisanCaucusMemberships: 0,
      crossAisleCosponsorships: 0,
    });
    expect(result.rawScore).toBe(0);
  });
});

// --- Theater Ratio ---

describe("calculateTheaterRatioScore", () => {
  it("scores high for more work than theater", () => {
    const result = calculateTheaterRatioScore({
      legislativeActionsThisPeriod: 30,
      socialMediaPostCount: 10,
      mediaAppearanceCount: 2,
      pressConferencesNonLegislative: 0,
    });
    expect(result.rawScore).toBeGreaterThanOrEqual(90);
  });

  it("scores neutral (50) with no activity at all", () => {
    const result = calculateTheaterRatioScore({
      legislativeActionsThisPeriod: 0,
      socialMediaPostCount: 0,
      mediaAppearanceCount: 0,
      pressConferencesNonLegislative: 0,
    });
    expect(result.rawScore).toBe(50);
  });

  it("punishes all-theater-no-work pattern", () => {
    const result = calculateTheaterRatioScore({
      legislativeActionsThisPeriod: 0,
      socialMediaPostCount: 100,
      mediaAppearanceCount: 10,
      pressConferencesNonLegislative: 5,
    });
    expect(result.rawScore).toBeLessThan(10);
  });

  it("considers balanced approach acceptable", () => {
    const result = calculateTheaterRatioScore({
      legislativeActionsThisPeriod: 10,
      socialMediaPostCount: 15,
      mediaAppearanceCount: 3,
      pressConferencesNonLegislative: 1,
    });
    // ratio ≈ 10/20 = 0.5 → should be in 70-89 range
    expect(result.rawScore).toBeGreaterThanOrEqual(70);
  });
});

// --- Grade Mapping ---

describe("scoreToGrade", () => {
  it("maps scores to correct grades", () => {
    expect(scoreToGrade(100)).toBe("A+");
    expect(scoreToGrade(97)).toBe("A+");
    expect(scoreToGrade(95)).toBe("A");
    expect(scoreToGrade(91)).toBe("A-");
    expect(scoreToGrade(85)).toBe("B");
    expect(scoreToGrade(77)).toBe("C+");
    expect(scoreToGrade(75)).toBe("C");
    expect(scoreToGrade(65)).toBe("D");
    expect(scoreToGrade(55)).toBe("F");
    expect(scoreToGrade(0)).toBe("F");
  });
});

// --- Weight Validation ---

describe("validateWeights", () => {
  it("accepts default weights", () => {
    expect(validateWeights(DEFAULT_WEIGHTS)).toBe(true);
  });

  it("rejects weights that do not sum to 1.0", () => {
    const badWeights: ScoringWeights = {
      ...DEFAULT_WEIGHTS,
      [ScoreCategory.ATTENDANCE]: 0.5, // pushes sum over 1.0
    };
    expect(validateWeights(badWeights)).toBe(false);
  });
});

// --- Full Scorecard Calculation ---

describe("calculateScorecard", () => {
  it("produces a complete scorecard with all categories", () => {
    const input = makeScoringInput();
    const scorecard = calculateScorecard(input);

    expect(scorecard.bioguideId).toBe("T000123");
    expect(scorecard.totalScore).toBeGreaterThanOrEqual(0);
    expect(scorecard.totalScore).toBeLessThanOrEqual(100);
    expect(scorecard.categoryScores).toHaveLength(6);
    expect(scorecard.methodologyVersion).toBe(METHODOLOGY_VERSION);
    expect(scorecard.grade).toBeDefined();
    expect(scorecard.calculatedAt).toBeInstanceOf(Date);
  });

  it("total score is sum of weighted category scores", () => {
    const input = makeScoringInput();
    const scorecard = calculateScorecard(input);

    const manualSum = scorecard.categoryScores.reduce((sum, cs) => sum + cs.weightedScore, 0);
    // Allow small rounding difference
    expect(Math.abs(scorecard.totalScore - manualSum)).toBeLessThan(1);
  });

  it("throws on invalid weights", () => {
    const input = makeScoringInput();
    const badWeights: ScoringWeights = {
      ...DEFAULT_WEIGHTS,
      [ScoreCategory.ATTENDANCE]: 0.99,
    };
    expect(() => calculateScorecard(input, badWeights)).toThrow("must sum to 1.0");
  });

  it("accepts custom weights", () => {
    const input = makeScoringInput();
    const customWeights: ScoringWeights = {
      [ScoreCategory.ATTENDANCE]: 0.3,
      [ScoreCategory.LEGISLATION]: 0.3,
      [ScoreCategory.BIPARTISANSHIP]: 0.1,
      [ScoreCategory.COMMITTEE_WORK]: 0.1,
      [ScoreCategory.CIVILITY]: 0.1,
      [ScoreCategory.THEATER_RATIO]: 0.1,
    };
    const scorecard = calculateScorecard(input, customWeights);
    expect(scorecard.totalScore).toBeGreaterThanOrEqual(0);
    expect(scorecard.totalScore).toBeLessThanOrEqual(100);
  });

  it("produces different scores for different members", () => {
    const hardWorker = makeScoringInput({
      attendance: { totalVotes: 100, votesParticipated: 98, totalHearings: 20, hearingsAttended: 19 },
      theaterRatio: {
        legislativeActionsThisPeriod: 25,
        socialMediaPostCount: 5,
        mediaAppearanceCount: 1,
        pressConferencesNonLegislative: 0,
      },
    });
    const showboat = makeScoringInput({
      attendance: { totalVotes: 100, votesParticipated: 40, totalHearings: 20, hearingsAttended: 5 },
      theaterRatio: {
        legislativeActionsThisPeriod: 2,
        socialMediaPostCount: 200,
        mediaAppearanceCount: 15,
        pressConferencesNonLegislative: 8,
      },
    });

    const hardWorkerCard = calculateScorecard(hardWorker);
    const showboatCard = calculateScorecard(showboat);

    expect(hardWorkerCard.totalScore).toBeGreaterThan(showboatCard.totalScore);
  });

  it("each category score has transparent details", () => {
    const scorecard = calculateScorecard(makeScoringInput());
    for (const cs of scorecard.categoryScores) {
      expect(cs.details.description).toBeTruthy();
      expect(cs.details.formula).toBeTruthy();
      expect(Object.keys(cs.details.inputs).length).toBeGreaterThan(0);
    }
  });
});
