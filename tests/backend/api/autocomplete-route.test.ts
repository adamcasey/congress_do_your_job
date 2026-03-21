import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/v1/autocomplete/route";

function createRequest(url: string) {
  return {
    nextUrl: new URL(url),
  } as any;
}

describe("GET /api/v1/autocomplete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOOGLE_API_KEY = "api-key";
    process.env.GOOGLE_PLACES_API_URL = "https://places.example/autocomplete";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns empty predictions when input is too short", async () => {
    const response = await GET(createRequest("https://app.test/api/v1/autocomplete?input=ab"));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { predictions: [] },
    });
  });

  it("returns 500 when API config is missing", async () => {
    delete process.env.GOOGLE_API_KEY;
    const response = await GET(createRequest("https://app.test/api/v1/autocomplete?input=123%20Main"));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "API configuration error",
    });
  });

  it("returns 500 when places API URL is missing", async () => {
    delete process.env.GOOGLE_PLACES_API_URL;
    const response = await GET(createRequest("https://app.test/api/v1/autocomplete?input=123%20Main"));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "API configuration error",
    });
  });

  it("maps places suggestions into frontend prediction format", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        suggestions: [
          {
            placePrediction: {
              text: { text: "123 Main St, Springfield, MO" },
              placeId: "place-1",
            },
          },
          {
            queryPrediction: {
              text: { text: "Main St near Springfield" },
            },
          },
          {
            placePrediction: {
              text: { text: "" },
              placeId: "empty",
            },
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(createRequest("https://app.test/api/v1/autocomplete?input=123%20Main"));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        predictions: [
          { description: "123 Main St, Springfield, MO", placeId: "place-1" },
          { description: "Main St near Springfield", placeId: "Main St near Springfield" },
        ],
      },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("passes through upstream status on Google API errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: vi.fn().mockResolvedValue("rate limited"),
      }),
    );

    const response = await GET(createRequest("https://app.test/api/v1/autocomplete?input=123%20Main"));
    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Google Places API error",
    });
  });

  it("returns 500 on unexpected failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const response = await GET(createRequest("https://app.test/api/v1/autocomplete?input=123%20Main"));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Autocomplete API error",
    });
  });
});
