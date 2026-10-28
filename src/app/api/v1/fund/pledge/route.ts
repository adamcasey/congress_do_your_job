import { jsonError } from "@/lib/api-response";

// shortcut: payments disabled, restore Stripe fund pledge logic from git to re-enable
export async function POST() {
  return jsonError("The Eisenhower Fund is not yet available.", 503);
}
