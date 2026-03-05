import { describe, it, expect } from "vitest";
import { buildCacheKey, hashIdentifier } from "../cache";

describe("buildCacheKey", () => {
  it("builds key with default version", () => {
    expect(buildCacheKey("congress", "bills", "hr1")).toBe("congress:bills:hr1:v1");
  });

  it("builds key with custom version", () => {
    expect(buildCacheKey("congress", "bills", "hr1", "v2")).toBe("congress:bills:hr1:v2");
  });

  it("uses provided identifier verbatim", () => {
    const key = buildCacheKey("svc", "resource", "some-id-123");
    expect(key).toContain("some-id-123");
  });
});

describe("hashIdentifier", () => {
  it("returns a 16-character hex string", async () => {
    const hash = await hashIdentifier("123 Main St, Springfield, MO");
    expect(hash).toHaveLength(16);
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });

  it("returns consistent hash for same input", async () => {
    const input = "456 Elm Ave, Kansas City, MO";
    const hash1 = await hashIdentifier(input);
    const hash2 = await hashIdentifier(input);
    expect(hash1).toBe(hash2);
  });

  it("returns different hashes for different inputs", async () => {
    const hash1 = await hashIdentifier("address one");
    const hash2 = await hashIdentifier("address two");
    expect(hash1).not.toBe(hash2);
  });
});
