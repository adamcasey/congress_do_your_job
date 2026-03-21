import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/v1/fund/stats/route";

const { getCollectionMock, getCachedMock, setCachedMock, findMock, toArrayMock } = vi.hoisted(() => {
  const toArrayMock = vi.fn();
  const findMock = vi.fn().mockReturnValue({ toArray: toArrayMock });
  return {
    toArrayMock,
    findMock,
    getCollectionMock: vi.fn().mockResolvedValue({ find: findMock }),
    getCachedMock: vi.fn().mockResolvedValue(null),
    setCachedMock: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("@/lib/mongodb", () => ({ getCollection: getCollectionMock }));
vi.mock("@/lib/cache", () => ({
  getCached: getCachedMock,
  setCached: setCachedMock,
  buildCacheKey: (...parts: string[]) => parts.join(":"),
  CacheTTL: { PETITIONS: 300 },
}));
vi.mock("@/lib/logger", () => ({
  createLogger: () => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn() }),
}));

describe("GET /api/v1/fund/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCachedMock.mockResolvedValue(null);
    setCachedMock.mockResolvedValue(undefined);
    getCollectionMock.mockResolvedValue({ find: findMock });
    findMock.mockReturnValue({ toArray: toArrayMock });
  });

  it("returns zero stats when no pledges exist", async () => {
    toArrayMock.mockResolvedValue([]);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.activePledgers).toBe(0);
    expect(body.data.monthlyPoolCents).toBe(0);
    expect(body.data.monthlyPoolFormatted).toBe("$0 / month");
  });

  it("sums monthlyAmountCents across active pledges", async () => {
    toArrayMock.mockResolvedValue([
      { monthlyAmountCents: 500 },
      { monthlyAmountCents: 1000 },
      { monthlyAmountCents: 2000 },
    ]);

    const res = await GET();
    const body = await res.json();

    expect(body.data.activePledgers).toBe(3);
    expect(body.data.monthlyPoolCents).toBe(3500);
    expect(body.data.monthlyPoolFormatted).toBe("$35 / month");
  });

  it("queries the fund_pledges collection with status: active filter", async () => {
    toArrayMock.mockResolvedValue([]);

    await GET();

    expect(getCollectionMock).toHaveBeenCalledWith("fund_pledges");
    expect(findMock).toHaveBeenCalledWith({ status: "active" });
  });

  it("returns cached result when cache hit", async () => {
    const cachedStats = { activePledgers: 42, monthlyPoolCents: 42000, monthlyPoolFormatted: "$420 / month" };
    getCachedMock.mockResolvedValue(cachedStats);

    const res = await GET();
    const body = await res.json();

    expect(body.data).toEqual(cachedStats);
    expect(getCollectionMock).not.toHaveBeenCalled();
  });

  it("returns 500 when database throws", async () => {
    getCollectionMock.mockRejectedValue(new Error("DB down"));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
  });
});
