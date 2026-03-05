import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Hoisted mocks ---

const { mockGetBill, mockGetBillSummaries, mockSummarizeBill, mockFindUnique, mockCreate } = vi.hoisted(() => ({
  mockGetBill: vi.fn(),
  mockGetBillSummaries: vi.fn(),
  mockSummarizeBill: vi.fn(),
  mockFindUnique: vi.fn(),
  mockCreate: vi.fn(),
}));

vi.mock("@/lib/congress-api", () => ({
  getBill: mockGetBill,
  getBillSummaries: mockGetBillSummaries,
}));

vi.mock("@/lib/gemini-api", () => ({
  summarizeBill: mockSummarizeBill,
}));

vi.mock("@/lib/db", () => ({
  prismaClient: {
    billSummary: {
      findUnique: mockFindUnique,
      create: mockCreate,
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

import { getOrCreateBillSummary } from "@/services/bill-summary";

// --- Fixtures ---

const BASE_BILL = {
  number: "1",
  type: "HR" as const,
  congress: 119,
  originChamber: "House" as const,
  introducedDate: "2025-01-15",
  updateDate: "2025-03-01",
  updateDateIncludingText: "2025-03-01",
  title: "A bill to do something important",
  url: "https://congress.gov/bill/119th-congress/house-bill/1",
  policyArea: { name: "Agriculture and Food" },
  latestAction: { actionDate: "2025-02-01", text: "Referred to the Committee on Agriculture." },
  sponsors: [{ bioguideId: "A000001", fullName: "Rep. Jane Smith", firstName: "Jane", lastName: "Smith", party: "D", state: "CA", url: "" }],
};

const CRS_SUMMARY = {
  versionCode: "00",
  actionDate: "2025-01-15",
  actionDesc: "Introduced in House",
  updateDate: "2025-01-20",
  text: "<p>This bill <b>establishes</b> a new grant program for farmers.</p>",
};

const CRS_SUMMARY_ADVANCED = {
  versionCode: "36",
  actionDate: "2025-02-20",
  actionDesc: "Passed Senate",
  updateDate: "2025-02-25",
  text: "<p>This bill <b>establishes</b> a comprehensive grant program for small family farmers in rural areas.</p>",
};

// --- Tests ---

describe("getOrCreateBillSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns cached DB summary without calling external services", async () => {
    mockFindUnique.mockResolvedValue({
      summary: "Cached summary from DB",
      generatedAt: new Date("2025-01-01"),
    });

    const result = await getOrCreateBillSummary("HR", "1", 119);

    expect(result.source).toBe("database");
    expect(result.summary).toBe("Cached summary from DB");
    expect(mockGetBill).not.toHaveBeenCalled();
    expect(mockSummarizeBill).not.toHaveBeenCalled();
  });

  it("fetches dedicated summaries endpoint and uses its text for AI", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockGetBill.mockResolvedValue({ ...BASE_BILL, summaries: [] });
    mockGetBillSummaries.mockResolvedValue({ summaries: [CRS_SUMMARY] });
    mockSummarizeBill.mockResolvedValue("AI-generated summary.");
    mockCreate.mockResolvedValue({});

    const result = await getOrCreateBillSummary("HR", "1", 119);

    expect(result.source).toBe("generated");
    expect(result.summary).toBe("AI-generated summary.");
    // The AI should receive clean text (HTML stripped)
    expect(mockSummarizeBill).toHaveBeenCalledWith(
      expect.objectContaining({
        billText: "This bill establishes a new grant program for farmers.",
      }),
    );
  });

  it("selects the most advanced CRS summary (highest versionCode)", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockGetBill.mockResolvedValue({ ...BASE_BILL, summaries: [CRS_SUMMARY] });
    mockGetBillSummaries.mockResolvedValue({
      summaries: [CRS_SUMMARY, CRS_SUMMARY_ADVANCED],
    });
    mockSummarizeBill.mockResolvedValue("Advanced AI summary.");
    mockCreate.mockResolvedValue({});

    await getOrCreateBillSummary("HR", "1", 119);

    expect(mockSummarizeBill).toHaveBeenCalledWith(
      expect.objectContaining({
        billText: expect.stringContaining("comprehensive grant program"),
      }),
    );
  });

  it("passes bill metadata to AI for richer context", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockGetBill.mockResolvedValue({ ...BASE_BILL, summaries: [] });
    mockGetBillSummaries.mockResolvedValue({ summaries: [CRS_SUMMARY] });
    mockSummarizeBill.mockResolvedValue("Summary with metadata.");
    mockCreate.mockResolvedValue({});

    await getOrCreateBillSummary("HR", "1", 119);

    expect(mockSummarizeBill).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          chamber: "House",
          policyArea: "Agriculture and Food",
          latestAction: "Referred to the Committee on Agriculture.",
          introducedDate: "2025-01-15",
        }),
      }),
    );
  });

  it("falls back to embedded bill summaries when summaries endpoint fails", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockGetBill.mockResolvedValue({ ...BASE_BILL, summaries: [CRS_SUMMARY] });
    mockGetBillSummaries.mockRejectedValue(new Error("404 not found"));
    mockSummarizeBill.mockResolvedValue("Fallback endpoint AI summary.");
    mockCreate.mockResolvedValue({});

    const result = await getOrCreateBillSummary("HR", "1", 119);

    expect(result.source).toBe("generated");
    // Should still call AI with the embedded summary
    expect(mockSummarizeBill).toHaveBeenCalledWith(
      expect.objectContaining({
        billText: "This bill establishes a new grant program for farmers.",
      }),
    );
  });

  it("uses bill title as last-resort text when no summaries exist", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockGetBill.mockResolvedValue({ ...BASE_BILL, summaries: [] });
    mockGetBillSummaries.mockResolvedValue({ summaries: [] });
    mockSummarizeBill.mockResolvedValue("Title-based AI summary.");
    mockCreate.mockResolvedValue({});

    const result = await getOrCreateBillSummary("HR", "1", 119);

    expect(result.source).toBe("generated");
    expect(mockSummarizeBill).toHaveBeenCalledWith(
      expect.objectContaining({
        billText: BASE_BILL.title,
        billTitle: BASE_BILL.title,
      }),
    );
  });

  it("returns fallback without persisting when both text and title are absent", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockGetBill.mockResolvedValue({ ...BASE_BILL, title: "", summaries: [] });
    mockGetBillSummaries.mockResolvedValue({ summaries: [] });

    const result = await getOrCreateBillSummary("HR", "1", 119);

    expect(result.source).toBe("fallback");
    expect(result.summary).toBe("Summary not yet available for this legislation.");
    expect(mockSummarizeBill).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns fallback without persisting when AI call fails", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockGetBill.mockResolvedValue({ ...BASE_BILL, summaries: [] });
    mockGetBillSummaries.mockResolvedValue({ summaries: [CRS_SUMMARY] });
    mockSummarizeBill.mockRejectedValue(new Error("Gemini API unavailable"));

    const result = await getOrCreateBillSummary("HR", "1", 119);

    expect(result.source).toBe("fallback");
    expect(result.summary).toContain("establishes a new grant program");
    // Must NOT persist — allows retry on next request
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("falls back to title when AI fails and no summary text exists", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockGetBill.mockResolvedValue({ ...BASE_BILL, summaries: [] });
    mockGetBillSummaries.mockResolvedValue({ summaries: [] });
    mockSummarizeBill.mockRejectedValue(new Error("Gemini API unavailable"));

    const result = await getOrCreateBillSummary("HR", "1", 119);

    expect(result.source).toBe("fallback");
    expect(result.summary).toBe(BASE_BILL.title);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("stores AI-generated summary with correct model name", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockGetBill.mockResolvedValue({ ...BASE_BILL, summaries: [] });
    mockGetBillSummaries.mockResolvedValue({ summaries: [CRS_SUMMARY] });
    mockSummarizeBill.mockResolvedValue("Final AI summary.");
    mockCreate.mockResolvedValue({});

    await getOrCreateBillSummary("HR", "1", 119);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          model: "gemini-2.5-flash",
          billType: "HR",
          billNumber: "1",
          congress: 119,
        }),
      }),
    );
  });

  it("strips HTML entities from CRS summary text before AI call", async () => {
    const htmlHeavy = {
      ...CRS_SUMMARY,
      text: "<p>This bill &amp; resolution requires &lt;action&gt; from &quot;Congress&quot;&#039;s members.</p>",
    };

    mockFindUnique.mockResolvedValue(null);
    mockGetBill.mockResolvedValue({ ...BASE_BILL, summaries: [] });
    mockGetBillSummaries.mockResolvedValue({ summaries: [htmlHeavy] });
    mockSummarizeBill.mockResolvedValue("Clean summary.");
    mockCreate.mockResolvedValue({});

    await getOrCreateBillSummary("HR", "1", 119);

    expect(mockSummarizeBill).toHaveBeenCalledWith(
      expect.objectContaining({
        billText: `This bill & resolution requires <action> from "Congress"'s members.`,
      }),
    );
  });
});
