import { jsonError } from "@/lib/api-response";

// shortcut: payments disabled, restore Stripe checkout logic from git to re-enable
export async function POST() {
  return jsonError("Membership is not yet available.", 503);
}
