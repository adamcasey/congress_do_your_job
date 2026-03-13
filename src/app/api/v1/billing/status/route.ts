import { NextRequest } from "next/server";
import { MemberDocument } from "@/lib/stripe";
import { getAuthSession } from "@/lib/auth";
import { getCollection } from "@/lib/mongodb";
import { createLogger } from "@/lib/logger";
import { jsonError, jsonSuccess } from "@/lib/api-response";

const logger = createLogger("BillingStatusAPI");

export async function GET(_request: NextRequest) {
  try {
    const { userId } = await getAuthSession();
    if (!userId) {
      return jsonError("Authentication required", 401);
    }

    const membersCollection = await getCollection<MemberDocument>("members");
    const member = await membersCollection.findOne({ clerkUserId: userId });

    if (!member) {
      return jsonSuccess({ isMember: false, status: null, plan: null, currentPeriodEnd: null });
    }

    return jsonSuccess({
      isMember: member.status === "active" || member.status === "trialing",
      status: member.status,
      plan: member.plan,
      currentPeriodEnd: member.currentPeriodEnd,
      cancelAtPeriodEnd: member.cancelAtPeriodEnd,
    });
  } catch (error) {
    logger.error("Billing status lookup failed:", error);
    return jsonError("Failed to fetch membership status. Please try again.", 500);
  }
}
