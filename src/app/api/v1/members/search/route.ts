import { NextRequest } from "next/server";
import { getAllCurrentMembers } from "@/lib/congress-api";
import { getOrFetch, buildCacheKey, CacheTTL } from "@/lib/cache";
import { createLogger } from "@/lib/logger";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { Member } from "@/types/congress";

const logger = createLogger("MemberSearchAPI");

// Congress.gov may return "House of Representatives" instead of "House" — normalize to our Chamber type
function normalizeChamber(chamber: string | undefined): string {
  if (!chamber) return "";
  const lower = chamber.toLowerCase();
  if (lower.includes("house")) return "House";
  if (lower.includes("senate")) return "Senate";
  return chamber;
}

// Derive chamber from the member record. The /member list endpoint may not include
// a top-level chamber field for all members, so fall back to the most recent term.
function deriveChamber(m: Member): string {
  if (m.chamber) return normalizeChamber(m.chamber as string);
  const lastTerm = m.terms.item.at(-1);
  return normalizeChamber(lastTerm?.chamber);
}

// Shared cache key for the full current-member roster
const ALL_MEMBERS_CACHE_KEY = buildCacheKey("members", "all", "current");

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
 * Fetches all current members of Congress (cached 30d) and filters by name
 * client-side. The Congress.gov /member endpoint does not support free-text
 * name search — its `q` param expects a bioguideId, not a name string.
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

    // Fetch and cache the full roster once; all queries share this cached list
    const rosterResult = await getOrFetch<{ members: Member[] }>(
      "ALL_MEMBERS_CACHE_KEY",
      async () => {
        const members = await getAllCurrentMembers();
        return { members };
      },
      CacheTTL.LEGISLATOR_PROFILE,
    );

    const allMembers = rosterResult.data?.members ?? [];

    const normalized = q.toLowerCase();
    const filtered: MemberSearchResult[] = allMembers
      .filter((m: Member) => m.name?.toLowerCase().includes(normalized))
      .slice(0, 10)
      .map((m: Member) => ({
        bioguideId: m.bioguideId,
        name: m.name,
        state: m.state,
        chamber: deriveChamber(m),
        district: m.district,
        imageUrl: m.depiction?.imageUrl,
      }));

    return jsonSuccess({ members: filtered });
  } catch (error) {
    logger.error("Member search error:", error);
    return jsonError("Failed to search members", 500);
  }
}
