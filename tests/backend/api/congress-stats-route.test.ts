import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/v1/congress/stats/route";

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

function createRequest() {
  return {
    nextUrl: new URL("https://app.test/api/v1/congress/stats"),
  } as any;
}

describe("GET /api/v1/congress/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    buildCacheKeyMock.mockReturnValue("congress:stats:2026-02-25");
  });

  it("returns bill counts for this week and last week with change metrics", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-25T12:00:00Z"));

    // First call = this week (43 bills), second call = last week (39 bills)
    getBillsMock
      .mockResolvedValueOnce({ bills: [{}], pagination: { count: 43 } })
      .mockResolvedValueOnce({ bills: [{}], pagination: { count: 39 } });

    getOrFetchMock.mockImplementation(async (_key: string, fetcher: () => Promise<unknown>) => ({
      data: await fetcher(),
      status: "MISS",
      isStale: false,
    }));

    const response = await GET(createRequest());
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toMatchObject({
      billsAdvancedThisWeek: 43,
      billsAdvancedLastWeek: 39,
      billsChange: 4,
      billsChangeTone: "good",
      weekLabel: expect.stringContaining("2026"),
      lastUpdated: expect.stringContaining("2026-02-25"),
    });

    // Verify getBills was called with correct date windows
    expect(getBillsMock).toHaveBeenCalledTimes(2);
    expect(getBillsMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        limit: 1,
        sort: "updateDate+desc",
        fromDateTime: "2026-02-18T12:00:00Z",
        toDateTime: "2026-02-25T12:00:00Z",
      }),
    );
    expect(getBillsMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        limit: 1,
        sort: "updateDate+desc",
        fromDateTime: "2026-02-11T12:00:00Z",
        toDateTime: "2026-02-18T12:00:00Z",
      }),
    );

    vi.useRealTimers();
  });

  it("sets billsChangeTone to caution when this week has fewer bills than last week", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-25T00:00:00Z"));

    getBillsMock
      .mockResolvedValueOnce({ bills: [], pagination: { count: 10 } })
      .mockResolvedValueOnce({ bills: [], pagination: { count: 20 } });

    getOrFetchMock.mockImplementation(async (_key: string, fetcher: () => Promise<unknown>) => ({
      data: await fetcher(),
      status: "MISS",
      isStale: false,
    }));

    const response = await GET(createRequest());
    const body = await response.json();

    expect(body.data.billsChange).toBe(-10);
    expect(body.data.billsChangeTone).toBe("caution");

    vi.useRealTimers();
  });

  it("sets billsChangeTone to neutral when counts are equal", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-25T00:00:00Z"));

    getBillsMock
      .mockResolvedValueOnce({ bills: [], pagination: { count: 15 } })
      .mockResolvedValueOnce({ bills: [], pagination: { count: 15 } });

    getOrFetchMock.mockImplementation(async (_key: string, fetcher: () => Promise<unknown>) => ({
      data: await fetcher(),
      status: "MISS",
      isStale: false,
    }));

    const response = await GET(createRequest());
    const body = await response.json();

    expect(body.data.billsChange).toBe(0);
    expect(body.data.billsChangeTone).toBe("neutral");

    vi.useRealTimers();
  });

  it("falls back to bills array length when pagination is absent", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-25T00:00:00Z"));

    getBillsMock
      .mockResolvedValueOnce({ bills: [{}, {}, {}] }) // no pagination
      .mockResolvedValueOnce({ bills: [{}] }); // no pagination

    getOrFetchMock.mockImplementation(async (_key: string, fetcher: () => Promise<unknown>) => ({
      data: await fetcher(),
      status: "MISS",
      isStale: false,
    }));

    const response = await GET(createRequest());
    const body = await response.json();

    expect(body.data.billsAdvancedThisWeek).toBe(3);
    expect(body.data.billsAdvancedLastWeek).toBe(1);

    vi.useRealTimers();
  });

  it("returns 500 when cache returns null data", async () => {
    getOrFetchMock.mockResolvedValue({ data: null, status: "MISS", isStale: false });

    const response = await GET(createRequest());
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe("Failed to compute congress stats");
  });

  it("passes through Congress API error status code", async () => {
    getOrFetchMock.mockRejectedValue(new MockCongressApiError("rate limited", 429));

    const response = await GET(createRequest());
    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe("rate limited");
  });

  it("returns 500 on unexpected errors", async () => {
    getOrFetchMock.mockRejectedValue(new Error("network timeout"));

    const response = await GET(createRequest());
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  it("includes cache status headers", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-25T00:00:00Z"));

    getBillsMock
      .mockResolvedValueOnce({ bills: [], pagination: { count: 5 } })
      .mockResolvedValueOnce({ bills: [], pagination: { count: 5 } });

    getOrFetchMock.mockImplementation(async (_key: string, fetcher: () => Promise<unknown>) => ({
      data: await fetcher(),
      status: "HIT",
      isStale: false,
      age: 300,
    }));

    const response = await GET(createRequest());
    expect(response.headers.get("x-cache-status")).toBe("HIT");
    expect(response.headers.get("x-cache-stale")).toBe("false");
    expect(response.headers.get("x-cache-age")).toBe("300");

    vi.useRealTimers();
  });
});
