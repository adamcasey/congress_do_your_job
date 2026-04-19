import {
  CongressApiResponse,
  Bill,
  BillTitle,
  Member,
  Vote,
  Amendment,
  HouseVoteListItem,
  HouseVoteDetail,
  MemberRollCallVote,
} from "@/types/congress";

const CONGRESS_API_BASE = "https://api.congress.gov/v3";
const CURRENT_CONGRESS = 119; // 119th Congress (2025-2027)

/**
 * Congress.gov API client
 * Provides resilient access to legislative data with error handling
 */

interface FetchOptions {
  limit?: number;
  offset?: number;
  sort?: "updateDate+desc" | "updateDate+asc";
  fromDateTime?: string;
  toDateTime?: string;
}

class CongressApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public responseBody?: unknown,
  ) {
    super(message);
    this.name = "CongressApiError";
  }
}

/**
 * Build Congress.gov API URL with authentication
 */
function buildApiUrl(path: string, params?: Record<string, string | number | undefined>): string {
  const apiKey = process.env.CONGRESS_API_KEY;

  if (!apiKey) {
    throw new CongressApiError("CONGRESS_API_KEY environment variable not configured");
  }

  const url = new URL(`${CONGRESS_API_BASE}${path}`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("format", "json");

  // Collect params that must not be percent-encoded (e.g. sort uses + as a
  // direction separator: "updateDate+desc"). URLSearchParams encodes + to %2B
  // which some Congress.gov endpoints do not accept.
  const rawParams: string[] = [];

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === "sort") {
          rawParams.push(`sort=${String(value)}`);
        } else {
          url.searchParams.set(key, String(value));
        }
      }
    });
  }

  const base = url.toString();
  return rawParams.length > 0 ? `${base}&${rawParams.join("&")}` : base;
}

/**
 * Fetch from Congress.gov API with error handling
 */
async function fetchCongressApi<T>(
  path: string,
  params?: Record<string, string | number | undefined>,
): Promise<CongressApiResponse<T>> {
  const url = buildApiUrl(path, params);
  // Strip API key from logged URL for safety
  const safeUrl = url.replace(/api_key=[^&]+/, "api_key=REDACTED");
  console.log("[congress-api] fetchCongressApi url:", safeUrl);
  console.log("[congress-api] fetchCongressApi params:", JSON.stringify(params, null, 2));

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "CongressDoYourJob.com/1.0",
      },
    });

    console.log("[congress-api] response status:", response.status, response.statusText);

    if (!response.ok) {
      const errorBody = await response.text();
      console.log("[congress-api] error body:", errorBody);
      throw new CongressApiError(
        `Congress.gov API error: ${response.status} ${response.statusText}`,
        response.status,
        errorBody,
      );
    }

    const json = await response.json();
    console.log("[congress-api] response keys:", Object.keys(json));
    console.log("[congress-api] pagination:", JSON.stringify(json.pagination));
    console.log("[congress-api] bills count:", json.bills?.length ?? "no bills key");
    console.log("[congress-api] first 3 bills:", JSON.stringify(json.bills?.slice(0, 3), null, 2));
    return json;
  } catch (error) {
    if (error instanceof CongressApiError) {
      throw error;
    }

    throw new CongressApiError(
      `Failed to fetch from Congress.gov API: ${error instanceof Error ? error.message : "Unknown error"}`,
      undefined,
      error,
    );
  }
}

/**
 * Get list of bills with optional filtering
 */
export async function getBills(options: FetchOptions = {}): Promise<CongressApiResponse<Bill>> {
  const { limit = 20, offset = 0, sort = "updateDate+desc", fromDateTime, toDateTime } = options;

  return fetchCongressApi<Bill>(`/bill/${CURRENT_CONGRESS}`, {
    limit,
    offset,
    sort,
    fromDateTime,
    toDateTime,
  });
}

/**
 * Get specific bill details (single bill)
 */
export async function getBill(billType: string, billNumber: string, congress: number = CURRENT_CONGRESS): Promise<Bill> {
  const response = await fetchCongressApi<Bill>(`/bill/${congress}/${billType.toLowerCase()}/${billNumber}`);

  if (!response.bill) {
    throw new CongressApiError(`Bill ${billType} ${billNumber} not found`, 404);
  }

  return response.bill;
}

/**
 * Get bill actions (legislative history)
 */
export async function getBillActions(
  billType: string,
  billNumber: string,
  congress: number = CURRENT_CONGRESS,
  options: FetchOptions = {},
): Promise<CongressApiResponse<Bill>> {
  const { limit = 20, offset = 0 } = options;

  return fetchCongressApi<Bill>(`/bill/${congress}/${billType.toLowerCase()}/${billNumber}/actions`, { limit, offset });
}

/**
 * Get all titles for a bill (official, short, and popular names).
 * Short titles (e.g. "SAVE Act") are only available via this endpoint —
 * they are not included in the bill list or bill detail responses.
 */
export async function getBillTitles(
  billType: string,
  billNumber: string,
  congress: number = CURRENT_CONGRESS,
): Promise<BillTitle[]> {
  const response = await fetchCongressApi<BillTitle>(
    `/bill/${congress}/${billType.toLowerCase()}/${billNumber}/titles`,
  );
  return response.titles ?? [];
}

/**
 * Get bill summaries
 */
export async function getBillSummaries(
  billType: string,
  billNumber: string,
  congress: number = CURRENT_CONGRESS,
): Promise<CongressApiResponse<Bill>> {
  return fetchCongressApi<Bill>(`/bill/${congress}/${billType.toLowerCase()}/${billNumber}/summaries`);
}

/**
 * Get bills by subject/policy area
 */
export async function getBillsBySubject(subject: string, options: FetchOptions = {}): Promise<CongressApiResponse<Bill>> {
  // Note: Congress.gov API doesn't have direct subject filtering
  // This would require fetching bills and filtering client-side
  // or using a different approach
  throw new Error("Subject filtering not yet implemented");
}

/**
 * Get member information
 */
export async function getMember(bioguideId: string): Promise<Member> {
  const response = await fetchCongressApi<Member>(`/member/${bioguideId}`);

  if (!response.member) {
    throw new CongressApiError(`Member ${bioguideId} not found`, 404);
  }

  return response.member;
}

/**
 * Get current members by chamber
 */
export async function getMembersByChamber(
  chamber: "house" | "senate",
  options: FetchOptions = {},
): Promise<CongressApiResponse<Member>> {
  const { limit = 250, offset = 0 } = options;

  return fetchCongressApi<Member>(`/member/${chamber.toLowerCase()}`, {
    limit,
    offset,
    currentMember: "true",
  });
}

/**
 * Get sponsored legislation for a member.
 * Congress.gov returns a `sponsoredLegislation` key for this endpoint (not `bills`).
 * Normalized here so callers can always read `response.bills`.
 */
export async function getMemberSponsoredLegislation(
  bioguideId: string,
  options: FetchOptions = {},
): Promise<CongressApiResponse<Bill>> {
  const { limit = 20, offset = 0 } = options;

  const raw = await fetchCongressApi<Bill>(`/member/${bioguideId}/sponsored-legislation`, { limit, offset });
  return { ...raw, bills: raw.sponsoredLegislation ?? raw.bills ?? [] };
}

/**
 * Get member cosponsored legislation.
 * Congress.gov returns a `cosponsoredLegislation` key for this endpoint (not `bills`).
 * Normalized here so callers can always read `response.bills`.
 */
export async function getMemberCosponsoredLegislation(
  bioguideId: string,
  options: FetchOptions = {},
): Promise<CongressApiResponse<Bill>> {
  const { limit = 20, offset = 0 } = options;

  const raw = await fetchCongressApi<Bill>(`/member/${bioguideId}/cosponsored-legislation`, { limit, offset });
  return { ...raw, bills: raw.cosponsoredLegislation ?? raw.bills ?? [] };
}

/**
 * Get amendment details
 */
export async function getAmendment(
  amendmentType: string,
  amendmentNumber: string,
  congress: number = CURRENT_CONGRESS,
): Promise<Amendment> {
  const response = await fetchCongressApi<Amendment>(
    `/amendment/${congress}/${amendmentType.toLowerCase()}/${amendmentNumber}`,
  );

  if (!response.amendments || response.amendments.length === 0) {
    throw new CongressApiError(`Amendment ${amendmentType} ${amendmentNumber} not found`, 404);
  }

  return response.amendments[0];
}

/**
 * Fetch all current members of Congress with internal pagination.
 * Congress.gov /member does not support name search — callers must filter client-side.
 */
export async function getAllCurrentMembers(): Promise<Member[]> {
  const allMembers: Member[] = [];
  let offset = 0;
  const limit = 250;

  while (true) {
    const response = await fetchCongressApi<Member>(`/member`, {
      limit,
      offset,
      currentMember: "true",
    });

    const batch = response.members ?? [];
    allMembers.push(...batch);

    if (batch.length < limit) break;
    offset += limit;
  }

  return allMembers;
}

/**
 * Search members of Congress by name.
 * Fetches all current members and filters client-side because the Congress.gov
 * /member endpoint does not support free-text name search via the q param
 * (q expects a bioguideId).
 */
export async function searchMembers(query: string, options: FetchOptions = {}): Promise<CongressApiResponse<Member>> {
  const { limit = 20, offset = 0 } = options;

  const allMembers = await getAllCurrentMembers();

  const normalized = query.toLowerCase().trim();
  const filtered = allMembers.filter((m) => m.name?.toLowerCase().includes(normalized));
  const paginated = filtered.slice(offset, offset + limit);

  return {
    members: paginated,
    pagination: { count: paginated.length },
  };
}

/**
 * Get current congress number
 */
export function getCurrentCongress(): number {
  return CURRENT_CONGRESS;
}

/**
 * Calculate congress number from year
 */
export function getCongressFromYear(year: number): number {
  return Math.floor((year - 1789) / 2) + 1;
}

/**
 * Get recent House roll-call vote list for a congress.
 * Returns lightweight vote records — does NOT include individual member positions.
 */
export async function getHouseVotes(
  congress: number = CURRENT_CONGRESS,
  options: { limit?: number; offset?: number } = {},
): Promise<CongressApiResponse<HouseVoteListItem>> {
  const { limit = 20, offset = 0 } = options;
  return fetchCongressApi<HouseVoteListItem>(`/house-vote/${congress}`, {
    limit,
    offset,
    sort: "date+desc",
  });
}

/**
 * Get full detail for a single House roll-call vote, including how each
 * member voted. The Congress.gov response nests member votes under
 * houseRollCallVote.members.houseRollCallMember[].
 */
export async function getHouseVoteDetail(congress: number, session: number, rollNumber: number): Promise<HouseVoteDetail> {
  const raw = await fetchCongressApi<Record<string, unknown>>(`/house-vote/${congress}/${session}/${rollNumber}`);

  const vote = raw.houseRollCallVote as Record<string, unknown> | undefined;
  if (!vote) {
    throw new CongressApiError(`House vote ${congress}/${session}/${rollNumber} not found`, 404);
  }

  // Congress.gov nests member votes under members.houseRollCallMember
  const rawMembers = (vote.members as Record<string, unknown> | undefined)?.houseRollCallMember;
  const memberVotes: MemberRollCallVote[] = Array.isArray(rawMembers)
    ? rawMembers.map((m: Record<string, unknown>) => ({
        bioguideId: String(m.bioguideId ?? ""),
        name: String(m.name ?? ""),
        party: String(m.party ?? ""),
        state: String(m.state ?? ""),
        vote: (m.vote ?? "Not Voting") as MemberRollCallVote["vote"],
      }))
    : [];

  // Parse vote totals from votePartyTotal array
  const partyTotals = vote.votePartyTotal as Array<Record<string, unknown>> | undefined;
  let yea = 0,
    nay = 0,
    present = 0,
    notVoting = 0;
  if (Array.isArray(partyTotals)) {
    for (const row of partyTotals) {
      yea += Number(row.yea ?? 0);
      nay += Number(row.nay ?? 0);
      present += Number(row.present ?? 0);
      notVoting += Number(row.notVoting ?? 0);
    }
  }

  const billData = vote.bill as Record<string, unknown> | undefined;

  return {
    congress: Number(vote.congress ?? congress),
    session: Number(vote.session ?? session),
    rollNumber: Number(vote.rollNumber ?? rollNumber),
    date: String(vote.date ?? ""),
    question: String(vote.question ?? ""),
    result: String(vote.result ?? ""),
    type: vote.type ? String(vote.type) : undefined,
    description: vote.description ? String(vote.description) : undefined,
    url: String(vote.url ?? ""),
    bill: billData
      ? {
          congress: Number(billData.congress ?? congress),
          number: String(billData.number ?? ""),
          type: String(billData.type ?? "") as import("@/types/congress").BillType,
          url: String(billData.url ?? ""),
        }
      : undefined,
    voteTotals: { yea, nay, present, notVoting },
    memberVotes,
  };
}

export { CongressApiError };
