import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/v1/representatives/route";

const { buildCacheKeyMock, getOrFetchMock, hashIdentifierMock } = vi.hoisted(() => ({
  buildCacheKeyMock: vi.fn(),
  getOrFetchMock: vi.fn(),
  hashIdentifierMock: vi.fn(),
}));

vi.mock("@/lib/cache", () => ({
  buildCacheKey: buildCacheKeyMock,
  getOrFetch: getOrFetchMock,
  hashIdentifier: hashIdentifierMock,
  CacheTTL: {
    REPRESENTATIVE_LOOKUP: 3600,
  },
}));

function createRequest(url: string) {
  return {
    nextUrl: new URL(url),
  } as any;
}

describe("GET /api/v1/representatives", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.FIVE_CALLS_API_KEY = "test-token";
    process.env.FIVE_CALLS_API_URL = "https://fivecalls.example/lookup";
    buildCacheKeyMock.mockReturnValue("cache:key");
    hashIdentifierMock.mockResolvedValue("address-hash");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 400 when address is missing", async () => {
    const response = await GET(createRequest("https://app.test/api/v1/representatives"));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Address parameter is required",
    });
  });

  it("returns 500 when API credentials are missing", async () => {
    delete process.env.FIVE_CALLS_API_KEY;

    const response = await GET(createRequest("https://app.test/api/v1/representatives?address=123%20Main"));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "API configuration error",
    });
  });

  it("returns 500 when API URL is missing", async () => {
    delete process.env.FIVE_CALLS_API_URL;
    const response = await GET(createRequest("https://app.test/api/v1/representatives?address=123%20Main"));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "API configuration error",
    });
  });

  it("fetches and returns representatives on cache miss", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          location: "Springfield",
          state: "MO",
          district: "02",
          representatives: [{ id: "1", name: "Rep One", phone: "202-555-0100" }],
        }),
      }),
    );
    getOrFetchMock.mockImplementation(async (_key, fetcher) => ({
      data: await fetcher(),
      status: "MISS",
      isStale: false,
    }));

    const response = await GET(createRequest("https://app.test/api/v1/representatives?address=123%20Main"));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        location: "Springfield",
        state: "MO",
        district: "02",
        representatives: [{ id: "1", name: "Rep One", phone: "202-555-0100" }],
      },
    });
  });

  it("returns 500 when upstream lookup returns 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: vi.fn().mockResolvedValue("not found"),
      }),
    );
    getOrFetchMock.mockImplementation(async (_key, fetcher) => ({
      data: await fetcher(),
      status: "MISS",
      isStale: false,
    }));

    const response = await GET(createRequest("https://app.test/api/v1/representatives?address=bad"));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Failed to fetch representatives. Please try again.",
    });
  });

  it("returns 500 when upstream lookup fails with non-404 status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue("server error"),
      }),
    );
    getOrFetchMock.mockImplementation(async (_key, fetcher) => ({
      data: await fetcher(),
      status: "MISS",
      isStale: false,
    }));

    const response = await GET(createRequest("https://app.test/api/v1/representatives?address=bad"));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Failed to fetch representatives. Please try again.",
    });
  });

  it("returns representatives with cache headers", async () => {
    getOrFetchMock.mockResolvedValue({
      data: {
        location: "Springfield",
        state: "MO",
        district: "02",
        representatives: [{ id: "1", name: "Rep One", phone: "202-555-0100" }],
      },
      status: "HIT",
      isStale: false,
      age: 120,
    });

    const response = await GET(createRequest("https://app.test/api/v1/representatives?address=123%20Main"));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-cache-status")).toBe("HIT");
    expect(response.headers.get("x-cache-stale")).toBe("false");
    expect(response.headers.get("x-cache-age")).toBe("120");
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        location: "Springfield",
        state: "MO",
        district: "02",
        representatives: [{ id: "1", name: "Rep One", phone: "202-555-0100" }],
      },
    });
    expect(hashIdentifierMock).toHaveBeenCalledWith("123 main");
    expect(buildCacheKeyMock).toHaveBeenCalledWith("civic", "representatives", "address-hash");
    expect(getOrFetchMock).toHaveBeenCalledWith("cache:key", expect.any(Function), 3600);
  });

  it("returns 500 when cache layer fails", async () => {
    getOrFetchMock.mockRejectedValue(new Error("upstream failed"));

    const response = await GET(createRequest("https://app.test/api/v1/representatives?address=123%20Main"));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Failed to fetch representatives. Please try again.",
    });
  });

  it("returns 500 when cache lookup has no data", async () => {
    getOrFetchMock.mockResolvedValue({
      data: null,
      status: "MISS",
      isStale: false,
    });

    const response = await GET(createRequest("https://app.test/api/v1/representatives?address=123%20Main"));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Failed to fetch representatives",
    });
  });
});
