import { describe, expect, it, vi, afterEach } from "vitest";
import { verifyCronSecret } from "@/lib/cron-auth";
import { NextRequest } from "next/server";

function makeRequest(authHeader?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (authHeader !== undefined) headers["authorization"] = authHeader;
  return new NextRequest("https://example.com/api/cron/test", { headers });
}

describe("verifyCronSecret", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns null (allows request) when CRON_SECRET is not set", () => {
    vi.stubEnv("CRON_SECRET", "");
    const result = verifyCronSecret(makeRequest());
    expect(result).toBeNull();
  });

  it("returns null when Authorization header matches the secret", () => {
    vi.stubEnv("CRON_SECRET", "mysecret");
    const result = verifyCronSecret(makeRequest("Bearer mysecret"));
    expect(result).toBeNull();
  });

  it("returns 401 when Authorization header is missing", async () => {
    vi.stubEnv("CRON_SECRET", "mysecret");
    const result = verifyCronSecret(makeRequest());
    expect(result).not.toBeNull();
    expect(result!.status).toBe(401);
    const body = await result!.json();
    expect(body.success).toBe(false);
  });

  it("returns 401 when Authorization header has wrong secret", async () => {
    vi.stubEnv("CRON_SECRET", "mysecret");
    const result = verifyCronSecret(makeRequest("Bearer wrongsecret"));
    expect(result).not.toBeNull();
    expect(result!.status).toBe(401);
  });

  it("returns 401 when Authorization header is malformed (no Bearer prefix)", async () => {
    vi.stubEnv("CRON_SECRET", "mysecret");
    const result = verifyCronSecret(makeRequest("mysecret"));
    expect(result).not.toBeNull();
    expect(result!.status).toBe(401);
  });
});
