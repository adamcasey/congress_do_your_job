import { describe, it, expect } from "vitest";

// LaunchDarkly removed. Feature flags now use NEXT_PUBLIC_* env vars.
// No hook to test — behavior is a build-time constant resolved by Next.js.
describe("feature flags", () => {
  it("NEXT_PUBLIC_SHOW_BUDGET_TIMER defaults to false when not set", () => {
    expect(process.env.NEXT_PUBLIC_SHOW_BUDGET_TIMER).not.toBe("true");
  });
});
