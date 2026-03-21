import { describe, expect, it, vi, beforeEach } from "vitest";

const mockCurrentUser = vi.fn();
const mockAuth = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  currentUser: () => mockCurrentUser(),
  auth: () => mockAuth(),
}));

const { getAuthUser, getAuthSession } = await import("@/lib/auth");

describe("getAuthUser", () => {
  beforeEach(() => {
    mockCurrentUser.mockReset();
    vi.unstubAllEnvs();
  });

  it("returns null when CLERK_SECRET_KEY is not set", async () => {
    vi.stubEnv("CLERK_SECRET_KEY", "");
    const result = await getAuthUser();
    expect(result).toBeNull();
    expect(mockCurrentUser).not.toHaveBeenCalled();
  });

  it("returns the user when Clerk is configured and user is signed in", async () => {
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_abc");
    const fakeUser = { id: "user_123", emailAddresses: [] };
    mockCurrentUser.mockResolvedValue(fakeUser);

    const result = await getAuthUser();
    expect(result).toEqual(fakeUser);
  });

  it("returns null when currentUser throws", async () => {
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_abc");
    mockCurrentUser.mockRejectedValue(new Error("Clerk error"));

    const result = await getAuthUser();
    expect(result).toBeNull();
  });
});

describe("getAuthSession", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    vi.unstubAllEnvs();
  });

  it("returns { userId: null } when CLERK_SECRET_KEY is not set", async () => {
    vi.stubEnv("CLERK_SECRET_KEY", "");
    const result = await getAuthSession();
    expect(result).toEqual({ userId: null });
    expect(mockAuth).not.toHaveBeenCalled();
  });

  it("returns { userId } from the session when signed in", async () => {
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_abc");
    mockAuth.mockReturnValue({ userId: "user_123" });

    const result = await getAuthSession();
    expect(result).toEqual({ userId: "user_123" });
  });

  it("returns { userId: null } when auth throws", async () => {
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_abc");
    mockAuth.mockImplementation(() => {
      throw new Error("Clerk error");
    });

    const result = await getAuthSession();
    expect(result).toEqual({ userId: null });
  });
});
