import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWaitlistSignup } from "../useWaitlistSignup";

describe("useWaitlistSignup", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("initializes with correct default state", () => {
    const { result } = renderHook(() => useWaitlistSignup());
    expect(result.current.loading).toBe(false);
    expect(result.current.success).toBe(false);
    expect(result.current.error).toBe("");
  });

  it("sets success to true on successful submission", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true, data: { message: "Added to waitlist" } }),
    }));

    const { result } = renderHook(() => useWaitlistSignup());

    await act(async () => {
      await result.current.submitEmail("test@example.com");
    });

    expect(result.current.success).toBe(true);
    expect(result.current.error).toBe("");
    expect(result.current.loading).toBe(false);
  });

  it("sets error when response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ success: false, error: "Email already registered" }),
    }));

    const { result } = renderHook(() => useWaitlistSignup());

    await act(async () => {
      await result.current.submitEmail("dupe@example.com");
    });

    expect(result.current.success).toBe(false);
    expect(result.current.error).toBe("Email already registered");
    expect(result.current.loading).toBe(false);
  });

  it("sets error when result.success is false", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: false, error: "Invalid email" }),
    }));

    const { result } = renderHook(() => useWaitlistSignup());

    await act(async () => {
      await result.current.submitEmail("bad-email");
    });

    expect(result.current.error).toBe("Invalid email");
  });

  it("sets fallback error message when error field is missing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ success: false, error: "" }),
    }));

    const { result } = renderHook(() => useWaitlistSignup());

    await act(async () => {
      await result.current.submitEmail("test@example.com");
    });

    expect(result.current.error).toBe("Something went wrong");
  });

  it("sets error on network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));

    const { result } = renderHook(() => useWaitlistSignup());

    await act(async () => {
      await result.current.submitEmail("test@example.com");
    });

    expect(result.current.error).toBe("Network error");
    expect(result.current.loading).toBe(false);
  });

  it("handles non-Error thrown values", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue("something bad"));

    const { result } = renderHook(() => useWaitlistSignup());

    await act(async () => {
      await result.current.submitEmail("test@example.com");
    });

    expect(result.current.error).toBe("Failed to sign up");
  });

  it("reset clears success and error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true, data: { message: "ok" } }),
    }));

    const { result } = renderHook(() => useWaitlistSignup());

    await act(async () => {
      await result.current.submitEmail("test@example.com");
    });

    expect(result.current.success).toBe(true);

    act(() => {
      result.current.reset();
    });

    expect(result.current.success).toBe(false);
    expect(result.current.error).toBe("");
  });
});
