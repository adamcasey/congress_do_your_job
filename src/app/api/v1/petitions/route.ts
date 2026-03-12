import { NextRequest } from "next/server";
import { getCollection } from "@/lib/mongodb";
import { getOrFetch, buildCacheKey, CacheTTL } from "@/lib/cache";
import { createLogger } from "@/lib/logger";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import type { PetitionDocument, PetitionSummary, PetitionStatus } from "@/types/petition";

const logger = createLogger("PetitionsAPI");

function toSummary(doc: PetitionDocument): PetitionSummary {
  const signatureCount = doc.signatureCount ?? 0;
  const goal = doc.goal;
  return {
    id: doc._id.toString(),
    title: doc.title,
    slug: doc.slug,
    description: doc.description,
    category: doc.category,
    status: doc.status,
    signatureCount,
    goal,
    progressPercentage: goal ? Math.min(100, Math.round((signatureCount / goal) * 100)) : 0,
  };
}

/**
 * GET /api/v1/petitions
 * Returns a list of petitions, optionally filtered by status (default: active).
 * Query params:
 *   - status: "active" | "closed" | "successful" (default: "active")
 */
export async function GET(request: NextRequest) {
  try {
    const rawStatus = request.nextUrl.searchParams.get("status") ?? "active";
    const validStatuses: PetitionStatus[] = ["active", "closed", "successful"];
    if (!validStatuses.includes(rawStatus as PetitionStatus)) {
      return jsonError(`Invalid status "${rawStatus}". Must be one of: ${validStatuses.join(", ")}`, 400);
    }
    const status = rawStatus as PetitionStatus;

    const cacheKey = buildCacheKey("petitions", "list", status);

    const result = await getOrFetch<PetitionSummary[]>(
      cacheKey,
      async () => {
        const col = await getCollection<PetitionDocument>("petitions");
        const docs = await col.find({ status }).sort({ createdAt: -1 }).toArray();
        return docs.map(toSummary);
      },
      CacheTTL.PETITIONS,
    );

    return jsonSuccess(
      { petitions: result.data ?? [] },
      {
        headers: {
          "X-Cache-Status": result.status,
          "X-Cache-Stale": result.isStale ? "true" : "false",
        },
      },
    );
  } catch (error) {
    logger.error("Petitions list error:", error);
    return jsonError("Failed to load petitions", 500);
  }
}
