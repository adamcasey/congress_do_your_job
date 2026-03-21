import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CacheStatus, buildCacheKey, getCached, getOrFetch, hashIdentifier, invalidateCache, setCached } from "@/lib/cache";

const { getRedisClientMock } = vi.hoisted(() => ({
  getRedisClientMock: vi.fn(),
}));

vi.mock("@/config", () => ({
  getRedisClient: getRedisClientMock,
  CacheTTL: {
    REPRESENTATIVE_LOOKUP: 60,
    DISTRICT_DATA: 60,
    LEGISLATIVE_DATA: 60,
  },
}));

describe("cache utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("builds cache keys with namespace and version", () => {
    expect(buildCacheKey("civic", "representatives", "abc")).toBe("civic:representatives:abc:v1");
    expect(buildCacheKey("civic", "representatives", "abc", "v2")).toBe("civic:representatives:abc:v2");
  });

  it("returns miss when cache client is unavailable", async () => {
    getRedisClientMock.mockReturnValue(null);
    const result = await getCached("test-key");
    expect(result).toEqual({
      data: null,
      status: CacheStatus.MISS,
      isStale: false,
    });
  });

  it("returns miss when cache key is absent", async () => {
    getRedisClientMock.mockReturnValue({ get: vi.fn().mockResolvedValue(null) });
    const result = await getCached("test-key");
    expect(result.status).toBe(CacheStatus.MISS);
  });

  it("returns hit when cached data is within ttl", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_000_000 * 1000);
    getRedisClientMock.mockReturnValue({
      get: vi.fn().mockResolvedValue({
        data: { ok: true },
        metadata: {
          cachedAt: 1_000_000 - 10,
          ttl: 60,
          version: "v1",
        },
      }),
    });

    const result = await getCached<{ ok: boolean }>("test-key");
    expect(result.status).toBe(CacheStatus.HIT);
    expect(result.data).toEqual({ ok: true });
    expect(result.age).toBe(10);
  });

  it("returns stale when cache is expired", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_000_000 * 1000);
    getRedisClientMock.mockReturnValue({
      get: vi.fn().mockResolvedValue({
        data: { ok: true },
        metadata: {
          cachedAt: 1_000_000 - 90,
          ttl: 60,
          version: "v1",
        },
      }),
    });

    const result = await getCached<{ ok: boolean }>("test-key");
    expect(result.status).toBe(CacheStatus.STALE);
    expect(result.isStale).toBe(false);
    expect(result.age).toBe(90);
  });

  it("marks stale cache as hard stale after 2x ttl", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_000_000 * 1000);
    getRedisClientMock.mockReturnValue({
      get: vi.fn().mockResolvedValue({
        data: { ok: true },
        metadata: {
          cachedAt: 1_000_000 - 130,
          ttl: 60,
          version: "v1",
        },
      }),
    });

    const result = await getCached<{ ok: boolean }>("test-key");
    expect(result.status).toBe(CacheStatus.STALE);
    expect(result.isStale).toBe(true);
  });

  it("returns cache error when redis read fails", async () => {
    getRedisClientMock.mockReturnValue({
      get: vi.fn().mockRejectedValue(new Error("boom")),
    });

    const result = await getCached("test-key");
    expect(result.status).toBe(CacheStatus.ERROR);
    expect(result.data).toBeNull();
  });

  it("writes data with stale window extension", async () => {
    const set = vi.fn().mockResolvedValue(true);
    getRedisClientMock.mockReturnValue({ set });
    vi.spyOn(Date, "now").mockReturnValue(1_000_000 * 1000);

    const result = await setCached("test-key", { ok: true }, 120);

    expect(result).toBe(true);
    expect(set).toHaveBeenCalledWith(
      "test-key",
      {
        data: { ok: true },
        metadata: {
          cachedAt: 1_000_000,
          ttl: 120,
          version: "v1",
        },
      },
      { ex: 240 },
    );
  });

  it("returns false when cache write fails", async () => {
    getRedisClientMock.mockReturnValue({
      set: vi.fn().mockRejectedValue(new Error("boom")),
    });
    const result = await setCached("test-key", { ok: true }, 120);
    expect(result).toBe(false);
  });

  it("invalidates cache keys", async () => {
    const del = vi.fn().mockResolvedValue(1);
    getRedisClientMock.mockReturnValue({ del });
    await expect(invalidateCache("test-key")).resolves.toBe(true);
    expect(del).toHaveBeenCalledWith("test-key");
  });

  it("returns false when invalidation fails", async () => {
    getRedisClientMock.mockReturnValue({
      del: vi.fn().mockRejectedValue(new Error("boom")),
    });
    await expect(invalidateCache("test-key")).resolves.toBe(false);
  });

  it("returns cached values without calling fetcher on cache hit", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_000_000 * 1000);
    getRedisClientMock.mockReturnValue({
      get: vi.fn().mockResolvedValue({
        data: { source: "cache" },
        metadata: {
          cachedAt: 1_000_000 - 5,
          ttl: 60,
          version: "v1",
        },
      }),
      set: vi.fn(),
    });
    const fetcher = vi.fn().mockResolvedValue({ source: "origin" });

    const result = await getOrFetch("test-key", fetcher, 60);

    expect(result.status).toBe(CacheStatus.HIT);
    expect(result.data).toEqual({ source: "cache" });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("fetches and caches fresh data on cache miss", async () => {
    const get = vi.fn().mockResolvedValue(null);
    const set = vi.fn().mockResolvedValue(true);
    getRedisClientMock.mockReturnValue({ get, set });
    const fetcher = vi.fn().mockResolvedValue({ source: "origin" });

    const result = await getOrFetch("test-key", fetcher, 60);

    expect(result.status).toBe(CacheStatus.MISS);
    expect(result.data).toEqual({ source: "origin" });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenCalledTimes(1);
  });

  it("returns stale data and schedules background refresh", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_000_000 * 1000);
    const get = vi.fn().mockResolvedValue({
      data: { source: "stale-cache" },
      metadata: {
        cachedAt: 1_000_000 - 90,
        ttl: 60,
        version: "v1",
      },
    });
    const set = vi.fn().mockResolvedValue(true);
    getRedisClientMock.mockReturnValue({ get, set });
    const fetcher = vi.fn().mockResolvedValue({ source: "origin" });

    const result = await getOrFetch("test-key", fetcher, 60);

    expect(result.status).toBe(CacheStatus.STALE);
    expect(result.data).toEqual({ source: "stale-cache" });
    expect(fetcher).toHaveBeenCalledTimes(1);

    await Promise.resolve();
    expect(set).toHaveBeenCalledTimes(1);
  });

  it("throws when fetcher fails and there is no cache fallback", async () => {
    const get = vi.fn().mockResolvedValue(null);
    getRedisClientMock.mockReturnValue({ get, set: vi.fn() });
    const fetcher = vi.fn().mockRejectedValue(new Error("origin failed"));

    await expect(getOrFetch("test-key", fetcher, 60)).rejects.toThrow("origin failed");
  });

  it("hashes sensitive identifiers deterministically", async () => {
    const first = await hashIdentifier("123 Main St");
    const second = await hashIdentifier("123 Main St");
    const third = await hashIdentifier("124 Main St");

    expect(first).toHaveLength(16);
    expect(first).toBe(second);
    expect(first).not.toBe(third);
  });
});
