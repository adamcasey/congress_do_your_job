import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendLetter, buildLetterHtml, LobApiError } from "../lob";
import type { MailAddress } from "@/types/petition";

const TO: MailAddress = {
  name: "Senator Jane Smith",
  line1: "100 Capitol Hill",
  city: "Washington",
  state: "DC",
  zip: "20001",
};

const FROM: MailAddress = {
  name: "John Doe",
  line1: "456 Main St",
  city: "Springfield",
  state: "MO",
  zip: "65801",
};

describe("sendLetter", () => {
  beforeEach(() => {
    vi.stubEnv("LOB_API_KEY", "test_lob_key");
    vi.restoreAllMocks();
  });

  it("throws LobApiError when LOB_API_KEY is not set", async () => {
    vi.stubEnv("LOB_API_KEY", "");
    await expect(sendLetter(TO, FROM, "<p>Hello</p>")).rejects.toThrow(LobApiError);
  });

  it("sends a POST to the Lob letters endpoint with Basic auth", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "ltr_abc123", expected_delivery_date: "2026-03-25", price: "0.97" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await sendLetter(TO, FROM, "<p>Hello</p>", "Test letter");

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.lob.com/v1/letters");
    expect(init.method).toBe("POST");

    const authHeader = (init.headers as Record<string, string>)["Authorization"];
    expect(authHeader).toMatch(/^Basic /);
    const decoded = Buffer.from(authHeader.replace("Basic ", ""), "base64").toString();
    expect(decoded).toBe("test_lob_key:");

    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect((body.to as Record<string, string>).name).toBe("Senator Jane Smith");
    expect((body.from as Record<string, string>).name).toBe("John Doe");
    expect(body.description).toBe("Test letter");
    expect(body.color).toBe(false);
    expect(body.mail_type).toBe("usps_first_class");
  });

  it("returns lobMailId and lobMailCost on success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "ltr_xyz", expected_delivery_date: "2026-03-25", price: "1.23" }),
    }));

    const result = await sendLetter(TO, FROM, "<p>Hi</p>");
    expect(result.lobMailId).toBe("ltr_xyz");
    expect(result.lobMailCost).toBeCloseTo(1.23);
  });

  it("maps MailAddress fields to Lob snake_case format", async () => {
    const withLine2: MailAddress = { ...FROM, line2: "Apt 4B" };
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "ltr_1", expected_delivery_date: "2026-03-25", price: "0.97" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await sendLetter(TO, withLine2, "<p>Hi</p>");

    const body = JSON.parse((mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string) as Record<string, unknown>;
    const from = body.from as Record<string, string>;
    expect(from.address_line1).toBe("456 Main St");
    expect(from.address_line2).toBe("Apt 4B");
    expect(from.address_city).toBe("Springfield");
    expect(from.address_state).toBe("MO");
    expect(from.address_zip).toBe("65801");
    expect(from.address_country).toBe("US");
  });

  it("throws LobApiError with message from API on non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ error: { message: "Invalid address", status_code: 422 } }),
    }));

    await expect(sendLetter(TO, FROM, "<p>Hi</p>")).rejects.toThrow("Invalid address");
    await expect(sendLetter(TO, FROM, "<p>Hi</p>")).rejects.toBeInstanceOf(LobApiError);
  });

  it("falls back to generic error message when API error has no message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    }));

    await expect(sendLetter(TO, FROM, "<p>Hi</p>")).rejects.toThrow("Lob API error: 500");
  });
});

describe("buildLetterHtml", () => {
  it("includes the petition title as a heading", () => {
    const html = buildLetterHtml("Pass a Budget on Time", "Dear Senator,\nPlease act.", undefined);
    expect(html).toContain("Pass a Budget on Time");
    expect(html).toContain("<h2>");
  });

  it("includes the letter template text", () => {
    const html = buildLetterHtml("Title", "Dear Senator,\nThis is important.", undefined);
    expect(html).toContain("Dear Senator,");
  });

  it("appends custom message when provided", () => {
    const html = buildLetterHtml("Title", "Template text.", "My personal note.");
    expect(html).toContain("Template text.");
    expect(html).toContain("My personal note.");
  });

  it("omits custom message paragraph when not provided", () => {
    const html = buildLetterHtml("Title", "Template text.");
    const paragraphCount = (html.match(/<p>/g) ?? []).length;
    const withMessage = buildLetterHtml("Title", "Template text.", "Extra note.");
    const withMessageCount = (withMessage.match(/<p>/g) ?? []).length;
    expect(withMessageCount).toBeGreaterThan(paragraphCount);
  });

  it("escapes HTML special characters to prevent XSS", () => {
    const html = buildLetterHtml(
      "<script>alert(1)</script>",
      "Template with <b>bold</b> & ampersand.",
      "Note with \"quotes\" and 'apostrophes'.",
    );
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&amp;");
    expect(html).toContain("&lt;b&gt;");
    expect(html).toContain("&quot;");
    expect(html).toContain("&#x27;");
  });

  it("returns a valid HTML document string", () => {
    const html = buildLetterHtml("Test Title", "Body text.");
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
    expect(html).toContain("CongressDoYourJob.com");
  });
});
