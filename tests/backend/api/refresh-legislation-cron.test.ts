import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/cron/refresh-legislation/route";

const { getBillsMock, setCachedMock, buildCacheKeyMock, upsertBillsMock, MockCongressApiError } = vi.hoisted(() => {
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
    setCachedMock: vi.fn(),
    buildCacheKeyMock: vi.fn(),
    upsertBillsMock: vi.fn(),
    MockCongressApiError: HoistedCongressApiError,
  };
});

vi.mock("@/lib/congress-api", () => ({
  getBills: getBillsMock,
  CongressApiError: MockCongressApiError,
  getCurrentCongress: () => 119,
}));

vi.mock("@/lib/cache", () => ({
  setCached: setCachedMock,
  buildCacheKey: buildCacheKeyMock,
  CacheTTL: { LEGISLATIVE_DATA: 3600 },
}));

vi.mock("@/lib/bill-index", () => ({
  upsertBills: upsertBillsMock,
}));

function makeBill(n: number) {
  return {
    number: String(n),
    type: "HR",
    congress: 119,
    title: `Bill ${n}`,
    updateDate: "2026-03-01",
    originChamber: "House",
  };
}

function createRequest() {
  return { headers: { get: () => "Vercel-Cron/1.0" } } as any;
}

describe("GET /api/cron/refresh-legislation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    buildCacheKeyMock.mockImplementation(
      (service: string, resource: string, id: string) => `${service}:${resource}:${id}:v1`,
    );
    setCachedMock.mockResolvedValue(true);
    upsertBillsMock.mockResolvedValue(0);
  });

  it("fetches 96 bills at offset 0 sorted by updateDate desc", async () => {
    getBillsMock.mockResolvedValue({ bills: [makeBill(1)], pagination: { count: 1 } });

    await GET(createRequest());

    expect(getBillsMock).toHaveBeenCalledOnce();
    expect(getBillsMock).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 96, offset: 0, sort: "updateDate+desc" }),
    );
  });

  it("caches each page of 8 bills under the correct cache key", async () => {
    // 16 bills → 2 full pages
    const bills = Array.from({ length: 16 }, (_, i) => makeBill(i + 1));
    getBillsMock.mockResolvedValue({ bills, pagination: { count: 16 } });

    await GET(createRequest());

    expect(setCachedMock).toHaveBeenCalledTimes(2);
    // Page 1: offset=0
    expect(setCachedMock).toHaveBeenCalledWith(
      "legislation:search:119-recent-8-0:v1",
      expect.objectContaining({ bills: bills.slice(0, 8), count: 16, query: "" }),
      3600,
    );
    // Page 2: offset=8
    expect(setCachedMock).toHaveBeenCalledWith(
      "legislation:search:119-recent-8-8:v1",
      expect.objectContaining({ bills: bills.slice(8, 16), count: 16, query: "" }),
      3600,
    );
  });

  it("reports correct stats in response", async () => {
    const bills = Array.from({ length: 10 }, (_, i) => makeBill(i + 1));
    getBillsMock.mockResolvedValue({ bills, pagination: { count: 10 } });

    const response = await GET(createRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.stats.billsFetched).toBe(10);
    expect(body.data.stats.pagesCached).toBe(2); // 10 bills → 2 pages (8 + 2)
    expect(body.data.stats.errors).toBe(0);
  });

  it("returns success with zero pages when Congress.gov returns no bills", async () => {
    getBillsMock.mockResolvedValue({ bills: [], pagination: { count: 0 } });

    const response = await GET(createRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.stats.billsFetched).toBe(0);
    expect(body.data.stats.pagesCached).toBe(0);
    expect(setCachedMock).not.toHaveBeenCalled();
  });

  it("counts setCached failures as errors in stats", async () => {
    const bills = Array.from({ length: 8 }, (_, i) => makeBill(i + 1));
    getBillsMock.mockResolvedValue({ bills, pagination: { count: 8 } });
    setCachedMock.mockResolvedValue(false); // cache write fails

    const response = await GET(createRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.stats.errors).toBe(1);
    expect(body.data.stats.pagesCached).toBe(0);
  });

  it("returns the CongressApiError status code and includes stats in details", async () => {
    getBillsMock.mockRejectedValue(new MockCongressApiError("rate limited", 429));

    const response = await GET(createRequest());
    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.details.stats).toBeDefined();
  });

  it("returns 500 with stats on unexpected errors", async () => {
    getBillsMock.mockRejectedValue(new Error("network failure"));

    const response = await GET(createRequest());
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.success).toBe(false);
  });
});
