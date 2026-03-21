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

/** Minimal valid Google Civic API response with one senator and one house member */
const mockCivicResponse = {
  normalizedInput: { city: "Springfield", state: "MO", zip: "65801" },
  offices: [
    {
      name: "United States Senate",
      divisionId: "ocd-division/country:us/state:mo",
      levels: ["country"],
      roles: ["legislatorUpperBody"],
      officialIndices: [0],
    },
    {
      name: "United States House of Representatives",
      divisionId: "ocd-division/country:us/state:mo/cd:7",
      levels: ["country"],
      roles: ["legislatorLowerBody"],
      officialIndices: [1],
    },
  ],
  officials: [
    {
      name: "Jane Smith",
      phones: ["202-224-1234"],
      urls: ["https://smith.senate.gov"],
      photoUrl: "https://example.com/smith.jpg",
      party: "Democratic Party",
    },
    {
      name: "John Doe",
      phones: ["202-225-5678"],
      urls: ["https://doe.house.gov"],
      photoUrl: "https://example.com/doe.jpg",
      party: "Republican Party",
    },
  ],
};

function createRequest(url: string) {
  return {
    nextUrl: new URL(url),
  } as any;
}

describe("GET /api/v1/representatives", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOOGLE_API_KEY = "test-google-key";
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

  it("returns 500 when Google API key is missing", async () => {
    delete process.env.GOOGLE_API_KEY;

    const response = await GET(createRequest("https://app.test/api/v1/representatives?address=123%20Main"));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "API configuration error",
    });
  });

  it("maps senate offices to 'US Senate' area", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockCivicResponse),
      }),
    );
    getOrFetchMock.mockImplementation(async (_key, fetcher) => ({
      data: await fetcher(),
      status: "MISS",
      isStale: false,
    }));

    const response = await GET(createRequest("https://app.test/api/v1/representatives?address=123%20Main%20St%20Springfield%20MO"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    const senator = body.data.representatives.find((r: { area: string }) => r.area === "US Senate");
    expect(senator).toBeDefined();
    expect(senator.name).toBe("Jane Smith");
  });

  it("maps house offices to 'US House' area", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockCivicResponse),
      }),
    );
    getOrFetchMock.mockImplementation(async (_key, fetcher) => ({
      data: await fetcher(),
      status: "MISS",
      isStale: false,
    }));

    const response = await GET(createRequest("https://app.test/api/v1/representatives?address=123%20Main%20St%20Springfield%20MO"));
    const body = await response.json();
    const houseMember = body.data.representatives.find((r: { area: string }) => r.area === "US House");
    expect(houseMember).toBeDefined();
    expect(houseMember.name).toBe("John Doe");
  });

  it("parses district from house office divisionId", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockCivicResponse),
      }),
    );
    getOrFetchMock.mockImplementation(async (_key, fetcher) => ({
      data: await fetcher(),
      status: "MISS",
      isStale: false,
    }));

    const response = await GET(createRequest("https://app.test/api/v1/representatives?address=123%20Main%20St%20Springfield%20MO"));
    const body = await response.json();
    expect(body.data.state).toBe("MO");
    expect(body.data.district).toBe("7");
  });

  it("returns 500 when upstream returns 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: vi.fn().mockResolvedValue({ error: { message: "not found" } }),
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

  it("returns 500 when upstream fails with non-404 status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({ error: { message: "server error" } }),
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

  it("returns representatives with cache headers on cache hit", async () => {
    getOrFetchMock.mockResolvedValue({
      data: {
        location: "Springfield, MO, 65801",
        state: "MO",
        district: "7",
        representatives: [
          { id: "ocd-division/country:us/state:mo-0", name: "Jane Smith", area: "US Senate", phone: "202-224-1234" },
        ],
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
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(hashIdentifierMock).toHaveBeenCalledWith("123 main");
    expect(buildCacheKeyMock).toHaveBeenCalledWith("civic", "representatives", "address-hash");
    expect(getOrFetchMock).toHaveBeenCalledWith("cache:key", expect.any(Function), 3600);
  });

  it("returns 500 when cache layer throws", async () => {
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

  it("uses empty error message when upstream error response body is unparseable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockRejectedValue(new Error("not json")),
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

  it("falls back to parsing state from divisionId when normalizedInput.state is absent", async () => {
    const responseWithoutState = {
      normalizedInput: { city: "Springfield", zip: "65801" },
      offices: [
        {
          name: "United States Senate",
          divisionId: "ocd-division/country:us/state:mo",
          levels: ["country"],
          roles: ["legislatorUpperBody"],
          officialIndices: [0],
        },
      ],
      officials: [{ name: "Jane Smith", phones: ["202-224-1234"] }],
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(responseWithoutState),
      }),
    );
    getOrFetchMock.mockImplementation(async (_key, fetcher) => ({
      data: await fetcher(),
      status: "MISS",
      isStale: false,
    }));

    const response = await GET(createRequest("https://app.test/api/v1/representatives?address=123%20Main%20St%20Springfield%20MO"));
    const body = await response.json();
    expect(body.success).toBe(true);
    const senator = body.data.representatives.find((r: { area: string }) => r.area === "US Senate");
    expect(senator.state).toBe("MO");
  });

  it("returns 500 when civic response is missing offices or officials", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ normalizedInput: { state: "MO" } }),
      }),
    );
    getOrFetchMock.mockImplementation(async (_key, fetcher) => ({
      data: await fetcher(),
      status: "MISS",
      isStale: false,
    }));

    const response = await GET(createRequest("https://app.test/api/v1/representatives?address=123%20Main%20St"));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Failed to fetch representatives. Please try again.",
    });
  });

  it("skips officials with out-of-bounds indices", async () => {
    const responseWithBadIndex = {
      ...mockCivicResponse,
      offices: [
        {
          name: "United States Senate",
          divisionId: "ocd-division/country:us/state:mo",
          levels: ["country"],
          roles: ["legislatorUpperBody"],
          officialIndices: [99],
        },
      ],
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(responseWithBadIndex),
      }),
    );
    getOrFetchMock.mockImplementation(async (_key, fetcher) => ({
      data: await fetcher(),
      status: "MISS",
      isStale: false,
    }));

    const response = await GET(createRequest("https://app.test/api/v1/representatives?address=123%20Main%20St%20Springfield%20MO"));
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.representatives).toHaveLength(0);
  });

  it("skips non-federal offices (state/local)", async () => {
    const responseWithStateOffice = {
      ...mockCivicResponse,
      offices: [
        ...mockCivicResponse.offices,
        {
          name: "Governor",
          divisionId: "ocd-division/country:us/state:mo",
          levels: ["administrativeArea1"],
          roles: ["headOfGovernment"],
          officialIndices: [2],
        },
      ],
      officials: [
        ...mockCivicResponse.officials,
        { name: "Governor Person", phones: ["573-751-3222"] },
      ],
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(responseWithStateOffice),
      }),
    );
    getOrFetchMock.mockImplementation(async (_key, fetcher) => ({
      data: await fetcher(),
      status: "MISS",
      isStale: false,
    }));

    const response = await GET(createRequest("https://app.test/api/v1/representatives?address=123%20Main%20St%20Springfield%20MO"));
    const body = await response.json();
    expect(body.success).toBe(true);
    // Only federal reps should be included — governor filtered out
    expect(body.data.representatives.every((r: { area: string }) => r.area === "US Senate" || r.area === "US House")).toBe(true);
    expect(body.data.representatives.find((r: { name: string }) => r.name === "Governor Person")).toBeUndefined();
  });
});
