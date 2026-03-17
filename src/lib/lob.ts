import type { MailAddress } from "@/types/petition";

/**
 * Lob.com REST API client for physical letter delivery.
 * No SDK — thin fetch wrapper to keep the bundle small.
 * Docs: https://docs.lob.com/#tag/Letters
 */

// Lob address format uses snake_case with address_ prefix
interface LobAddress {
  name: string;
  address_line1: string;
  address_line2?: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  address_country?: string; // defaults to US
}

interface LobLetterRequest {
  description?: string;
  to: LobAddress;
  from: LobAddress;
  /** HTML string — Lob renders to PDF. Max 10,000 characters. */
  file: string;
  color?: boolean;
  mail_type?: "usps_first_class" | "usps_standard";
}

interface LobLetterResponse {
  id: string;
  expected_delivery_date: string;
  /** Formatted price in USD, e.g. "0.97" */
  price: string;
}

interface LobErrorResponse {
  error?: {
    message?: string;
    status_code?: number;
  };
}

export class LobApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = "LobApiError";
  }
}

function tolobAddress(addr: MailAddress): LobAddress {
  return {
    name: addr.name,
    address_line1: addr.line1,
    ...(addr.line2 ? { address_line2: addr.line2 } : {}),
    address_city: addr.city,
    address_state: addr.state,
    address_zip: addr.zip,
    address_country: "US",
  };
}

/**
 * Send a physical letter via Lob.com.
 * Throws LobApiError on API errors or if LOB_API_KEY is not configured.
 */
export async function sendLetter(
  to: MailAddress,
  from: MailAddress,
  fileHtml: string,
  description?: string,
): Promise<{ lobMailId: string; lobMailCost: number }> {
  const apiKey = process.env.LOB_API_KEY;

  if (!apiKey) {
    throw new LobApiError("LOB_API_KEY environment variable not configured");
  }

  const credentials = Buffer.from(`${apiKey}:`).toString("base64");

  const payload: LobLetterRequest = {
    description,
    to: tolobAddress(to),
    from: tolobAddress(from),
    file: fileHtml,
    color: false,
    mail_type: "usps_first_class",
  };

  const response = await fetch("https://api.lob.com/v1/letters", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as LobLetterResponse | LobErrorResponse;

  if (!response.ok) {
    const errData = data as LobErrorResponse;
    throw new LobApiError(
      errData.error?.message ?? `Lob API error: ${response.status}`,
      response.status,
    );
  }

  const result = data as LobLetterResponse;
  return {
    lobMailId: result.id,
    lobMailCost: parseFloat(result.price) || 0,
  };
}

/**
 * Build the HTML content for a physical letter.
 * Escapes all user-provided content before embedding.
 */
export function buildLetterHtml(
  petitionTitle: string,
  letterTemplate: string,
  customMessage?: string,
): string {
  const lines = [letterTemplate.trim()];
  if (customMessage?.trim()) {
    lines.push(customMessage.trim());
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: "Times New Roman", serif; font-size: 12pt; line-height: 1.6; max-width: 600px; margin: 48px auto; color: #000; }
    h2 { font-size: 13pt; margin-bottom: 24px; }
    p { margin: 0 0 14px; }
    .footer { margin-top: 40px; font-size: 9pt; color: #666; border-top: 1px solid #ccc; padding-top: 8px; }
  </style>
</head>
<body>
  <h2>Re: ${escapeHtml(petitionTitle)}</h2>
  ${lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("\n  ")}
  <div class="footer">
    <p>Sent via CongressDoYourJob.com &mdash; Less theater. More legislation.</p>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}
