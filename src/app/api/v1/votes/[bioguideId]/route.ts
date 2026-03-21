import { NextRequest } from "next/server";
import { getMember, getHouseVotes, getHouseVoteDetail, CongressApiError, getCurrentCongress } from "@/lib/congress-api";
import { getOrFetch, buildCacheKey, CacheTTL } from "@/lib/cache";
import { createLogger } from "@/lib/logger";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { HouseVoteDetail, MemberRollCallVote } from "@/types/congress";

const logger = createLogger("VotesAPI");

const BIOGUIDE_ID_PATTERN = /^[A-Z]\d{6}$/;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 20;

export interface MemberVoteRecord {
  rollNumber: number;
  session: number;
  date: string;
  question: string;
  result: string;
  description?: string;
  memberVote: MemberRollCallVote["vote"] | null;
  bill?: {
    congress: number;
    number: string;
    type: string;
    url: string;
  };
}

export interface VotingRecordResponse {
  bioguideId: string;
  chamber: "House" | "Senate";
  available: boolean;
  /** Populated when available === false */
  unavailableReason?: string;
  votes?: MemberVoteRecord[];
  congress?: number;
}

/**
 * Voting record API
 * GET /api/v1/votes/[bioguideId]?limit=10
 *
 * For House members: returns the member's position on their most recent N
 * roll-call votes by fetching the vote list then concurrently fetching each
 * detail to find the member's individual position.
 *
 * For Senate members: returns available=false with an explanatory message.
 * The Congress.gov senate-vote endpoint is not yet integrated.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bioguideId: string }> },
) {
  try {
    const { bioguideId } = await params;

    if (!bioguideId || !BIOGUIDE_ID_PATTERN.test(bioguideId)) {
      return jsonError(
        "Invalid bioguideId. Expected format: one uppercase letter followed by six digits (e.g., S001191)",
        400,
      );
    }

    const limit = Math.min(
      Math.max(Number(request.nextUrl.searchParams.get("limit")) || DEFAULT_LIMIT, 1),
      MAX_LIMIT,
    );

    const cacheKey = buildCacheKey("votes", "member", `${bioguideId}-${limit}`);

    const result = await getOrFetch<VotingRecordResponse>(
      cacheKey,
      () => buildVotingRecord(bioguideId, limit),
      CacheTTL.LEGISLATIVE_DATA,
    );

    if (!result.data) {
      return jsonError("Failed to fetch voting record", 500);
    }

    return jsonSuccess(result.data, {
      headers: {
        "X-Cache-Status": result.status,
        "X-Cache-Stale": result.isStale ? "true" : "false",
        ...(result.age !== undefined && { "X-Cache-Age": result.age.toString() }),
      },
    });
  } catch (error) {
    logger.error("Votes API error:", error);

    if (error instanceof CongressApiError) {
      const status = error.statusCode === 404 ? 404 : error.statusCode || 500;
      const message = error.statusCode === 404 ? "Member not found" : error.message;
      return jsonError(message, status);
    }

    return jsonError("Failed to fetch voting record", 500);
  }
}

async function buildVotingRecord(bioguideId: string, limit: number): Promise<VotingRecordResponse> {
  const congress = getCurrentCongress();

  // Determine member chamber before fetching votes
  const member = await getMember(bioguideId);
  const chamberRaw = (member.chamber as string) ?? "";
  const isHouse =
    chamberRaw.toLowerCase().includes("house") ||
    member.terms?.item?.at(-1)?.chamber?.toLowerCase().includes("house");

  if (!isHouse) {
    return {
      bioguideId,
      chamber: "Senate",
      available: false,
      unavailableReason:
        "Senate roll-call vote data is not yet available. We are working to integrate this data source.",
    };
  }

  // Derive the current session (119th Congress started Jan 3, 2025 — session 1)
  const session = deriveCurrentSession(congress);

  // Fetch recent vote list — lightweight, no member positions
  const voteListResponse = await getHouseVotes(congress, { limit, offset: 0 });
  const voteList = voteListResponse.houseRollCallVotes ?? [];

  if (voteList.length === 0) {
    return { bioguideId, chamber: "House", available: true, votes: [], congress };
  }

  // Concurrently fetch detail for each vote to get member positions
  const details = await Promise.allSettled(
    voteList.map((v) => getHouseVoteDetail(congress, v.session ?? session, v.rollNumber)),
  );

  const votes: MemberVoteRecord[] = details
    .filter((d): d is PromiseFulfilledResult<HouseVoteDetail> => d.status === "fulfilled")
    .map((d) => {
      const detail = d.value;
      const memberRecord = detail.memberVotes?.find((m) => m.bioguideId === bioguideId);
      return {
        rollNumber: detail.rollNumber,
        session: detail.session,
        date: detail.date,
        question: detail.question,
        result: detail.result,
        description: detail.description,
        memberVote: memberRecord?.vote ?? null,
        bill: detail.bill,
      };
    });

  return { bioguideId, chamber: "House", available: true, votes, congress };
}

/** Congress.gov sessions are 1-indexed per Congress. The 119th Congress began
 *  Jan 3 2025 (session 1). Odd calendar years = session 1, even = session 2. */
function deriveCurrentSession(congress: number): number {
  const year = new Date().getFullYear();
  // Congress starts on odd years; session 1 = first year, session 2 = second year
  const congressStartYear = 2025 + (congress - 119) * 2;
  return year - congressStartYear + 1;
}
