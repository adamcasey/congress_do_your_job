import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

/**
 * Member search route tests
 *
 * Verifies that the /api/v1/members/search endpoint:
 * 1. Fetches the full current-member roster (cached) instead of passing the
 *    raw name query to Congress.gov (which would be interpreted as a bioguideId)
 * 2. Filters members by name client-side
 * 3. Handles edge cases: short queries, long queries, no matches, cache errors
 */

const mockGetAllCurrentMembers = vi.fn();

vi.mock("@/lib/congress-api", () => ({
  getAllCurrentMembers: (...args: unknown[]) => mockGetAllCurrentMembers(...args),
}));

vi.mock("@/lib/cache", () => ({
  buildCacheKey: vi.fn((...args: string[]) => args.join(":")),
  getOrFetch: vi.fn(async (_key: string, fetcher: () => Promise<unknown>) => ({
    data: await fetcher(),
    status: "MISS",
    isStale: false,
  })),
  CacheTTL: { LEGISLATOR_PROFILE: 2592000 },
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

vi.mock("@/lib/api-response", () => ({
  jsonSuccess: (data: unknown) =>
    new Response(JSON.stringify({ success: true, data }), {
      headers: { "Content-Type": "application/json" },
    }),
  jsonError: (message: string, status: number) =>
    new Response(JSON.stringify({ success: false, error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
}));

const SAMPLE_MEMBERS = [
  {
    bioguideId: "S000033",
    name: "Sanders, Bernard",
    state: "VT",
    chamber: "Senate",
    depiction: { imageUrl: "https://example.com/sanders.jpg" },
  },
  {
    bioguideId: "P000197",
    name: "Pelosi, Nancy",
    state: "CA",
    chamber: "House",
    district: 11,
    depiction: { imageUrl: "https://example.com/pelosi.jpg" },
  },
  {
    bioguideId: "M000303",
    name: "McConnell, Mitch",
    state: "KY",
    chamber: "Senate",
  },
];

async function callRoute(q: string) {
  const { GET } = await import("@/app/api/v1/members/search/route");
  const request = new NextRequest(`http://localhost/api/v1/members/search?q=${encodeURIComponent(q)}`);
  return GET(request);
}

describe("GET /api/v1/members/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAllCurrentMembers.mockResolvedValue(SAMPLE_MEMBERS);
  });

  it("returns empty array for queries shorter than 2 characters", async () => {
    const response = await callRoute("s");
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.members).toEqual([]);
    expect(mockGetAllCurrentMembers).not.toHaveBeenCalled();
  });

  it("returns 400 for queries longer than 100 characters", async () => {
    const response = await callRoute("a".repeat(101));
    expect(response.status).toBe(400);
  });

  it("filters members by name substring (case-insensitive)", async () => {
    const response = await callRoute("sand");
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.members).toHaveLength(1);
    expect(body.data.members[0].bioguideId).toBe("S000033");
    expect(body.data.members[0].name).toBe("Sanders, Bernard");
  });

  it("filters members case-insensitively", async () => {
    const response = await callRoute("PELOSI");
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.members).toHaveLength(1);
    expect(body.data.members[0].bioguideId).toBe("P000197");
  });

  it("returns multiple matches when several names contain the query", async () => {
    // "an" appears in "Sanders" (S-a-n-d-e-r-s) and "Nancy" (N-a-n-c-y)
    const response = await callRoute("an");
    const body = await response.json();
    expect(body.success).toBe(true);
    // Sanders, Bernard and Pelosi, Nancy both contain "an"
    expect(body.data.members).toHaveLength(2);
  });

  it("includes district for House members but not Senate members", async () => {
    const response = await callRoute("pelosi");
    const body = await response.json();
    const pelosi = body.data.members[0];
    expect(pelosi.district).toBe(11);

    const response2 = await callRoute("mcconnell");
    const body2 = await response2.json();
    const mcconnell = body2.data.members[0];
    expect(mcconnell.district).toBeUndefined();
  });

  it("includes imageUrl when depiction is present", async () => {
    const response = await callRoute("sanders");
    const body = await response.json();
    expect(body.data.members[0].imageUrl).toBe("https://example.com/sanders.jpg");
  });

  it("returns empty members array when no match is found", async () => {
    const response = await callRoute("zzznomatch");
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.members).toEqual([]);
  });

  it("caps results at 10 members", async () => {
    const manyMembers = Array.from({ length: 20 }, (_, i) => ({
      bioguideId: `X${String(i).padStart(6, "0")}`,
      name: `Smith, Person ${i}`,
      state: "TX",
      chamber: "House" as const,
    }));
    mockGetAllCurrentMembers.mockResolvedValue(manyMembers);

    const response = await callRoute("smith");
    const body = await response.json();
    expect(body.data.members).toHaveLength(10);
  });

  it("returns 500 when getAllCurrentMembers throws", async () => {
    mockGetAllCurrentMembers.mockRejectedValue(new Error("Congress API down"));
    const response = await callRoute("sanders");
    expect(response.status).toBe(500);
  });

  it("does NOT pass the raw name query string to the Congress.gov member API", async () => {
    await callRoute("sanders");
    // getAllCurrentMembers is called with no arguments (fetches full roster)
    expect(mockGetAllCurrentMembers).toHaveBeenCalledWith();
  });
});
