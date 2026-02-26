import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/v1/legislation/recent/route";

const { getBillsMock, buildCacheKeyMock, getOrFetchMock, MockCongressApiError } = vi.hoisted(() => {
  class HoistedCongressApiError extends Error {
    statusCode?: number;

    constructor(message: string, statusCode?: number) {
      super(message);
      this.statusCode = statusCode;
      this.name = "CongressApiError";
    }
  }

  return {
    getBillsMock: vi.fn(),
    buildCacheKeyMock: vi.fn(),
    getOrFetchMock: vi.fn(),
    MockCongressApiError: HoistedCongressApiError,
  };
});

vi.mock("@/lib/congress-api", () => ({
  getBills: getBillsMock,
  CongressApiError: MockCongressApiError,
}));

vi.mock("@/lib/cache", () => ({
  buildCacheKey: buildCacheKeyMock,
  getOrFetch: getOrFetchMock,
  CacheTTL: {
    LEGISLATIVE_DATA: 3600,
  },
}));

function createRequest(url: string) {
  return {
    nextUrl: new URL(url),
  } as any;
}

describe("GET /api/v1/legislation/recent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    buildCacheKeyMock.mockReturnValue("cache:key");
  });

  it("returns recent bills payload with cache headers", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-09T12:00:00Z"));

    getBillsMock.mockResolvedValue({
      bills: [
        {
          number: "1",
          type: "HR",
          congress: 119,
          title: "Bill",
          updateDate: "2026-02-08",
          updateDateIncludingText: "2026-02-08",
          originChamber: "House",
          introducedDate: "2026-01-01",
          url: "/bill/1",
        },
      ],
      pagination: { count: 1 },
    });
    getOrFetchMock.mockImplementation(async (_key, fetcher) => ({
      data: await fetcher(),
      status: "MISS",
      isStale: false,
    }));

    const response = await GET(createRequest("https://app.test/api/v1/legislation/recent?limit=10&days=14"));
    expect(response.status).toBe(200);
    expect(response.headers.get("x-cache-status")).toBe("MISS");

    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        bills: expect.any(Array),
        count: 1,
        lastUpdated: expect.stringMatching(/2026-02-09T12:00:00Z/),
      },
    });
    expect(getBillsMock).toHaveBeenCalledWith({
      limit: 10,
      fromDateTime: "2026-01-26T12:00:00Z",
      toDateTime: "2026-02-09T12:00:00Z",
      sort: "updateDate+desc",
    });
    vi.useRealTimers();
  });

  it("caps limit at 250", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-09T12:00:00Z"));

    getBillsMock.mockResolvedValue({ bills: [], pagination: { count: 0 } });
    getOrFetchMock.mockImplementation(async (_key, fetcher) => ({
      data: await fetcher(),
      status: "MISS",
      isStale: false,
    }));

    const response = await GET(createRequest("https://app.test/api/v1/legislation/recent?limit=999"));
    expect(response.status).toBe(200);
    expect(getBillsMock).toHaveBeenCalledWith(expect.objectContaining({ limit: 250 }));
    vi.useRealTimers();
  });

  it("returns congress API error details when upstream throws typed errors", async () => {
    getOrFetchMock.mockRejectedValue(new MockCongressApiError("rate limited", 429));

    const response = await GET(createRequest("https://app.test/api/v1/legislation/recent"));
    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "rate limited",
      details: { statusCode: 429 },
    });
  });

  it("returns 500 when cache responds without data", async () => {
    getOrFetchMock.mockResolvedValue({
      data: null,
      status: "MISS",
      isStale: false,
    });

    const response = await GET(createRequest("https://app.test/api/v1/legislation/recent"));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Failed to fetch recent bills",
    });
  });

  it("returns 500 on unexpected errors", async () => {
    getOrFetchMock.mockRejectedValue(new Error("boom"));

    const response = await GET(createRequest("https://app.test/api/v1/legislation/recent"));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Failed to fetch recent bills",
    });
  });
});
