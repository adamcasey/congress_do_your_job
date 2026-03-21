import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/v1/checkout/route";

// Configurable price IDs so individual tests can simulate missing IDs
let monthlyPriceId = "price_monthly_test";
let annualPriceId = "price_annual_test";

const { getStripeClientMock, getAuthSessionMock, getAuthUserMock } = vi.hoisted(() => ({
  getStripeClientMock: vi.fn(),
  getAuthSessionMock: vi.fn(),
  getAuthUserMock: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  getStripeClient: getStripeClientMock,
  PLANS: {
    monthly: {
      priceId: () => monthlyPriceId,
      name: "Monthly Member",
      amount: 700,
      interval: "month",
      label: "$7 / month",
      annualEquivalent: "$84 / year",
    },
    annual: {
      priceId: () => annualPriceId,
      name: "Annual Member",
      amount: 7000,
      interval: "year",
      label: "$70 / year",
      annualEquivalent: "Save ~$14 vs. monthly",
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  getAuthSession: getAuthSessionMock,
  getAuthUser: getAuthUserMock,
}));

function createRequest(body: unknown) {
  return { json: vi.fn().mockResolvedValue(body) } as any;
}

describe("POST /api/v1/checkout", () => {
  const mockCreateSession = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks(); // full reset: clears calls + implementations so no bleed between tests
    monthlyPriceId = "price_monthly_test";
    annualPriceId = "price_annual_test";
    process.env.STRIPE_SECRET_KEY = "sk_test_fake";
    process.env.NEXT_PUBLIC_APP_URL = "https://test.example";
    getStripeClientMock.mockReturnValue({ checkout: { sessions: { create: mockCreateSession } } });
    getAuthSessionMock.mockResolvedValue({ userId: null });
    getAuthUserMock.mockResolvedValue(null);
  });

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  it("returns 400 for missing plan", async () => {
    const res = await POST(createRequest({}));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ success: false, error: expect.stringContaining("Invalid plan") });
  });

  it("returns 400 for invalid plan value", async () => {
    const res = await POST(createRequest({ plan: "enterprise" }));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ success: false });
  });

  it("returns 503 when price ID is not configured", async () => {
    monthlyPriceId = ""; // simulate unconfigured price

    const res = await POST(createRequest({ plan: "monthly" }));
    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toMatchObject({ success: false, error: expect.stringContaining("not yet available") });
  });

  it("creates checkout session for monthly plan", async () => {
    mockCreateSession.mockResolvedValue({ url: "https://checkout.stripe.com/session123" });

    const res = await POST(createRequest({ plan: "monthly" }));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ success: true, data: { url: "https://checkout.stripe.com/session123" } });
    expect(mockCreateSession).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "subscription",
        line_items: [{ price: "price_monthly_test", quantity: 1 }],
        success_url: expect.stringContaining("/membership/success"),
        cancel_url: expect.stringContaining("/membership"),
      }),
    );
  });

  it("creates checkout session for annual plan", async () => {
    mockCreateSession.mockResolvedValue({ url: "https://checkout.stripe.com/annual123" });

    const res = await POST(createRequest({ plan: "annual" }));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ success: true, data: { url: expect.any(String) } });
    expect(mockCreateSession).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [{ price: "price_annual_test", quantity: 1 }],
      }),
    );
  });

  it("includes client_reference_id and customer_email when user is authenticated", async () => {
    getAuthSessionMock.mockResolvedValue({ userId: "user_clerk_abc123" });
    getAuthUserMock.mockResolvedValue({ emailAddresses: [{ emailAddress: "user@example.com" }] });
    mockCreateSession.mockResolvedValue({ url: "https://checkout.stripe.com/session" });

    await POST(createRequest({ plan: "monthly" }));

    expect(mockCreateSession).toHaveBeenCalledWith(
      expect.objectContaining({
        client_reference_id: "user_clerk_abc123",
        customer_email: "user@example.com",
      }),
    );
  });

  it("returns 500 when Stripe session creation throws", async () => {
    mockCreateSession.mockRejectedValue(new Error("Network failure"));

    const res = await POST(createRequest({ plan: "monthly" }));
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toMatchObject({ success: false });
  });

  it("returns 503 when Stripe key is missing", async () => {
    getStripeClientMock.mockImplementation(() => {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    });

    const res = await POST(createRequest({ plan: "monthly" }));
    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toMatchObject({ success: false, error: expect.stringContaining("not configured") });
  });
});
