import { jsonError } from "@/lib/api-response";

// shortcut: payments disabled, restore fund stats logic from git to re-enable
export async function GET() {
  return jsonError("The Eisenhower Fund is not yet available.", 503);
}
