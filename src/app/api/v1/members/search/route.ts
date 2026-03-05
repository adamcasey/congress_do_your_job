import { NextRequest } from "next/server";
import { searchMembers } from "@/lib/congress-api";
import { getOrFetch, buildCacheKey, CacheTTL } from "@/lib/cache";
import { createLogger } from "@/lib/logger";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { Member } from "@/types/congress";

const logger = createLogger("MemberSearchAPI");

export interface MemberSearchResult {
  bioguideId: string;
  name: string;
  state: string;
  chamber: string;
  district?: number;
  imageUrl?: string;
}

/**
 * Member search API
 * GET /api/v1/members/search?q=<name>
 *
 * Returns current members of Congress matching the search query.
 */
export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q")?.trim();

    if (!q || q.length < 2) {
      return jsonSuccess({ members: [] });
    }

    if (q.length > 100) {
      return jsonError("Query too long", 400);
    }

    const cacheKey = buildCacheKey("members", "search", q.toLowerCase());

    const fetcher = async (): Promise<{ members: MemberSearchResult[] }> => {
      const response = await searchMembers(q, { limit: 10 });
      const members: MemberSearchResult[] = (response.members ?? []).map((m: Member) => ({
        bioguideId: m.bioguideId,
        name: m.name,
        state: m.state,
        chamber: m.chamber,
        district: m.district,
        imageUrl: m.depiction?.imageUrl,
      }));
      return { members };
    };

    const result = await getOrFetch<{ members: MemberSearchResult[] }>(cacheKey, fetcher, CacheTTL.LEGISLATOR_PROFILE);

    return jsonSuccess(result.data ?? { members: [] });
  } catch (error) {
    logger.error("Member search error:", error);
    return jsonError("Failed to search members", 500);
  }
}
