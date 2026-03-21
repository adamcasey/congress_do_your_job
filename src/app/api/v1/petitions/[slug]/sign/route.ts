import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/mongodb";
import { invalidateCache, buildCacheKey } from "@/lib/cache";
import { getAuthSession } from "@/lib/auth";
import { sendLetter, buildLetterHtml, LobApiError } from "@/lib/lob";
import { createLogger } from "@/lib/logger";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import type {
  PetitionDocument,
  PetitionSignatureDocument,
  SignPetitionRequest,
  DeliveryMethod,
  MailAddress,
} from "@/types/petition";

const logger = createLogger("PetitionSignAPI");

const VALID_DELIVERY_METHODS: DeliveryMethod[] = ["email", "physical_mail"];

function validateAddress(addr: unknown): addr is MailAddress {
  if (!addr || typeof addr !== "object") return false;
  const a = addr as Record<string, unknown>;
  return (
    typeof a.name === "string" && a.name.trim().length > 0 &&
    typeof a.line1 === "string" && a.line1.trim().length > 0 &&
    typeof a.city === "string" && a.city.trim().length > 0 &&
    typeof a.state === "string" && /^[A-Za-z]{2}$/.test(a.state.trim()) &&
    typeof a.zip === "string" && /^\d{5}(-\d{4})?$/.test(a.zip.trim())
  );
}

/**
 * POST /api/v1/petitions/[slug]/sign
 * Signs a petition on behalf of the authenticated user.
 *
 * Requires Clerk authentication. Returns 401 if not signed in.
 *
 * Body:
 *   { deliveryMethod: "email" | "physical_mail",
 *     customMessage?: string,
 *     senderAddress?: MailAddress }  ← required for physical_mail
 *
 * For physical_mail, calls Lob.com to dispatch a printed letter before
 * recording the signature. If Lob fails the request returns 503; no
 * signature record is created.
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

    const { deliveryMethod, customMessage, senderAddress } = body;

    if (!deliveryMethod || !VALID_DELIVERY_METHODS.includes(deliveryMethod)) {
      return jsonError(`deliveryMethod must be one of: ${VALID_DELIVERY_METHODS.join(", ")}`, 400);
    }

    if (customMessage !== undefined && typeof customMessage !== "string") {
      return jsonError("customMessage must be a string", 400);
    }

    if (deliveryMethod === "physical_mail" && !validateAddress(senderAddress)) {
      return jsonError(
        "senderAddress with valid name, line1, city, 2-letter state, and ZIP is required for physical mail",
        400,
      );
    }

    const petitionCol = await getCollection<PetitionDocument>("petitions");
    const petition = await petitionCol.findOne({ slug });

    if (!petition) {
      return jsonError("Petition not found", 404);
    }

    if (petition.status !== "active") {
      return jsonError("This petition is no longer accepting signatures", 409);
    }

    if (deliveryMethod === "physical_mail" && !petition.recipientAddress) {
      return jsonError("Physical mail is not available for this petition", 400);
    }

    const sigCol = await getCollection<PetitionSignatureDocument>("petition_signatures");

    const existing = await sigCol.findOne({
      petitionId: petition._id,
      clerkUserId: userId,
    });

    if (existing) {
      return jsonError("You have already signed this petition", 409);
    }

    // Dispatch the physical letter before recording anything.
    // If Lob fails, we return an error and nothing is persisted.
    let lobMailId: string | undefined;
    let lobMailCost: number | undefined;

    if (deliveryMethod === "physical_mail" && senderAddress && petition.recipientAddress) {
      try {
        const html = buildLetterHtml(
          petition.title,
          petition.letterTemplate,
          customMessage,
        );

        const recipientAddr: MailAddress = {
          ...petition.recipientAddress,
          name: petition.recipientName ?? "Member of Congress",
        };

        const result = await sendLetter(
          recipientAddr,
          senderAddress,
          html,
          `Petition: ${slug}`,
        );

        lobMailId = result.lobMailId;
        lobMailCost = result.lobMailCost;
      } catch (err) {
        if (err instanceof LobApiError) {
          logger.error(`Lob.com letter failed for petition "${slug}":`, err);
          return jsonError("Physical mail delivery failed. Please try email delivery instead.", 503);
        }
        throw err;
      }
    }

    const signature: Omit<PetitionSignatureDocument, "_id"> = {
      petitionId: petition._id,
      clerkUserId: userId,
      deliveryMethod,
      deliveryStatus: lobMailId ? "sent" : "pending",
      ...(customMessage?.trim() ? { customMessage: customMessage.trim() } : {}),
      ...(lobMailId ? { lobMailId } : {}),
      ...(lobMailCost !== undefined ? { lobMailCost } : {}),
      signedAt: new Date(),
    };

    await sigCol.insertOne(signature as PetitionSignatureDocument);

    // Atomically increment the signature count
    await petitionCol.updateOne({ _id: petition._id }, { $inc: { signatureCount: 1 }, $set: { updatedAt: new Date() } });

    // Bust the cached petition detail and list so counts update promptly
    await invalidateCache(buildCacheKey("petitions", "detail", slug));
    await invalidateCache(buildCacheKey("petitions", "list", petition.status));

    logger.info(`Petition "${slug}" signed by user ${userId} via ${deliveryMethod}`, {
      ...(lobMailId ? { lobMailId, lobMailCost } : {}),
    });

    return jsonSuccess({ message: "Petition signed successfully" }, { status: 201 });
  } catch (error) {
    logger.error("Petition sign error:", error);
    return jsonError("Failed to sign petition", 500);
  }
}
