import { prismaClient } from "@/lib/db";
import { getBill, getBillSummaries } from "@/lib/congress-api";
import { summarizeBill } from "@/lib/gemini-api";
import { createLogger } from "@/lib/logger";
import { Summary, Bill } from "@/types/congress";

const logger = createLogger("BillSummary");

/**
 * Compose a human-readable fallback from whatever bill metadata is available.
 * Used when there is no CRS text and the AI call hasn't produced a result.
 */
function buildMetadataFallback(bill: Bill): string {
  const parts: string[] = [];

  if (bill.policyArea?.name) {
    parts.push(`This legislation relates to ${bill.policyArea.name}.`);
  }

  if (bill.sponsors && bill.sponsors.length > 0) {
    const s = bill.sponsors[0];
    const dateStr = bill.introducedDate
      ? new Date(bill.introducedDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
      : null;
    parts.push(
      `Introduced${dateStr ? ` on ${dateStr}` : ""} by ${s.fullName}${s.state ? ` (${s.state})` : ""}.`,
    );
  }

  if (bill.latestAction?.text) {
    parts.push(`Latest action: ${bill.latestAction.text}.`);
  }

  const base = parts.length > 0 ? parts.join(" ") : (bill.title ?? "");
  return base
    ? `${base} A plain-English summary has not yet been generated for this bill. Check back soon.`
    : "A summary for this bill is not yet available. Check back soon.";
}

export interface BillSummaryResult {
  summary: string;
  source: "database" | "generated" | "fallback";
  generatedAt: Date;
}

/**
 * Strip HTML tags and decode common HTML entities from CRS summary text.
 * Congress.gov summaries frequently contain inline HTML.
 */
function cleanHtml(text: string): string {
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * CRS summaries from Congress.gov often begin with a title/short-title
 * declaration: "Full Title or the Short Title\n\nThis bill..."
 * Strip that preamble so Gemini only sees the substantive content.
 */
function stripLeadingTitle(text: string): string {
  const match = text.match(/\b(This bill|This legislation|This act)\b/i);
  if (match?.index && match.index > 0) {
    return text.substring(match.index);
  }
  return text;
}

/**
 * Select the most advanced CRS summary available.
 * versionCode is a two-digit string where higher values correspond to later
 * legislative stages (e.g. "00" = introduced, "49" = public law).
 */
function selectBestSummaryText(summaries: Summary[]): string {
  if (!summaries || summaries.length === 0) return "";

  const sorted = [...summaries].sort((a, b) => {
    const codeA = parseInt(a.versionCode, 10) || 0;
    const codeB = parseInt(b.versionCode, 10) || 0;
    if (codeB !== codeA) return codeB - codeA;
    return new Date(b.updateDate).getTime() - new Date(a.updateDate).getTime();
  });

  return cleanHtml(sorted[0].text);
}

export async function getOrCreateBillSummary(
  billType: string,
  billNumber: string,
  congress: number,
): Promise<BillSummaryResult> {
  const existingSummary = await prismaClient.billSummary.findUnique({
    where: {
      billType_billNumber_congress: {
        billType: billType.toUpperCase(),
        billNumber,
        congress,
      },
    },
  });

  if (existingSummary) {
    return {
      summary: existingSummary.summary,
      source: "database",
      generatedAt: existingSummary.generatedAt,
    };
  }

  const bill = await getBill(billType, billNumber, congress);

  // Fetch the dedicated summaries endpoint — it often contains richer CRS
  // content than the embedded summaries on the bill object.
  let officialSummaries: Summary[] = bill.summaries ?? [];
  try {
    const summariesResponse = await getBillSummaries(billType, billNumber, congress);
    if (summariesResponse.summaries && summariesResponse.summaries.length > 0) {
      officialSummaries = summariesResponse.summaries;
    }
  } catch (err) {
    logger.warn("Could not fetch bill summaries endpoint, using embedded summaries:", err);
  }

  const rawSummaryText = selectBestSummaryText(officialSummaries);
  const summaryText = rawSummaryText ? stripLeadingTitle(rawSummaryText) : "";

  if (!summaryText && !bill.title) {
    return {
      summary: buildMetadataFallback(bill),
      source: "fallback",
      generatedAt: new Date(),
    };
  }

  const billText = summaryText || bill.title;

  const metadata = {
    chamber: bill.originChamber,
    policyArea: bill.policyArea?.name,
    latestAction: bill.latestAction?.text,
    introducedDate: bill.introducedDate,
    sponsors: bill.sponsors?.slice(0, 3).map((s) => ({ fullName: s.fullName, state: s.state })),
  };

  try {
    const aiSummary = await summarizeBill({
      billText,
      billTitle: bill.title,
      maxLength: 800,
      metadata,
    });

    // Only persist AI-generated summaries so that future requests can retry
    // bills that previously had insufficient text.
    await prismaClient.billSummary.create({
      data: {
        billType: billType.toUpperCase(),
        billNumber,
        congress,
        summary: aiSummary,
        model: "gemini-2.5-flash",
        title: bill.title,
        introducedDate: bill.introducedDate ? new Date(bill.introducedDate) : null,
        sponsors: bill.sponsors ? JSON.parse(JSON.stringify(bill.sponsors)) : null,
        fullTextUrl: bill.url,
      },
    });

    return {
      summary: aiSummary,
      source: "generated",
      generatedAt: new Date(),
    };
  } catch (error) {
    logger.error("Failed to generate AI summary:", error);

    // Return the best available text as a fallback without storing in DB.
    if (summaryText) {
      const sentences = summaryText.match(/[^.!?]+[.!?]+/g) || [];
      const fallbackSummary = sentences.slice(0, 4).join(" ").trim();
      return {
        summary: fallbackSummary || bill.title,
        source: "fallback",
        generatedAt: new Date(),
      };
    }

    return {
      summary: bill.title,
      source: "fallback",
      generatedAt: new Date(),
    };
  }
}
