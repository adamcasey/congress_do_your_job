import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/mongodb";
import { invalidateCache, buildCacheKey } from "@/lib/cache";
import { getAuthSession } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import type {
  PetitionDocument,
  PetitionSignatureDocument,
  SignPetitionRequest,
  DeliveryMethod,
} from "@/types/petition";

const logger = createLogger("PetitionSignAPI");

const VALID_DELIVERY_METHODS: DeliveryMethod[] = ["email", "physical_mail"];

/**
 * POST /api/v1/petitions/[slug]/sign
 * Signs a petition on behalf of the authenticated user.
 *
 * Requires Clerk authentication. Returns 401 if not signed in.
 *
 * Body: { deliveryMethod: "email" | "physical_mail", customMessage?: string }
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    const { userId } = await getAuthSession();
    if (!userId) {
      return jsonError("Authentication required", 401);
    }

    let body: SignPetitionRequest;
    try {
      body = (await request.json()) as SignPetitionRequest;
    } catch {
      return jsonError("Invalid request body", 400);
    }

    const { deliveryMethod, customMessage } = body;

    if (!deliveryMethod || !VALID_DELIVERY_METHODS.includes(deliveryMethod)) {
      return jsonError(`deliveryMethod must be one of: ${VALID_DELIVERY_METHODS.join(", ")}`, 400);
    }

    if (customMessage !== undefined && typeof customMessage !== "string") {
      return jsonError("customMessage must be a string", 400);
    }

    const petitionCol = await getCollection<PetitionDocument>("petitions");
    const petition = await petitionCol.findOne({ slug });

    if (!petition) {
      return jsonError("Petition not found", 404);
    }

    if (petition.status !== "active") {
      return jsonError("This petition is no longer accepting signatures", 409);
    }

    const sigCol = await getCollection<PetitionSignatureDocument>("petition_signatures");

    const existing = await sigCol.findOne({
      petitionId: petition._id,
      clerkUserId: userId,
    });

    if (existing) {
      return jsonError("You have already signed this petition", 409);
    }

    const signature: Omit<PetitionSignatureDocument, "_id"> = {
      petitionId: petition._id,
      clerkUserId: userId,
      deliveryMethod,
      deliveryStatus: "pending",
      ...(customMessage?.trim() ? { customMessage: customMessage.trim() } : {}),
      signedAt: new Date(),
    };

    await sigCol.insertOne(signature as PetitionSignatureDocument);

    // Atomically increment the signature count
    await petitionCol.updateOne({ _id: petition._id }, { $inc: { signatureCount: 1 }, $set: { updatedAt: new Date() } });

    // Bust the cached petition detail and list so counts update promptly
    await invalidateCache(buildCacheKey("petitions", "detail", slug));
    await invalidateCache(buildCacheKey("petitions", "list", petition.status));

    logger.info(`Petition "${slug}" signed by user ${userId} via ${deliveryMethod}`);

    return jsonSuccess({ message: "Petition signed successfully" }, { status: 201 });
  } catch (error) {
    logger.error("Petition sign error:", error);
    return jsonError("Failed to sign petition", 500);
  }
}
