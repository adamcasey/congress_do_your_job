import { jsonError } from "@/lib/api-response";

// shortcut: payments disabled, restore membership status logic from git to re-enable
export async function GET() {
  return jsonError("Membership status is not yet available.", 503);
}
