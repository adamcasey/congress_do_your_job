import { NextRequest } from "next/server";
import { getBillTitles, CongressApiError, getCurrentCongress } from "@/lib/congress-api";
import { jsonError, jsonSuccess } from "@/lib/api-response";

/**
 * GET /api/v1/legislation/bill/titles?type=HR&number=22&congress=119
 *
 * Returns all title objects for a bill from Congress.gov's /titles endpoint.
 * Callers can filter by titleType:
 *   "Short Title(s) as Introduced" — acronym + full short title
 *   "Official Title as Introduced" — full official title
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type")?.trim();
  const number = searchParams.get("number")?.trim();
  const congress = Number(searchParams.get("congress")) || getCurrentCongress();

  if (!type || !number) {
    return jsonError("type and number are required", 400);
  }

  try {
    const titles = await getBillTitles(type, number, congress);
    return jsonSuccess({ titles });
  } catch (error) {
    if (error instanceof CongressApiError) {
      return jsonError(error.message, error.statusCode || 500);
    }
    return jsonError("Failed to fetch bill titles", 500);
  }
}
