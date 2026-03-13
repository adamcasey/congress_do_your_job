import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/v1/webhooks/stripe/route";

const { getStripeClientMock, getCollectionMock, resendMock } = vi.hoisted(() => ({
  getStripeClientMock: vi.fn(),
  getCollectionMock: vi.fn(),
  resendMock: { emails: { send: vi.fn() } },
}));

vi.mock("@/lib/stripe", () => ({
  getStripeClient: getStripeClientMock,
}));

vi.mock("@/lib/mongodb", () => ({
  getCollection: getCollectionMock,
}));

vi.mock("@/config", () => ({
  resend: resendMock,
}));

const FAKE_WEBHOOK_SECRET = "whsec_test";

function createRequest(body: string, signature: string | null = "t=1,v1=abc") {
  return {
    text: vi.fn().mockResolvedValue(body),
    headers: { get: (key: string) => (key === "stripe-signature" ? signature : null) },
  } as any;
}

describe("POST /api/v1/webhooks/stripe", () => {
  const findOneMock = vi.fn();
  const insertOneMock = vi.fn();
  const updateOneMock = vi.fn();
  const constructEventMock = vi.fn();

  const mockStripe = {
    webhooks: { constructEvent: constructEventMock },
    subscriptions: { retrieve: vi.fn() },
    customers: { retrieve: vi.fn() },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = FAKE_WEBHOOK_SECRET;

    getStripeClientMock.mockReturnValue(mockStripe);
    getCollectionMock.mockResolvedValue({ findOne: findOneMock, insertOne: insertOneMock, updateOne: updateOneMock });
    findOneMock.mockResolvedValue(null); // not already processed
    insertOneMock.mockResolvedValue({});
    updateOneMock.mockResolvedValue({});
    resendMock.emails.send.mockResolvedValue({});
  });

  afterEach(() => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });

  it("returns 500 when STRIPE_WEBHOOK_SECRET is missing", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const res = await POST(createRequest("body"));
    expect(res.status).toBe(500);
  });

  it("returns 400 when stripe-signature header is missing", async () => {
    const res = await POST(createRequest("body", null));
    expect(res.status).toBe(400);
  });

  it("returns 400 when signature verification fails", async () => {
    constructEventMock.mockImplementation(() => {
      throw new Error("Invalid signature");
    });
    const res = await POST(createRequest("{}"));
    expect(res.status).toBe(400);
  });

  it("returns 200 and skips processing for duplicate event", async () => {
    constructEventMock.mockReturnValue({ id: "evt_dup", type: "checkout.session.completed", data: { object: {} } });
    findOneMock.mockResolvedValue({ stripeEventId: "evt_dup" }); // already processed

    const res = await POST(createRequest("{}"));
    expect(res.status).toBe(200);
    expect(insertOneMock).not.toHaveBeenCalled();
  });

  it("handles checkout.session.completed and upserts member record", async () => {
    const fakeSubscription = {
      id: "sub_123",
      status: "active",
      metadata: { plan: "monthly", clerkUserId: "user_abc" },
      items: { data: [{ current_period_start: Math.floor(Date.now() / 1000) - 86400, current_period_end: Math.floor(Date.now() / 1000) + 2592000 }] },
      cancel_at_period_end: false,
    };
    const fakeCustomer = { id: "cus_123", deleted: false, email: "member@example.com" };

    constructEventMock.mockReturnValue({
      id: "evt_checkout",
      type: "checkout.session.completed",
      data: {
        object: {
          mode: "subscription",
          subscription: "sub_123",
          customer: "cus_123",
          client_reference_id: "user_abc",
        },
      },
    });
    mockStripe.subscriptions.retrieve.mockResolvedValue(fakeSubscription);
    mockStripe.customers.retrieve.mockResolvedValue(fakeCustomer);

    const res = await POST(createRequest("{}"));
    expect(res.status).toBe(200);
    expect(updateOneMock).toHaveBeenCalledWith(
      { stripeCustomerId: "cus_123" },
      expect.objectContaining({ $set: expect.objectContaining({ status: "active", plan: "monthly" }) }),
      { upsert: true },
    );
    expect(resendMock.emails.send).toHaveBeenCalled();
  });

  it("handles customer.subscription.updated", async () => {
    constructEventMock.mockReturnValue({
      id: "evt_updated",
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_upd",
          status: "past_due",
          items: { data: [{ current_period_start: 1000000, current_period_end: 1100000 }] },
          cancel_at_period_end: false,
        },
      },
    });

    const res = await POST(createRequest("{}"));
    expect(res.status).toBe(200);
    expect(updateOneMock).toHaveBeenCalledWith(
      { stripeSubscriptionId: "sub_upd" },
      expect.objectContaining({ $set: expect.objectContaining({ status: "past_due" }) }),
    );
  });

  it("handles customer.subscription.deleted", async () => {
    constructEventMock.mockReturnValue({
      id: "evt_deleted",
      type: "customer.subscription.deleted",
      data: { object: { id: "sub_del", status: "canceled", current_period_start: 1000000, current_period_end: 1100000, cancel_at_period_end: false } },
    });

    const res = await POST(createRequest("{}"));
    expect(res.status).toBe(200);
    expect(updateOneMock).toHaveBeenCalledWith(
      { stripeSubscriptionId: "sub_del" },
      { $set: { status: "canceled", cancelAtPeriodEnd: false, updatedAt: expect.any(Date) } },
    );
  });

  it("handles invoice.payment_failed", async () => {
    constructEventMock.mockReturnValue({
      id: "evt_failed",
      type: "invoice.payment_failed",
      data: { object: { subscription: "sub_fail" } },
    });

    const res = await POST(createRequest("{}"));
    expect(res.status).toBe(200);
    expect(updateOneMock).toHaveBeenCalledWith(
      { stripeSubscriptionId: "sub_fail" },
      { $set: { status: "past_due", updatedAt: expect.any(Date) } },
    );
  });

  it("returns 200 for unhandled event types (no-op)", async () => {
    constructEventMock.mockReturnValue({
      id: "evt_unknown",
      type: "customer.created",
      data: { object: {} },
    });

    const res = await POST(createRequest("{}"));
    expect(res.status).toBe(200);
  });

  it("does not create member if checkout mode is not subscription", async () => {
    constructEventMock.mockReturnValue({
      id: "evt_payment",
      type: "checkout.session.completed",
      data: { object: { mode: "payment", subscription: null, customer: "cus_123" } },
    });

    const res = await POST(createRequest("{}"));
    expect(res.status).toBe(200);
    expect(mockStripe.subscriptions.retrieve).not.toHaveBeenCalled();
  });
});
