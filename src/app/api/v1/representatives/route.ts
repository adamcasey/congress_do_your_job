import { NextRequest } from "next/server";
import { RepresentativeResponse, Representative } from "@/types/representative";
import { getOrFetch, buildCacheKey, hashIdentifier, CacheTTL } from "@/lib/cache";
import { createLogger } from "@/lib/logger";
import { jsonError, jsonSuccess } from "@/lib/api-response";

const logger = createLogger("RepresentativesAPI");

const CIVIC_API_BASE = "https://civicinfo.googleapis.com/civicinfo/v2/representatives";

interface CivicOffice {
  name: string;
  divisionId: string;
  levels: string[];
  roles: string[];
  officialIndices: number[];
}

interface CivicAddress {
  line1?: string;
  city?: string;
  state?: string;
  zip?: string;
}

interface CivicOfficial {
  name: string;
  address?: CivicAddress[];
  party?: string;
  phones?: string[];
  urls?: string[];
  photoUrl?: string;
  channels?: Array<{ type: string; id: string }>;
}

interface CivicResponse {
  normalizedInput: {
    line1?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  offices: CivicOffice[];
  officials: CivicOfficial[];
  error?: { message: string; code: number };
}

function parseDistrictFromDivisionId(divisionId: string): string | undefined {
  const match = divisionId.match(/\/cd:(\d+)/);
  return match ? match[1] : undefined;
}

function parseStateFromDivisionId(divisionId: string): string {
  const match = divisionId.match(/\/state:([a-z]{2})/);
  return match ? match[1].toUpperCase() : "";
}

function mapCivicResponseToRepresentatives(civicData: CivicResponse): Representative[] {
  const representatives: Representative[] = [];

  for (const office of civicData.offices) {
    const isSenate = office.roles.includes("legislatorUpperBody");
    const isHouse = office.roles.includes("legislatorLowerBody");

    if (!isSenate && !isHouse) continue;

    const area = isSenate ? "US Senate" : "US House";
    const district = parseDistrictFromDivisionId(office.divisionId);
    const state = civicData.normalizedInput.state ?? parseStateFromDivisionId(office.divisionId);

    for (const officialIndex of office.officialIndices) {
      const official = civicData.officials[officialIndex];
      if (!official) continue;

      representatives.push({
        id: `${office.divisionId}-${officialIndex}`,
        name: official.name,
        phone: official.phones?.[0] ?? "",
        url: official.urls?.[0],
        photoURL: official.photoUrl ?? "",
        party: official.party ?? "",
        state: state.toUpperCase(),
        district,
        reason: `Represents ${office.name}`,
        area,
        field_offices: [],
      });
    }
  }

  return representatives;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get("address");

    if (!address) {
      return jsonError("Address parameter is required", 400);
    }

    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      logger.error("Google API key not configured");
      return jsonError("API configuration error", 500);
    }

    const addressHash = await hashIdentifier(address.toLowerCase().trim());
    const cacheKey = buildCacheKey("civic", "representatives", addressHash);

    const fetchRepresentatives = async (): Promise<RepresentativeResponse> => {
      const url = new URL(CIVIC_API_BASE);
      url.searchParams.set("address", address);
      url.searchParams.set("levels", "country");
      url.searchParams.append("roles", "legislatorUpperBody");
      url.searchParams.append("roles", "legislatorLowerBody");
      url.searchParams.set("key", apiKey);

      const response = await fetch(url.toString());

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
        const message = errorData?.error?.message ?? "Unknown error";
        logger.error("Google Civic API error:", response.status, message);

        if (response.status === 404) {
          throw new Error("No representatives found for this address. Please check the address and try again.");
        }

        throw new Error("Failed to fetch representatives from external API");
      }

      const civicData = (await response.json()) as CivicResponse;

      if (!civicData.offices || !civicData.officials) {
        throw new Error("No representatives found for this address. Please check the address and try again.");
      }

      const representatives = mapCivicResponseToRepresentatives(civicData);

      const state = civicData.normalizedInput.state?.toUpperCase() ?? "";

      // Extract House district from first House office found
      const houseOffice = civicData.offices.find((o) => o.roles.includes("legislatorLowerBody"));
      const district = houseOffice ? parseDistrictFromDivisionId(houseOffice.divisionId) ?? "" : "";

      const location = [
        civicData.normalizedInput.city,
        civicData.normalizedInput.state?.toUpperCase(),
        civicData.normalizedInput.zip,
      ]
        .filter(Boolean)
        .join(", ");

      return {
        location,
        lowAccuracy: false,
        state,
        district,
        representatives,
      };
    };

    const cached = await getOrFetch<RepresentativeResponse>(cacheKey, fetchRepresentatives, CacheTTL.REPRESENTATIVE_LOOKUP);

    if (!cached.data) {
      return jsonError("Failed to fetch representatives", 500);
    }

    return jsonSuccess(
      {
        location: cached.data.location,
        state: cached.data.state,
        district: cached.data.district,
        representatives: cached.data.representatives,
      },
      {
        headers: {
          "X-Cache-Status": cached.status,
          "X-Cache-Stale": cached.isStale ? "true" : "false",
          ...(cached.age !== undefined && { "X-Cache-Age": cached.age.toString() }),
        },
      },
    );
  } catch (error) {
    logger.error("Representatives API error:", error);
    return jsonError("Failed to fetch representatives. Please try again.", 500);
  }
}
