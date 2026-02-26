import { NextRequest } from "next/server";
import { RepresentativeResponse } from "@/types/representative";
import { getOrFetch, buildCacheKey, hashIdentifier, CacheTTL } from "@/lib/cache";
import { createLogger } from "@/lib/logger";
import { jsonError, jsonSuccess } from "@/lib/api-response";

const logger = createLogger("RepresentativesAPI");

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get("address");

    if (!address) {
      return jsonError("Address parameter is required", 400);
    }

    const apiKey = process.env.FIVE_CALLS_API_KEY;
    const apiUrl = process.env.FIVE_CALLS_API_URL;

    if (!apiKey) {
      logger.error("5 Calls API key not configured");
      return jsonError("API configuration error", 500);
    }

    if (!apiUrl) {
      logger.error("5 Calls API URL not configured");
      return jsonError("API configuration error", 500);
    }

    // Build cache key with hashed address for privacy
    const addressHash = await hashIdentifier(address.toLowerCase().trim());
    const cacheKey = buildCacheKey("civic", "representatives", addressHash);

    // Fetcher function for cache miss
    const fetchRepresentatives = async (): Promise<RepresentativeResponse> => {
      const url = new URL(apiUrl);
      url.searchParams.set("location", address);
      url.searchParams.set("areas", "US House,US Senate"); // Federal level only for MVP

      const response = await fetch(url.toString(), {
        headers: {
          "X-5Calls-Token": apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error("5 Calls API error:", response.status, errorText);

        if (response.status === 404) {
          throw new Error("No representatives found for this address. Please check the address and try again.");
        }

        throw new Error("Failed to fetch representatives from external API");
      }

      return await response.json();
    };

    // Get from cache or fetch fresh data
    const cached = await getOrFetch<RepresentativeResponse>(cacheKey, fetchRepresentatives, CacheTTL.REPRESENTATIVE_LOOKUP);

    if (!cached.data) {
      return jsonError("Failed to fetch representatives", 500);
    }

    // Return data with cache status headers
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
