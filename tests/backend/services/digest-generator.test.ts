import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Hoisted mocks ---

const {
  mockGetBills,
  mockGetOrCreateBillSummary,
  mockFindFirst,
  mockDeleteMany,
  mockCreate,
  mockUpdate,
  mockCount,
} = vi.hoisted(() => ({
  mockGetBills: vi.fn(),
  mockGetOrCreateBillSummary: vi.fn(),
  mockFindFirst: vi.fn(),
  mockDeleteMany: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
  mockCount: vi.fn(),
}));

vi.mock("@/lib/congress-api", () => ({
  getBills: mockGetBills,
}));

vi.mock("@/services/bill-summary", () => ({
  getOrCreateBillSummary: mockGetOrCreateBillSummary,
}));

vi.mock("@/lib/db", () => ({
  prismaClient: {
    digestEdition: {
      findFirst: mockFindFirst,
      deleteMany: mockDeleteMany,
      create: mockCreate,
      update: mockUpdate,
      count: mockCount,
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { generateWeeklyDigest, getMostRecentMonday } from "@/services/digest-generator";

// --- Fixtures ---

const NOW = new Date("2026-03-02T15:00:00Z"); // A Monday afternoon

const SAMPLE_BILL = {
  number: "100",
  type: "HR" as const,
  congress: 119,
  originChamber: "House" as const,
  introducedDate: "2026-02-26",
  updateDate: "2026-03-01",
  updateDateIncludingText: "2026-03-01",
  title: "A bill to improve infrastructure",
  url: "https://congress.gov/bill/119th-congress/house-bill/100",
  latestAction: { actionDate: "2026-03-01", text: "Referred to Committee." },
};

// --- Tests ---

describe("getMostRecentMonday", () => {
  it("returns the same day when input is a Monday at midnight UTC", () => {
    const monday = new Date("2026-03-02T00:00:00Z"); // Monday
    const result = getMostRecentMonday(monday);
    expect(result.getUTCDay()).toBe(1);
    expect(result.toISOString()).toBe("2026-03-02T00:00:00.000Z");
  });

  it("steps back to last Monday from a Wednesday", () => {
    const wednesday = new Date("2026-03-04T10:00:00Z");
    const result = getMostRecentMonday(wednesday);
    expect(result.toISOString()).toBe("2026-03-02T00:00:00.000Z");
  });

  it("steps back 6 days from a Sunday", () => {
    const sunday = new Date("2026-03-08T10:00:00Z");
    const result = getMostRecentMonday(sunday);
    expect(result.toISOString()).toBe("2026-03-02T00:00:00.000Z");
  });
});

describe("generateWeeklyDigest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns existing published edition without refetching data", async () => {
    const publishedEdition = {
      id: "existing-id",
      editionNumber: 3,
      weekStart: new Date("2026-03-02T00:00:00Z"),
      weekEnd: new Date("2026-03-02T15:00:00Z"),
      headline: "Existing Headline",
      summary: "Existing summary.",
      status: "published",
      sections: [
        { sectionType: "stats", items: [{ billsIntroduced: 2, billsWithRecentAction: 5 }] },
        { sectionType: "bills", items: [] },
      ],
    };
    mockFindFirst.mockResolvedValue(publishedEdition);

    const result = await generateWeeklyDigest(NOW);

    expect(result.editionId).toBe("existing-id");
    expect(result.editionNumber).toBe(3);
    expect(mockGetBills).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("generates a new digest when no published edition exists this week", async () => {
    mockFindFirst.mockResolvedValue(null);
    mockDeleteMany.mockResolvedValue({ count: 0 });
    mockGetBills.mockResolvedValue({
      bills: [{ ...SAMPLE_BILL }],
      pagination: { count: 1 },
    });
    mockGetOrCreateBillSummary.mockResolvedValue({
      summary: "AI-generated summary of infrastructure bill.",
      source: "generated",
      generatedAt: new Date(),
    });
    mockCount.mockResolvedValue(2); // 2 existing editions → this becomes #3
    mockCreate.mockResolvedValue({ id: "new-edition-id", editionNumber: 3 });

    const result = await generateWeeklyDigest(NOW);

    expect(result.editionNumber).toBe(3);
    expect(result.featuredBills).toHaveLength(1);
    expect(result.featuredBills[0].summary).toBe("AI-generated summary of infrastructure bill.");
    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it("counts bills introduced within the week correctly", async () => {
    mockFindFirst.mockResolvedValue(null);
    mockDeleteMany.mockResolvedValue({ count: 0 });

    // One bill introduced this week (Mar 2 = the Monday), one from before
    mockGetBills.mockResolvedValue({
      bills: [
        { ...SAMPLE_BILL, introducedDate: "2026-03-02" }, // same day as weekStart — this week
        { ...SAMPLE_BILL, number: "101", introducedDate: "2026-02-10" }, // before weekStart
      ],
      pagination: { count: 2 },
    });
    mockGetOrCreateBillSummary.mockResolvedValue({
      summary: "Summary.",
      source: "generated",
      generatedAt: new Date(),
    });
    mockCount.mockResolvedValue(0);
    mockCreate.mockResolvedValue({ id: "new-id", editionNumber: 1 });

    const result = await generateWeeklyDigest(NOW);

    expect(result.stats.billsIntroduced).toBe(1);
    expect(result.stats.billsWithRecentAction).toBe(2);
  });

  it("skips bills with unavailable summaries from featured list", async () => {
    mockFindFirst.mockResolvedValue(null);
    mockDeleteMany.mockResolvedValue({ count: 0 });
    mockGetBills.mockResolvedValue({
      bills: [SAMPLE_BILL],
      pagination: { count: 1 },
    });
    mockGetOrCreateBillSummary.mockResolvedValue({
      summary: "Summary not yet available for this legislation.",
      source: "fallback",
      generatedAt: new Date(),
    });
    mockCount.mockResolvedValue(0);
    mockCreate.mockResolvedValue({ id: "new-id", editionNumber: 1 });

    const result = await generateWeeklyDigest(NOW);

    expect(result.featuredBills).toHaveLength(0);
  });

  it("handles empty bill list gracefully", async () => {
    mockFindFirst.mockResolvedValue(null);
    mockDeleteMany.mockResolvedValue({ count: 0 });
    mockGetBills.mockResolvedValue({ bills: [], pagination: { count: 0 } });
    mockCount.mockResolvedValue(0);
    mockCreate.mockResolvedValue({ id: "new-id", editionNumber: 1 });

    const result = await generateWeeklyDigest(NOW);

    expect(result.featuredBills).toHaveLength(0);
    expect(result.stats.billsIntroduced).toBe(0);
    expect(result.stats.billsWithRecentAction).toBe(0);
    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it("deletes stale draft before creating new edition", async () => {
    mockFindFirst.mockResolvedValue(null);
    mockDeleteMany.mockResolvedValue({ count: 1 });
    mockGetBills.mockResolvedValue({ bills: [], pagination: { count: 0 } });
    mockCount.mockResolvedValue(0);
    mockCreate.mockResolvedValue({ id: "new-id", editionNumber: 1 });

    await generateWeeklyDigest(NOW);

    expect(mockDeleteMany).toHaveBeenCalledWith({
      where: { weekStart: expect.any(Date), status: "draft" },
    });
  });

  it("caps featured bills at 5 even when more are available", async () => {
    mockFindFirst.mockResolvedValue(null);
    mockDeleteMany.mockResolvedValue({ count: 0 });

    const manyBills = Array.from({ length: 8 }, (_, i) => ({
      ...SAMPLE_BILL,
      number: String(i + 100),
    }));
    mockGetBills.mockResolvedValue({ bills: manyBills, pagination: { count: 8 } });
    mockGetOrCreateBillSummary.mockResolvedValue({
      summary: "A summary.",
      source: "generated",
      generatedAt: new Date(),
    });
    mockCount.mockResolvedValue(0);
    mockCreate.mockResolvedValue({ id: "new-id", editionNumber: 1 });

    const result = await generateWeeklyDigest(NOW);

    expect(result.featuredBills).toHaveLength(5);
  });

  it("continues past a bill that throws during summary generation", async () => {
    mockFindFirst.mockResolvedValue(null);
    mockDeleteMany.mockResolvedValue({ count: 0 });

    const bills = [
      { ...SAMPLE_BILL, number: "200" },
      { ...SAMPLE_BILL, number: "201" },
    ];
    mockGetBills.mockResolvedValue({ bills, pagination: { count: 2 } });

    mockGetOrCreateBillSummary
      .mockRejectedValueOnce(new Error("API timeout"))
      .mockResolvedValueOnce({ summary: "Good summary.", source: "generated", generatedAt: new Date() });

    mockCount.mockResolvedValue(0);
    mockCreate.mockResolvedValue({ id: "new-id", editionNumber: 1 });

    const result = await generateWeeklyDigest(NOW);

    // Only the second bill should appear (first threw)
    expect(result.featuredBills).toHaveLength(1);
    expect(result.featuredBills[0].summary).toBe("Good summary.");
  });

  it("persists digest as draft with correct section structure", async () => {
    mockFindFirst.mockResolvedValue(null);
    mockDeleteMany.mockResolvedValue({ count: 0 });
    mockGetBills.mockResolvedValue({ bills: [], pagination: { count: 0 } });
    mockCount.mockResolvedValue(4);
    mockCreate.mockResolvedValue({ id: "new-id", editionNumber: 5 });

    await generateWeeklyDigest(NOW);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          editionNumber: 5,
          status: "draft",
          sections: expect.arrayContaining([
            expect.objectContaining({ sectionType: "stats", order: 1 }),
            expect.objectContaining({ sectionType: "bills", order: 2 }),
          ]),
        }),
      }),
    );
  });
});
