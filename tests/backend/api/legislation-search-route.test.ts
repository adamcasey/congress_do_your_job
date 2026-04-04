import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/v1/legislation/search/route";

const { searchBillsMock, getBillsMock, getBillMock, buildCacheKeyMock, getOrFetchMock, MockCongressApiError } = vi.hoisted(
  () => {
    class HoistedCongressApiError extends Error {
      statusCode?: number;
      constructor(message: string, statusCode?: number) {
        super(message);
        this.statusCode = statusCode;
        this.name = "CongressApiError";
      }
    }
    return {
      searchBillsMock: vi.fn(),
      getBillsMock: vi.fn(),
      getBillMock: vi.fn(),
      buildCacheKeyMock: vi.fn(),
      getOrFetchMock: vi.fn(),
      MockCongressApiError: HoistedCongressApiError,
    };
  },
);

vi.mock("@/lib/congress-api", () => ({
  searchBills: searchBillsMock,
  getBills: getBillsMock,
  getBill: getBillMock,
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
    expect(searchBillsMock).not.toHaveBeenCalled();
  });

  it("fetches SEARCH_FETCH_LIMIT=100 bills at offset 0 for keyword search", async () => {
    searchBillsMock.mockResolvedValue({
      bills: [makeBill("Infrastructure Investment Act", "1")],
      pagination: { count: 1 },
    });

    const response = await GET(createRequest("https://app.test/api/v1/legislation/search?q=infrastructure"));
    expect(response.status).toBe(200);
    expect(searchBillsMock).toHaveBeenCalledWith(
      "infrastructure",
      expect.objectContaining({ congress: 119, limit: 100, offset: 0 }),
    );
  });

  it("ranks exact title match first regardless of API ordering", async () => {
    const exactTitle = "SAVE Act";
    searchBillsMock.mockResolvedValue({
      bills: [
        makeBill("Unrelated Bill About Infrastructure", "2"),
        makeBill("Another Bill That Mentions SAVE", "3"),
        makeBill(exactTitle, "1"), // exact match buried in API results
      ],
      pagination: { count: 3 },
    });

    const response = await GET(
      createRequest(`https://app.test/api/v1/legislation/search?q=${encodeURIComponent("save act")}`),
    );
    const body = await response.json();
    expect(body.data.bills[0].title).toBe(exactTitle);
  });

  it("ranks title-contains match above no-match", async () => {
    searchBillsMock.mockResolvedValue({
      bills: [makeBill("Unrelated Omnibus Bill", "2"), makeBill("Healthcare Reform and Access Act", "1")],
      pagination: { count: 2 },
    });

    const response = await GET(createRequest("https://app.test/api/v1/legislation/search?q=healthcare+reform"));
    const body = await response.json();
    expect(body.data.bills[0].title).toBe("Healthcare Reform and Access Act");
  });

  it("sub-sorts equal-relevance bills by updateDate descending", async () => {
    // Both bills contain "infrastructure" — equal relevance score
    // The more recently updated one should surface first
    searchBillsMock.mockResolvedValue({
      bills: [
        { ...makeBill("Infrastructure Maintenance Act", "1"), updateDate: "2025-01-15" },
        { ...makeBill("Infrastructure Investment Fund", "2"), updateDate: "2026-03-01" },
      ],
      pagination: { count: 2 },
    });

    const response = await GET(createRequest("https://app.test/api/v1/legislation/search?q=infrastructure"));
    const body = await response.json();
    expect(body.data.bills[0].title).toBe("Infrastructure Investment Fund"); // newer date first
  });

  it("returns paginated slice from ranked batch when offset is provided", async () => {
    const bills = Array.from({ length: 20 }, (_, i) => makeBill(`Bill ${String(i + 1).padStart(2, "0")}`, String(i + 1)));
    searchBillsMock.mockResolvedValue({ bills, pagination: { count: 20 } });

    // Page 2: offset=8, limit=8 → should return bills[8..15] from ranked list
    const response = await GET(
      createRequest("https://app.test/api/v1/legislation/search?q=bill&limit=8&offset=8"),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.bills).toHaveLength(8);
    // API was still called with offset=0 and limit=100 — pagination is our responsibility
    expect(searchBillsMock).toHaveBeenCalledWith(
      "bill",
      expect.objectContaining({ offset: 0, limit: 100 }),
    );
  });

  it("falls back to normalized query when original returns 0 results", async () => {
    searchBillsMock
      .mockResolvedValueOnce({ bills: [], pagination: { count: 0 } }) // original punctuated query
      .mockResolvedValueOnce({
        bills: [makeBill("Protecting our Communities from Sexual Predators Act", "1")],
        pagination: { count: 1 },
      }); // normalized query

    const response = await GET(
      createRequest(
        "https://app.test/api/v1/legislation/search?q=Protecting+our+Communities+from+Sexual+Predators+Act",
      ),
    );
    const body = await response.json();
    expect(searchBillsMock).toHaveBeenCalledTimes(1); // no punctuation → no retry needed
    expect(body.data.bills).toHaveLength(0); // query had no punctuation so no fallback
  });

  it("pre-normalizes punctuated query before calling Congress.gov (single API call)", async () => {
    // "&" is stripped to a space via normalizeQuery before the API call, so Congress.gov
    // receives "energy climate solutions act" instead of "Energy & Climate Solutions Act".
    // This means we only ever make ONE API call — there is no two-step fallback.
    searchBillsMock.mockResolvedValueOnce({
      bills: [makeBill("Energy and Climate Solutions Act", "1")],
      pagination: { count: 1 },
    });

    const response = await GET(
      createRequest("https://app.test/api/v1/legislation/search?q=Energy+%26+Climate+Solutions+Act"),
    );
    const body = await response.json();
    expect(searchBillsMock).toHaveBeenCalledTimes(1);
    expect(searchBillsMock).toHaveBeenCalledWith(
      "energy climate solutions act",
      expect.objectContaining({ limit: 100, offset: 0 }),
    );
    expect(body.data.bills).toHaveLength(1);
    expect(body.data.bills[0].title).toBe("Energy and Climate Solutions Act");
  });

  it("does not trigger fallback when original query has results", async () => {
    searchBillsMock.mockResolvedValue({
      bills: [makeBill("Energy & Climate Solutions Act", "1")],
      pagination: { count: 1 },
    });

    const response = await GET(
      createRequest("https://app.test/api/v1/legislation/search?q=Energy+%26+Climate"),
    );
    expect(searchBillsMock).toHaveBeenCalledTimes(1);
    const body = await response.json();
    expect(body.data.bills).toHaveLength(1);
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
      getOrFetchMock.mockImplementation(async (_key: string, fetcher: () => Promise<unknown>) => ({
        data: await fetcher(),
        status: "MISS",
        isStale: false,
      }));
      getBillMock.mockResolvedValue(bill);

      const response = await GET(createRequest("https://app.test/api/v1/legislation/search?q=HR+1234"));
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data.bills).toHaveLength(1);
      expect(body.data.bills[0].number).toBe("1234");
      expect(getBillMock).toHaveBeenCalledWith("hr", "1234", 119);
      expect(searchBillsMock).not.toHaveBeenCalled();
    });

    it("handles dotted notation HR number (H.R. 5)", async () => {
      const bill = makeBill("Test Act", "5");
      getOrFetchMock.mockImplementation(async (_key: string, fetcher: () => Promise<unknown>) => ({
        data: await fetcher(),
        status: "MISS",
        isStale: false,
      }));
      getBillMock.mockResolvedValue(bill);

      const response = await GET(createRequest("https://app.test/api/v1/legislation/search?q=H.R.+5"));
      const body = await response.json();
      expect(body.data.bills).toHaveLength(1);
      expect(getBillMock).toHaveBeenCalledWith("hr", "5", 119);
    });

    it("falls through to text search when direct lookup finds no bill", async () => {
      // First getOrFetch call (direct): returns empty bills
      // Second getOrFetch call (ranked batch): returns search results
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
      searchBillsMock.mockResolvedValue({
        bills: [makeBill("HR 1234 Companion Bill", "5678")],
        pagination: { count: 1 },
      });

      const response = await GET(createRequest("https://app.test/api/v1/legislation/search?q=HR+1234"));
      const body = await response.json();
      expect(body.data.bills).toHaveLength(1);
      expect(searchBillsMock).toHaveBeenCalled();
    });

    it("recognizes Senate bill number pattern", async () => {
      const bill = makeBill("Senate Act", "42");
      getOrFetchMock.mockImplementation(async (_key: string, fetcher: () => Promise<unknown>) => ({
        data: await fetcher(),
        status: "MISS",
        isStale: false,
      }));
      getBillMock.mockResolvedValue(bill);

      const response = await GET(createRequest("https://app.test/api/v1/legislation/search?q=S+42"));
      const body = await response.json();
      expect(body.data.count).toBe(1);
      expect(getBillMock).toHaveBeenCalledWith("s", "42", 119);
    });
  });

  describe("scoring improvements", () => {
    it("stop words do not inflate scores — 'veterans benefits' ranks above 'unrelated act'", async () => {
      // Both bills contain "act" but only one contains significant query words
      searchBillsMock.mockResolvedValue({
        bills: [
          makeBill("Unrelated Infrastructure Act", "2"),
          makeBill("Veterans Benefits Improvement Act of 2025", "1"),
        ],
        pagination: { count: 2 },
      });

      const response = await GET(
        createRequest("https://app.test/api/v1/legislation/search?q=veterans+benefits"),
      );
      const body = await response.json();
      expect(body.data.bills[0].title).toBe("Veterans Benefits Improvement Act of 2025");
    });

    it("prefix matching — 'veteran' matches 'Veterans' Benefits Act'", async () => {
      searchBillsMock.mockResolvedValue({
        bills: [
          makeBill("Unrelated Commerce Bill", "2"),
          makeBill("Veterans' Benefits and Transition Act", "1"),
        ],
        pagination: { count: 2 },
      });

      const response = await GET(
        createRequest("https://app.test/api/v1/legislation/search?q=veteran+transition"),
      );
      const body = await response.json();
      // "veteran" prefix-matches "veterans'" and "transition" exact-matches
      expect(body.data.bills[0].title).toBe("Veterans' Benefits and Transition Act");
    });
  });

  describe("deduplication", () => {
    it("deduplicates bills with the same congress+type+number from API response", async () => {
      const dupBill = makeBill("Climate Act", "10");
      searchBillsMock.mockResolvedValue({
        bills: [dupBill, dupBill, makeBill("Infrastructure Act", "11")],
        pagination: { count: 3 },
      });

      const response = await GET(createRequest("https://app.test/api/v1/legislation/search?q=climate"));
      const body = await response.json();
      // Should deduplicate: 2 unique bills returned, not 3
      expect(body.data.bills).toHaveLength(2);
    });
  });
});
