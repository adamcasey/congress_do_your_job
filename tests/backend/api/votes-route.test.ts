import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/v1/votes/[bioguideId]/route";

const { getMemberMock, getHouseVotesMock, getHouseVoteDetailMock, buildCacheKeyMock, getOrFetchMock, MockCongressApiError } =
  vi.hoisted(() => {
    class HoistedCongressApiError extends Error {
      statusCode?: number;
      constructor(message: string, statusCode?: number) {
        super(message);
        this.statusCode = statusCode;
        this.name = "CongressApiError";
      }
    }
    return {
      getMemberMock: vi.fn(),
      getHouseVotesMock: vi.fn(),
      getHouseVoteDetailMock: vi.fn(),
      buildCacheKeyMock: vi.fn(),
      getOrFetchMock: vi.fn(),
      MockCongressApiError: HoistedCongressApiError,
    };
  });

vi.mock("@/lib/congress-api", () => ({
  getMember: getMemberMock,
  getHouseVotes: getHouseVotesMock,
  getHouseVoteDetail: getHouseVoteDetailMock,
  CongressApiError: MockCongressApiError,
  getCurrentCongress: () => 119,
}));

vi.mock("@/lib/cache", () => ({
  buildCacheKey: buildCacheKeyMock,
  getOrFetch: getOrFetchMock,
  CacheTTL: { LEGISLATIVE_DATA: 3600 },
}));

function makeMember(chamber: string) {
  return {
    bioguideId: "A000001",
    name: "Test Member",
    state: "CA",
    chamber,
    terms: { item: [{ chamber, startYear: 2025 }] },
  };
}

function makeVoteListItem(rollNumber: number) {
  return {
    congress: 119,
    session: 1,
    rollNumber,
    date: "2025-01-15",
    question: "On Passage",
    result: "Passed",
    description: "Some bill vote",
    url: "https://api.congress.gov/v3/house-vote/119/1/" + rollNumber,
  };
}

function makeVoteDetail(rollNumber: number, memberVote: string) {
  return {
    congress: 119,
    session: 1,
    rollNumber,
    date: "2025-01-15",
    question: "On Passage",
    result: "Passed",
    description: "Some bill vote",
    url: "https://api.congress.gov/v3/house-vote/119/1/" + rollNumber,
    voteTotals: { yea: 250, nay: 180, present: 0, notVoting: 5 },
    memberVotes: [
      { bioguideId: "A000001", name: "Test Member", party: "D", state: "CA", vote: memberVote },
    ],
  };
}

function createRequest(url: string) {
  return { nextUrl: new URL(url) } as any;
}

function makeParams(bioguideId: string) {
  return Promise.resolve({ bioguideId });
}

describe("GET /api/v1/votes/[bioguideId]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    buildCacheKeyMock.mockReturnValue("cache:key");
    getOrFetchMock.mockImplementation(async (_key: string, fetcher: () => Promise<unknown>) => ({
      data: await fetcher(),
      status: "MISS",
      isStale: false,
    }));
  });

  it("returns 400 for invalid bioguideId format", async () => {
    const req = createRequest("http://localhost/api/v1/votes/invalid");
    const res = await GET(req, { params: makeParams("invalid") });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("returns available=false for Senate members", async () => {
    getMemberMock.mockResolvedValue(makeMember("Senate"));

    const req = createRequest("http://localhost/api/v1/votes/S000001");
    const res = await GET(req, { params: makeParams("S000001") });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.available).toBe(false);
    expect(body.data.chamber).toBe("Senate");
    expect(body.data.unavailableReason).toBeDefined();
    expect(getHouseVotesMock).not.toHaveBeenCalled();
  });

  it("returns votes for House members", async () => {
    getMemberMock.mockResolvedValue(makeMember("House"));
    getHouseVotesMock.mockResolvedValue({ houseRollCallVotes: [makeVoteListItem(42)] });
    getHouseVoteDetailMock.mockResolvedValue(makeVoteDetail(42, "Yea"));

    const req = createRequest("http://localhost/api/v1/votes/A000001");
    const res = await GET(req, { params: makeParams("A000001") });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.available).toBe(true);
    expect(body.data.chamber).toBe("House");
    expect(body.data.votes).toHaveLength(1);
    expect(body.data.votes[0].rollNumber).toBe(42);
    expect(body.data.votes[0].memberVote).toBe("Yea");
  });

  it("handles Nay and Not Voting positions correctly", async () => {
    getMemberMock.mockResolvedValue(makeMember("House"));
    getHouseVotesMock.mockResolvedValue({
      houseRollCallVotes: [makeVoteListItem(10), makeVoteListItem(11)],
    });
    getHouseVoteDetailMock
      .mockResolvedValueOnce(makeVoteDetail(10, "Nay"))
      .mockResolvedValueOnce(makeVoteDetail(11, "Not Voting"));

    const req = createRequest("http://localhost/api/v1/votes/A000001");
    const res = await GET(req, { params: makeParams("A000001") });
    const body = await res.json();

    expect(body.data.votes[0].memberVote).toBe("Nay");
    expect(body.data.votes[1].memberVote).toBe("Not Voting");
  });

  it("returns memberVote=null when member is not in the vote detail", async () => {
    getMemberMock.mockResolvedValue(makeMember("House"));
    getHouseVotesMock.mockResolvedValue({ houseRollCallVotes: [makeVoteListItem(99)] });
    getHouseVoteDetailMock.mockResolvedValue({
      ...makeVoteDetail(99, "Yea"),
      // memberVotes does not include bioguideId A000001
      memberVotes: [{ bioguideId: "B000002", name: "Other", party: "R", state: "TX", vote: "Yea" }],
    });

    const req = createRequest("http://localhost/api/v1/votes/A000001");
    const res = await GET(req, { params: makeParams("A000001") });
    const body = await res.json();

    expect(body.data.votes[0].memberVote).toBeNull();
  });

  it("returns empty votes array when no house votes available", async () => {
    getMemberMock.mockResolvedValue(makeMember("House"));
    getHouseVotesMock.mockResolvedValue({ houseRollCallVotes: [] });

    const req = createRequest("http://localhost/api/v1/votes/A000001");
    const res = await GET(req, { params: makeParams("A000001") });
    const body = await res.json();

    expect(body.data.available).toBe(true);
    expect(body.data.votes).toHaveLength(0);
  });

  it("returns 404 when member is not found", async () => {
    getMemberMock.mockRejectedValue(new MockCongressApiError("Member not found", 404));

    const req = createRequest("http://localhost/api/v1/votes/Z999999");
    const res = await GET(req, { params: makeParams("Z999999") });
    expect(res.status).toBe(404);
  });

  it("returns 500 on unexpected errors", async () => {
    getMemberMock.mockRejectedValue(new Error("boom"));

    const req = createRequest("http://localhost/api/v1/votes/A000001");
    const res = await GET(req, { params: makeParams("A000001") });
    expect(res.status).toBe(500);
  });

  it("skips failed vote detail fetches gracefully", async () => {
    getMemberMock.mockResolvedValue(makeMember("House"));
    getHouseVotesMock.mockResolvedValue({
      houseRollCallVotes: [makeVoteListItem(1), makeVoteListItem(2)],
    });
    // First detail succeeds, second fails
    getHouseVoteDetailMock
      .mockResolvedValueOnce(makeVoteDetail(1, "Yea"))
      .mockRejectedValueOnce(new Error("Network error"));

    const req = createRequest("http://localhost/api/v1/votes/A000001");
    const res = await GET(req, { params: makeParams("A000001") });
    const body = await res.json();

    // Only the successful vote is returned
    expect(body.data.votes).toHaveLength(1);
    expect(body.data.votes[0].rollNumber).toBe(1);
  });
});
