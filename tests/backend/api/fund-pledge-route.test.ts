import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/v1/fund/pledge/route";
import { NextRequest } from "next/server";

const { getStripeClientMock, getAuthSessionMock, getAuthUserMock, sessionsCreateMock } = vi.hoisted(() => {
  const sessionsCreateMock = vi.fn();
  return {
    sessionsCreateMock,
    getStripeClientMock: vi.fn().mockReturnValue({ checkout: { sessions: { create: sessionsCreateMock } } }),
    getAuthSessionMock: vi.fn().mockResolvedValue({ userId: null }),
    getAuthUserMock: vi.fn().mockResolvedValue(null),
  };
});

vi.mock("@/lib/stripe", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/stripe")>();
  return { ...actual, getStripeClient: getStripeClientMock };
});

vi.mock("@/lib/auth", () => ({
  getAuthSession: getAuthSessionMock,
  getAuthUser: getAuthUserMock,
}));

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn() }),
}));

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/v1/fund/pledge", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/v1/fund/pledge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getStripeClientMock.mockReturnValue({ checkout: { sessions: { create: sessionsCreateMock } } });
    getAuthSessionMock.mockResolvedValue({ userId: null });
    getAuthUserMock.mockResolvedValue(null);
    vi.stubEnv("STRIPE_FUND_STARTER_PRICE_ID", "price_fund_starter_test");
    vi.stubEnv("STRIPE_FUND_ADVOCATE_PRICE_ID", "price_fund_advocate_test");
    vi.stubEnv("STRIPE_FUND_CHAMPION_PRICE_ID", "price_fund_champion_test");
  });

  it("returns 400 for missing tier", async () => {
    const res = await POST(makeRequest({}));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/invalid tier/i);
  });

  it("returns 400 for unknown tier", async () => {
    const res = await POST(makeRequest({ tier: "vip" }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it("returns 503 when Stripe price ID is not configured", async () => {
    vi.stubEnv("STRIPE_FUND_ADVOCATE_PRICE_ID", "");
    const res = await POST(makeRequest({ tier: "advocate" }));
    const body = await res.json();
    expect(res.status).toBe(503);
    expect(body.success).toBe(false);
  });

  it("creates a checkout session and returns the URL for a valid tier", async () => {
    sessionsCreateMock.mockResolvedValue({ url: "https://checkout.stripe.com/pay/cs_test_abc" });

    const res = await POST(makeRequest({ tier: "starter" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.url).toBe("https://checkout.stripe.com/pay/cs_test_abc");

    const callArgs = sessionsCreateMock.mock.calls[0][0] as {
      subscription_data: { metadata: Record<string, string> };
      line_items: Array<{ price: string }>;
    };
    expect(callArgs.subscription_data.metadata.type).toBe("fund_pledge");
    expect(callArgs.subscription_data.metadata.tier).toBe("starter");
    expect(callArgs.line_items[0].price).toBe("price_fund_starter_test");
  });

  it("sets tier metadata correctly for champion", async () => {
    sessionsCreateMock.mockResolvedValue({ url: "https://checkout.stripe.com/pay/cs_test_champion" });

    await POST(makeRequest({ tier: "champion" }));

    const callArgs = sessionsCreateMock.mock.calls[0][0] as {
      subscription_data: { metadata: Record<string, string> };
      line_items: Array<{ price: string }>;
    };
    expect(callArgs.subscription_data.metadata.tier).toBe("champion");
    expect(callArgs.line_items[0].price).toBe("price_fund_champion_test");
  });

  it("returns 500 when Stripe throws", async () => {
    sessionsCreateMock.mockRejectedValue(new Error("Stripe down"));
    const res = await POST(makeRequest({ tier: "advocate" }));
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
  });
});
