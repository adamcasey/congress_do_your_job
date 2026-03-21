import { beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectId } from "mongodb";
import { GET as listGET } from "@/app/api/v1/petitions/route";
import { GET as detailGET } from "@/app/api/v1/petitions/[slug]/route";
import { POST as signPOST } from "@/app/api/v1/petitions/[slug]/sign/route";

// ─── Hoisted mocks ─────────────────────────────────────────────────────────────

const { getCollectionMock, getOrFetchMock, invalidateCacheMock, getAuthSessionMock } = vi.hoisted(() => ({
  getCollectionMock: vi.fn(),
  getOrFetchMock: vi.fn(),
  invalidateCacheMock: vi.fn(),
  getAuthSessionMock: vi.fn(),
}));

vi.mock("@/lib/mongodb", () => ({ getCollection: getCollectionMock }));
vi.mock("@/lib/cache", () => ({
  getOrFetch: getOrFetchMock,
  buildCacheKey: (...parts: string[]) => parts.join(":"),
  invalidateCache: invalidateCacheMock,
  CacheTTL: { PETITIONS: 300 },
}));
vi.mock("@/lib/auth", () => ({ getAuthSession: getAuthSessionMock }));

// ─── Test helpers ──────────────────────────────────────────────────────────────

function makeRequest(searchParams?: Record<string, string>, body?: unknown) {
  const url = new URL("http://localhost/api/v1/petitions");
  if (searchParams) {
    for (const [k, v] of Object.entries(searchParams)) url.searchParams.set(k, v);
  }
  return {
    nextUrl: url,
    json: vi.fn().mockResolvedValue(body ?? {}),
  } as any;
}

function makeParams(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

const petitionId = new ObjectId();
const fakePetition = {
  _id: petitionId,
  title: "Pass the budget on time",
  slug: "pass-budget-on-time",
  description: "Congress should pass annual budgets before the deadline.",
  category: "budget",
  letterTemplate: "Dear Representative, please pass the budget on time.",
  targetLevel: "federal",
  status: "active" as const,
  signatureCount: 42,
  lettersDelivered: 10,
  goal: 500,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

// ─── GET /api/v1/petitions ─────────────────────────────────────────────────────

describe("GET /api/v1/petitions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 for invalid status param", async () => {
    const res = await listGET(makeRequest({ status: "invalid" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("returns petition list from cache", async () => {
    getOrFetchMock.mockResolvedValue({
      data: [
        {
          id: petitionId.toString(),
          title: "Pass the budget on time",
          slug: "pass-budget-on-time",
          description: "Congress should pass budgets before deadlines.",
          category: "budget",
          status: "active",
          signatureCount: 42,
          goal: 500,
          progressPercentage: 8,
        },
      ],
      status: "HIT",
      isStale: false,
    });

    const res = await listGET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.petitions).toHaveLength(1);
    expect(body.data.petitions[0].slug).toBe("pass-budget-on-time");
  });

  it("returns empty list when cache returns null data", async () => {
    getOrFetchMock.mockResolvedValue({ data: null, status: "MISS", isStale: false });
    const res = await listGET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.petitions).toEqual([]);
  });

  it("invokes fetcher that queries MongoDB by status", async () => {
    const toArray = vi.fn().mockResolvedValue([fakePetition]);
    const sort = vi.fn().mockReturnValue({ toArray });
    const find = vi.fn().mockReturnValue({ sort });
    getCollectionMock.mockResolvedValue({ find });

    // Invoke the fetcher passed to getOrFetch
    getOrFetchMock.mockImplementation(async (_key: string, fetcher: () => Promise<unknown>) => ({
      data: await fetcher(),
      status: "MISS",
      isStale: false,
    }));

    const res = await listGET(makeRequest({ status: "active" }));
    expect(res.status).toBe(200);
    expect(find).toHaveBeenCalledWith({ status: "active" });
  });

  it("returns 500 on unexpected errors", async () => {
    getOrFetchMock.mockRejectedValue(new Error("boom"));
    const res = await listGET(makeRequest());
    expect(res.status).toBe(500);
  });
});

// ─── GET /api/v1/petitions/[slug] ─────────────────────────────────────────────

describe("GET /api/v1/petitions/[slug]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAuthSessionMock.mockResolvedValue({ userId: null });
  });

  it("returns 400 for invalid slug", async () => {
    const res = await detailGET(makeRequest(), makeParams("INVALID SLUG!"));
    expect(res.status).toBe(400);
  });

  it("returns 404 when petition not found in cache", async () => {
    getOrFetchMock.mockResolvedValue({ data: null, status: "MISS", isStale: false });
    const res = await detailGET(makeRequest(), makeParams("nonexistent"));
    expect(res.status).toBe(404);
  });

  it("returns 404 when fetcher throws NOT_FOUND", async () => {
    getOrFetchMock.mockImplementation(async (_key: string, fetcher: () => Promise<unknown>) => {
      await fetcher();
      return { data: null, status: "MISS", isStale: false };
    });
    const findOne = vi.fn().mockResolvedValue(null);
    getCollectionMock.mockResolvedValue({ findOne });

    const res = await detailGET(makeRequest(), makeParams("missing-petition"));
    expect(res.status).toBe(404);
  });

  it("returns petition detail with hasSigned=false for unauthenticated user", async () => {
    const detail = {
      id: petitionId.toString(),
      title: fakePetition.title,
      slug: fakePetition.slug,
      description: fakePetition.description,
      category: fakePetition.category,
      status: "active" as const,
      signatureCount: 42,
      goal: 500,
      progressPercentage: 8,
      letterTemplate: fakePetition.letterTemplate,
      targetLevel: "federal",
      lettersDelivered: 10,
      createdAt: fakePetition.createdAt.toISOString(),
    };
    getOrFetchMock.mockResolvedValue({ data: detail, status: "HIT", isStale: false });

    const res = await detailGET(makeRequest(), makeParams("pass-budget-on-time"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.hasSigned).toBe(false);
    expect(body.data.petition.slug).toBe("pass-budget-on-time");
  });

  it("returns hasSigned=true when authenticated user has signed", async () => {
    const detail = {
      id: petitionId.toString(),
      title: fakePetition.title,
      slug: fakePetition.slug,
      description: fakePetition.description,
      category: fakePetition.category,
      status: "active" as const,
      signatureCount: 43,
      goal: 500,
      progressPercentage: 9,
      letterTemplate: fakePetition.letterTemplate,
      targetLevel: "federal",
      lettersDelivered: 10,
      createdAt: fakePetition.createdAt.toISOString(),
    };
    getOrFetchMock.mockResolvedValue({ data: detail, status: "HIT", isStale: false });
    getAuthSessionMock.mockResolvedValue({ userId: "clerk_user_123" });
    getCollectionMock.mockResolvedValue({
      findOne: vi.fn().mockResolvedValue({ _id: new ObjectId() }),
    });

    const res = await detailGET(makeRequest(), makeParams("pass-budget-on-time"));
    const body = await res.json();
    expect(body.data.hasSigned).toBe(true);
  });
});

// ─── POST /api/v1/petitions/[slug]/sign ───────────────────────────────────────

describe("POST /api/v1/petitions/[slug]/sign", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateCacheMock.mockResolvedValue(undefined);
  });

  it("returns 401 when user is not authenticated", async () => {
    getAuthSessionMock.mockResolvedValue({ userId: null });
    const res = await signPOST(makeRequest({}, { deliveryMethod: "email" }), makeParams("pass-budget-on-time"));
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid deliveryMethod", async () => {
    getAuthSessionMock.mockResolvedValue({ userId: "user_1" });
    const res = await signPOST(makeRequest({}, { deliveryMethod: "fax" }), makeParams("pass-budget-on-time"));
    expect(res.status).toBe(400);
  });

  it("returns 404 when petition does not exist", async () => {
    getAuthSessionMock.mockResolvedValue({ userId: "user_1" });
    getCollectionMock.mockResolvedValue({ findOne: vi.fn().mockResolvedValue(null) });
    const res = await signPOST(makeRequest({}, { deliveryMethod: "email" }), makeParams("no-such-petition"));
    expect(res.status).toBe(404);
  });

  it("returns 409 when petition is not active", async () => {
    getAuthSessionMock.mockResolvedValue({ userId: "user_1" });
    getCollectionMock.mockResolvedValue({
      findOne: vi.fn().mockResolvedValue({ ...fakePetition, status: "closed" }),
    });
    const res = await signPOST(makeRequest({}, { deliveryMethod: "email" }), makeParams("pass-budget-on-time"));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/no longer accepting/);
  });

  it("returns 409 when user has already signed", async () => {
    getAuthSessionMock.mockResolvedValue({ userId: "user_1" });
    let callCount = 0;
    getCollectionMock.mockImplementation(async (name: string) => {
      if (name === "petitions") return { findOne: vi.fn().mockResolvedValue(fakePetition) };
      // petition_signatures — return existing signature
      callCount++;
      if (callCount === 1) return { findOne: vi.fn().mockResolvedValue({ _id: new ObjectId() }) };
      return { findOne: vi.fn().mockResolvedValue(null) };
    });

    const res = await signPOST(makeRequest({}, { deliveryMethod: "email" }), makeParams("pass-budget-on-time"));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/already signed/);
  });

  it("creates signature and increments count on success", async () => {
    getAuthSessionMock.mockResolvedValue({ userId: "clerk_user_abc" });

    const insertOne = vi.fn().mockResolvedValue({ insertedId: new ObjectId() });
    const updateOne = vi.fn().mockResolvedValue({ modifiedCount: 1 });

    getCollectionMock.mockImplementation(async (name: string) => {
      if (name === "petitions") return { findOne: vi.fn().mockResolvedValue(fakePetition), updateOne };
      return { findOne: vi.fn().mockResolvedValue(null), insertOne };
    });

    const res = await signPOST(
      makeRequest({}, { deliveryMethod: "email", customMessage: "Please act now!" }),
      makeParams("pass-budget-on-time"),
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.message).toMatch(/signed successfully/);
    expect(insertOne).toHaveBeenCalledTimes(1);
    expect(updateOne).toHaveBeenCalledWith(
      { _id: petitionId },
      expect.objectContaining({ $inc: { signatureCount: 1 } }),
    );
    expect(invalidateCacheMock).toHaveBeenCalledTimes(2);
  });

  it("returns 500 on unexpected database error", async () => {
    getAuthSessionMock.mockResolvedValue({ userId: "user_1" });
    getCollectionMock.mockRejectedValue(new Error("db exploded"));
    const res = await signPOST(makeRequest({}, { deliveryMethod: "email" }), makeParams("pass-budget-on-time"));
    expect(res.status).toBe(500);
  });
});
