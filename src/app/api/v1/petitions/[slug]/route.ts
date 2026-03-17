import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/mongodb";
import { getOrFetch, buildCacheKey, CacheTTL } from "@/lib/cache";
import { getAuthSession } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import type { PetitionDocument, PetitionDetail, PetitionSignatureDocument } from "@/types/petition";

const logger = createLogger("PetitionsAPI");

function toDetail(doc: PetitionDocument): PetitionDetail {
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
    letterTemplate: doc.letterTemplate,
    targetLevel: doc.targetLevel,
    targetOffice: doc.targetOffice,
    lettersDelivered: doc.lettersDelivered,
    hasPhysicalMailOption: Boolean(doc.recipientAddress),
    createdAt: doc.createdAt.toISOString(),
    closedAt: doc.closedAt?.toISOString(),
  };
}

/**
 * GET /api/v1/petitions/[slug]
 * Returns a single petition by slug.
 * Also returns hasSigned=true if the authenticated user has already signed.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      return jsonError("Invalid petition slug", 400);
    }

    const cacheKey = buildCacheKey("petitions", "detail", slug);

    const result = await getOrFetch<PetitionDetail>(
      cacheKey,
      async () => {
        const col = await getCollection<PetitionDocument>("petitions");
        const doc = await col.findOne({ slug });
        if (!doc) throw new Error("NOT_FOUND");
        return toDetail(doc);
      },
      CacheTTL.PETITIONS,
    );

    if (!result.data) {
      return jsonError("Petition not found", 404);
    }

    // Check if the authenticated user has already signed (non-blocking — best effort)
    let hasSigned = false;
    const { userId } = await getAuthSession();
    if (userId) {
      try {
        const sigCol = await getCollection<PetitionSignatureDocument>("petition_signatures");
        const existing = await sigCol.findOne({ petitionId: new ObjectId(result.data.id), clerkUserId: userId });
        hasSigned = existing !== null;
      } catch (err) {
        logger.warn("Could not check signature status:", err);
      }
    }

    return jsonSuccess(
      { petition: result.data, hasSigned },
      {
        headers: {
          "X-Cache-Status": result.status,
          "X-Cache-Stale": result.isStale ? "true" : "false",
        },
      },
    );
  } catch (error) {
    logger.error("Petition detail error:", error);
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return jsonError("Petition not found", 404);
    }
    return jsonError("Failed to load petition", 500);
  }
}
