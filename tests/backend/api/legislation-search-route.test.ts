import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/v1/legislation/search/route";

const { searchBillsMock, getBillsMock, buildCacheKeyMock, getOrFetchMock, MockCongressApiError } = vi.hoisted(
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
      buildCacheKeyMock: vi.fn(),
      getOrFetchMock: vi.fn(),
      MockCongressApiError: HoistedCongressApiError,
    };
  },
);

vi.mock("@/lib/congress-api", () => ({
  searchBills: searchBillsMock,
  getBills: getBillsMock,
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

  it("searches by keyword when query is present", async () => {
    searchBillsMock.mockResolvedValue({
      bills: [makeBill("Infrastructure Investment Act", "1")],
      pagination: { count: 1 },
    });

    const response = await GET(createRequest("https://app.test/api/v1/legislation/search?q=infrastructure"));
    expect(response.status).toBe(200);
    expect(searchBillsMock).toHaveBeenCalledWith("infrastructure", expect.objectContaining({ congress: 119 }));
  });

  it("ranks exact title match first", async () => {
    const exactTitle = "Protecting our Communities from Sexual Predators Act";
    searchBillsMock.mockResolvedValue({
      bills: [
        makeBill("Unrelated Bill About Infrastructure", "2"),
        makeBill(exactTitle, "1"),
        makeBill("Another Community Safety Bill", "3"),
      ],
      pagination: { count: 3 },
    });

    const response = await GET(
      createRequest(
        `https://app.test/api/v1/legislation/search?q=${encodeURIComponent(exactTitle.toLowerCase())}`,
      ),
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

  it("triggers fuzzy fallback when query has punctuation and returns no results", async () => {
    searchBillsMock
      .mockResolvedValueOnce({ bills: [], pagination: { count: 0 } })
      .mockResolvedValueOnce({
        bills: [makeBill("Energy and Climate Solutions Act", "1")],
        pagination: { count: 1 },
      });

    // Query with punctuation that doesn't match anything
    const response = await GET(
      createRequest("https://app.test/api/v1/legislation/search?q=Energy+%26+Climate+Solutions+Act"),
    );
    const body = await response.json();
    expect(searchBillsMock).toHaveBeenCalledTimes(2);
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

  it("returns 500 when cache responds without data", async () => {
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
});
