import { jsonError } from "@/lib/api-response";

// shortcut: payments disabled, restore Stripe portal logic from git to re-enable
export async function POST() {
  return jsonError("Billing portal is not yet available.", 503);
}
