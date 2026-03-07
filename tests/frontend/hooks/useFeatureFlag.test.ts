import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { FeatureFlag, featureFlagDefaults } from "@/lib/feature-flags";

// Mock the LD React client SDK so tests run without a real LD connection
const mockUseFlags = vi.fn();
const mockUseLDClient = vi.fn();
const mockUseLDClientError = vi.fn();

vi.mock("launchdarkly-react-client-sdk", () => ({
  withLDProvider: (opts: unknown) => (Component: unknown) => Component,
  useFlags: () => mockUseFlags(),
  useLDClient: () => mockUseLDClient(),
  useLDClientError: () => mockUseLDClientError(),
}));

// Import after mocks are in place
const { useFeatureFlag } = await import("@/config/launchdarkly");

describe("useFeatureFlag", () => {
  beforeEach(() => {
    mockUseFlags.mockReset();
    mockUseLDClient.mockReset();
    mockUseLDClientError.mockReset();
  });

  describe("when LaunchDarkly has not initialized (hasLdState=false)", () => {
    beforeEach(() => {
      mockUseLDClient.mockReturnValue(null);
      mockUseLDClientError.mockReturnValue(null);
    });

    it("returns the default for COMING_SOON_LANDING_PAGE (true)", () => {
      mockUseFlags.mockReturnValue({});
      const { result } = renderHook(() => useFeatureFlag(FeatureFlag.COMING_SOON_LANDING_PAGE));
      expect(result.current).toBe(featureFlagDefaults[FeatureFlag.COMING_SOON_LANDING_PAGE]);
      expect(result.current).toBe(true);
    });

    it("returns the default for BUDGET_BILL_TIMER (false)", () => {
      mockUseFlags.mockReturnValue({});
      const { result } = renderHook(() => useFeatureFlag(FeatureFlag.BUDGET_BILL_TIMER));
      expect(result.current).toBe(featureFlagDefaults[FeatureFlag.BUDGET_BILL_TIMER]);
      expect(result.current).toBe(false);
    });
  });

  describe("when LaunchDarkly has initialized via client", () => {
    beforeEach(() => {
      mockUseLDClient.mockReturnValue({ variation: vi.fn() }); // truthy client
      mockUseLDClientError.mockReturnValue(null);
    });

    it("returns true when COMING_SOON_LANDING_PAGE flag is true", () => {
      mockUseFlags.mockReturnValue({ [FeatureFlag.COMING_SOON_LANDING_PAGE]: true });
      const { result } = renderHook(() => useFeatureFlag(FeatureFlag.COMING_SOON_LANDING_PAGE));
      expect(result.current).toBe(true);
    });

    it("returns false when COMING_SOON_LANDING_PAGE flag is false", () => {
      mockUseFlags.mockReturnValue({ [FeatureFlag.COMING_SOON_LANDING_PAGE]: false });
      const { result } = renderHook(() => useFeatureFlag(FeatureFlag.COMING_SOON_LANDING_PAGE));
      expect(result.current).toBe(false);
    });

    it("returns true when BUDGET_BILL_TIMER flag is true", () => {
      mockUseFlags.mockReturnValue({ [FeatureFlag.BUDGET_BILL_TIMER]: true });
      const { result } = renderHook(() => useFeatureFlag(FeatureFlag.BUDGET_BILL_TIMER));
      expect(result.current).toBe(true);
    });

    it("returns false when BUDGET_BILL_TIMER flag is false", () => {
      mockUseFlags.mockReturnValue({ [FeatureFlag.BUDGET_BILL_TIMER]: false });
      const { result } = renderHook(() => useFeatureFlag(FeatureFlag.BUDGET_BILL_TIMER));
      expect(result.current).toBe(false);
    });

    it("uses the default when flag key is absent from flags object", () => {
      mockUseFlags.mockReturnValue({}); // empty — flag not present
      const { result } = renderHook(() => useFeatureFlag(FeatureFlag.BUDGET_BILL_TIMER));
      expect(result.current).toBe(featureFlagDefaults[FeatureFlag.BUDGET_BILL_TIMER]);
    });
  });

  describe("when LaunchDarkly has initialized via error (client unavailable but error state known)", () => {
    beforeEach(() => {
      mockUseLDClient.mockReturnValue(null);
      mockUseLDClientError.mockReturnValue(new Error("network error")); // truthy error
    });

    it("returns flag value from flags when available", () => {
      mockUseFlags.mockReturnValue({ [FeatureFlag.BUDGET_BILL_TIMER]: true });
      const { result } = renderHook(() => useFeatureFlag(FeatureFlag.BUDGET_BILL_TIMER));
      expect(result.current).toBe(true);
    });

    it("returns default when flag key missing", () => {
      mockUseFlags.mockReturnValue({});
      const { result } = renderHook(() => useFeatureFlag(FeatureFlag.BUDGET_BILL_TIMER));
      expect(result.current).toBe(false);
    });
  });
});
