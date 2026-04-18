import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/v1/legislation/search/route";

const {
  searchBillsByTitleMock,
  upsertBillShortTitlesMock,
  getBillsMock,
  getBillMock,
  getBillTitlesMock,
  buildCacheKeyMock,
  getOrFetchMock,
  MockCongressApiError,
} = vi.hoisted(() => {
  class HoistedCongressApiError extends Error {
    statusCode?: number;
    constructor(message: string, statusCode?: number) {
      super(message);
      this.statusCode = statusCode;
      this.name = "CongressApiError";
    }
  }
  return {
    searchBillsByTitleMock: vi.fn(),
    upsertBillShortTitlesMock: vi.fn().mockResolvedValue(undefined),
    getBillsMock: vi.fn(),
    getBillMock: vi.fn(),
    getBillTitlesMock: vi.fn().mockResolvedValue([]),
    buildCacheKeyMock: vi.fn(),
    getOrFetchMock: vi.fn(),
    MockCongressApiError: HoistedCongressApiError,
  };
});

vi.mock("@/lib/bill-index", () => ({
  searchBillsByTitle: searchBillsByTitleMock,
  upsertBillShortTitles: upsertBillShortTitlesMock,
}));

vi.mock("@/lib/congress-api", () => ({
  getBills: getBillsMock,
  getBill: getBillMock,
  getBillTitles: getBillTitlesMock,
  CongressApiError: MockCongressApiError,
  getCurrentCongress: () => 119,
}));

vi.mock("@/lib/cache", () => ({
  buildCacheKey: buildCacheKeyMock,
  getOrFetch: getOrFetchMock,
  CacheTTL: { LEGISLATIVE_DATA: 3600 },
}));

function makeBill(title: string, number = "1"): object {
  return { number, type: "HR", congress: 119, title, updateDate: "2026-01-01", originChamber: "House" };
}

function createRequest(url: string) {
  return { nextUrl: new URL(url) } as any;
}

describe("GET /api/v1/legislation/search", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    buildCacheKeyMock.mockReturnValue("cache:key");
    getBillTitlesMock.mockResolvedValue([]);
    upsertBillShortTitlesMock.mockResolvedValue(undefined);
    getOrFetchMock.mockImplementation(async (_key: string, fetcher: () => Promise<unknown>) => ({
      data: await fetcher(),
      status: "MISS",
      isStale: false,
    }));
  });

  it("returns recent bills when no query is provided", async () => {
    getBillsMock.mockResolvedValue({ bills: [makeBill("Recent Bill")], pagination: { count: 1 } });

    const response = await GET(createRequest("https://app.test/api/v1/legislation/search"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.bills).toHaveLength(1);
    expect(getBillsMock).toHaveBeenCalled();
    expect(searchBillsByTitleMock).not.toHaveBeenCalled();
  });

  it("searches bill_index by title for keyword queries", async () => {
    searchBillsByTitleMock.mockResolvedValue([makeBill("Infrastructure Investment Act", "1")]);

    const response = await GET(createRequest("https://app.test/api/v1/legislation/search?q=infrastructure"));
    expect(response.status).toBe(200);
    expect(searchBillsByTitleMock).toHaveBeenCalledWith("infrastructure", 100);
  });

  it("ranks exact title match first regardless of index ordering", async () => {
    const exactTitle = "SAVE Act";
    searchBillsByTitleMock.mockResolvedValue([
      makeBill("Unrelated Bill About Infrastructure", "2"),
      makeBill("Another Bill That Mentions SAVE", "3"),
      makeBill(exactTitle, "1"),
    ]);

    const response = await GET(
      createRequest(`https://app.test/api/v1/legislation/search?q=${encodeURIComponent("save act")}`),
    );
    const body = await response.json();
    expect(body.data.bills[0].title).toBe(exactTitle);
  });

  it("ranks title-contains match above no-match", async () => {
    searchBillsByTitleMock.mockResolvedValue([
      makeBill("Unrelated Omnibus Bill", "2"),
      makeBill("Healthcare Reform and Access Act", "1"),
    ]);

    const response = await GET(createRequest("https://app.test/api/v1/legislation/search?q=healthcare+reform"));
    const body = await response.json();
    expect(body.data.bills[0].title).toBe("Healthcare Reform and Access Act");
  });

  it("sub-sorts equal-relevance bills by updateDate descending", async () => {
    searchBillsByTitleMock.mockResolvedValue([
      { ...makeBill("Infrastructure Maintenance Act", "1"), updateDate: "2025-01-15" },
      { ...makeBill("Infrastructure Investment Fund", "2"), updateDate: "2026-03-01" },
    ]);

    const response = await GET(createRequest("https://app.test/api/v1/legislation/search?q=infrastructure"));
    const body = await response.json();
    expect(body.data.bills[0].title).toBe("Infrastructure Investment Fund");
  });

  it("returns paginated slice from ranked batch when offset is provided", async () => {
    const bills = Array.from({ length: 20 }, (_, i) => makeBill(`Bill ${String(i + 1).padStart(2, "0")}`, String(i + 1)));
    searchBillsByTitleMock.mockResolvedValue(bills);

    const response = await GET(
      createRequest("https://app.test/api/v1/legislation/search?q=bill&limit=8&offset=8"),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.bills).toHaveLength(8);
    expect(searchBillsByTitleMock).toHaveBeenCalledWith("bill", 100);
  });

  it("pre-normalizes punctuated query before searching (single call)", async () => {
    searchBillsByTitleMock.mockResolvedValue([makeBill("Energy and Climate Solutions Act", "1")]);

    const response = await GET(
      createRequest("https://app.test/api/v1/legislation/search?q=Energy+%26+Climate+Solutions+Act"),
    );
    const body = await response.json();
    expect(searchBillsByTitleMock).toHaveBeenCalledTimes(1);
    expect(searchBillsByTitleMock).toHaveBeenCalledWith("energy climate solutions act", 100);
    expect(body.data.bills).toHaveLength(1);
    expect(body.data.bills[0].title).toBe("Energy and Climate Solutions Act");
  });

  it("returns 400 when query exceeds 200 characters", async () => {
    const longQuery = "a".repeat(201);
    const response = await GET(
      createRequest(`https://app.test/api/v1/legislation/search?q=${longQuery}`),
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe("Query too long");
  });

  it("returns 500 when cache responds without data for keyword search", async () => {
    getOrFetchMock.mockResolvedValue({ data: null, status: "MISS", isStale: false });

    const response = await GET(createRequest("https://app.test/api/v1/legislation/search?q=test"));
    expect(response.status).toBe(500);
  });

  it("returns 500 when cache responds without data for recent bills", async () => {
    getOrFetchMock.mockResolvedValue({ data: null, status: "MISS", isStale: false });

    const response = await GET(createRequest("https://app.test/api/v1/legislation/search"));
    expect(response.status).toBe(500);
  });

  it("returns CongressApiError status code", async () => {
    getOrFetchMock.mockRejectedValue(new MockCongressApiError("rate limited", 429));

    const response = await GET(createRequest("https://app.test/api/v1/legislation/search?q=test"));
    expect(response.status).toBe(429);
  });

  it("returns 500 on unexpected errors", async () => {
    getOrFetchMock.mockRejectedValue(new Error("boom"));

    const response = await GET(createRequest("https://app.test/api/v1/legislation/search?q=test"));
    expect(response.status).toBe(500);
  });

  describe("bill number direct lookup", () => {
    it("returns single bill for HR number query", async () => {
      const bill = makeBill("Some Act", "1234");
      getBillMock.mockResolvedValue(bill);

      const response = await GET(createRequest("https://app.test/api/v1/legislation/search?q=HR+1234"));
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data.bills).toHaveLength(1);
      expect(body.data.bills[0].number).toBe("1234");
      expect(getBillMock).toHaveBeenCalledWith("hr", "1234", 119);
      expect(searchBillsByTitleMock).not.toHaveBeenCalled();
    });

    it("handles dotted notation HR number (H.R. 5)", async () => {
      const bill = makeBill("Test Act", "5");
      getBillMock.mockResolvedValue(bill);

      const response = await GET(createRequest("https://app.test/api/v1/legislation/search?q=H.R.+5"));
      const body = await response.json();
      expect(body.data.bills).toHaveLength(1);
      expect(getBillMock).toHaveBeenCalledWith("hr", "5", 119);
    });

    it("falls through to title search when direct lookup finds no bill", async () => {
      getOrFetchMock
        .mockImplementationOnce(async (_key: string, fetcher: () => Promise<unknown>) => ({
          data: await fetcher(),
          status: "MISS",
          isStale: false,
        }))
        .mockImplementationOnce(async (_key: string, fetcher: () => Promise<unknown>) => ({
          data: await fetcher(),
          status: "MISS",
          isStale: false,
        }));
      getBillMock.mockRejectedValue(new MockCongressApiError("Not found", 404));
      searchBillsByTitleMock.mockResolvedValue([makeBill("HR 1234 Companion Bill", "5678")]);

      const response = await GET(createRequest("https://app.test/api/v1/legislation/search?q=HR+1234"));
      const body = await response.json();
      expect(body.data.bills).toHaveLength(1);
      expect(searchBillsByTitleMock).toHaveBeenCalled();
    });

    it("recognizes Senate bill number pattern", async () => {
      const bill = makeBill("Senate Act", "42");
      getBillMock.mockResolvedValue(bill);

      const response = await GET(createRequest("https://app.test/api/v1/legislation/search?q=S+42"));
      const body = await response.json();
      expect(body.data.count).toBe(1);
      expect(getBillMock).toHaveBeenCalledWith("s", "42", 119);
    });
  });

  describe("scoring improvements", () => {
    it("stop words do not inflate scores — 'veterans benefits' ranks above 'unrelated act'", async () => {
      searchBillsByTitleMock.mockResolvedValue([
        makeBill("Unrelated Infrastructure Act", "2"),
        makeBill("Veterans Benefits Improvement Act of 2025", "1"),
      ]);

      const response = await GET(
        createRequest("https://app.test/api/v1/legislation/search?q=veterans+benefits"),
      );
      const body = await response.json();
      expect(body.data.bills[0].title).toBe("Veterans Benefits Improvement Act of 2025");
    });

    it("prefix matching — 'veteran' matches 'Veterans Benefits Act'", async () => {
      searchBillsByTitleMock.mockResolvedValue([
        makeBill("Unrelated Commerce Bill", "2"),
        makeBill("Veterans' Benefits and Transition Act", "1"),
      ]);

      const response = await GET(
        createRequest("https://app.test/api/v1/legislation/search?q=veteran+transition"),
      );
      const body = await response.json();
      expect(body.data.bills[0].title).toBe("Veterans' Benefits and Transition Act");
    });

    it("acronym matching — 'SAVE Act' surfaces bill titled 'Safeguard American Voter Eligibility Act'", async () => {
      // The SAVE Act's full title doesn't contain "save" as a word, only as an acronym.
      // The bill is returned by MongoDB (matched via "act"), but must be scored correctly.
      searchBillsByTitleMock.mockResolvedValue([
        makeBill("Unrelated Infrastructure Act", "2"),
        makeBill("Some Act with Voting Elements", "3"),
        makeBill("Safeguard American Voter Eligibility Act", "1"),
      ]);

      const response = await GET(
        createRequest(`https://app.test/api/v1/legislation/search?q=${encodeURIComponent("SAVE Act")}`),
      );
      const body = await response.json();
      expect(body.data.bills[0].title).toBe("Safeguard American Voter Eligibility Act");
    });
  });

  describe("deduplication", () => {
    it("deduplicates bills with the same congress+type+number", async () => {
      const dupBill = makeBill("Climate Act", "10");
      searchBillsByTitleMock.mockResolvedValue([dupBill, dupBill, makeBill("Infrastructure Act", "11")]);

      const response = await GET(createRequest("https://app.test/api/v1/legislation/search?q=climate"));
      const body = await response.json();
      expect(body.data.bills).toHaveLength(2);
    });
  });
});
