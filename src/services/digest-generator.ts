import { prismaClient } from "@/lib/db";
import { getBills } from "@/lib/congress-api";
import { getOrCreateBillSummary } from "@/services/bill-summary";
import { createLogger } from "@/lib/logger";

const logger = createLogger("DigestGenerator");

/** Maximum bills to surface in the digest's featured section. */
const MAX_FEATURED_BILLS = 5;

/** When fetching candidates for the digest, look at this many bills. */
const BILL_CANDIDATE_LIMIT = 20;

export interface DigestBill {
  type: string;
  number: string;
  congress: number;
  title: string;
  summary: string;
  latestAction?: string;
  latestActionDate?: string;
  url: string;
}

export interface DigestStats {
  billsIntroduced: number;
  billsWithRecentAction: number;
  weekStart: Date;
  weekEnd: Date;
}

export interface GeneratedDigest {
  editionId: string;
  editionNumber: number;
  weekStart: Date;
  weekEnd: Date;
  headline: string;
  overallSummary: string;
  stats: DigestStats;
  featuredBills: DigestBill[];
}

/**
 * Return the most recent Monday at 00:00:00 UTC.
 * Used to define the canonical start of the digest week.
 */
export function getMostRecentMonday(from: Date = new Date()): Date {
  const d = new Date(from);
  const day = d.getUTCDay(); // 0 = Sun, 1 = Mon
  const daysBack = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - daysBack);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Generate (or retrieve) the weekly digest edition.
 *
 * Idempotent: if a 'published' edition already exists for this week's
 * Monday, it is returned directly without touching Congress.gov or Gemini.
 * A 'draft' from a failed prior run is replaced.
 *
 * @param now  Override "now" for testing / backfill.
 */
export async function generateWeeklyDigest(now: Date = new Date()): Promise<GeneratedDigest> {
  const weekStart = getMostRecentMonday(now);
  const weekEnd = new Date(now);

  // --- Idempotency check ---
  const published = await prismaClient.digestEdition.findFirst({
    where: { weekStart, status: "published" },
  });

  if (published) {
    logger.info("Digest already published for this week", { editionNumber: published.editionNumber });
    return rehydrateEdition(published);
  }

  // Delete a stale draft from a failed run so we can recreate cleanly.
  await prismaClient.digestEdition.deleteMany({
    where: { weekStart, status: "draft" },
  });

  // --- Data collection ---
  const fromDateTime = new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().replace(/\.\d{3}Z$/, "Z");
  const toDateTime = weekEnd.toISOString().replace(/\.\d{3}Z$/, "Z");

  logger.info("Collecting bills for digest", { fromDateTime, toDateTime });

  const billsResponse = await getBills({
    limit: BILL_CANDIDATE_LIMIT,
    fromDateTime,
    toDateTime,
    sort: "updateDate+desc",
  });

  const bills = billsResponse.bills ?? [];
  logger.info(`Collected ${bills.length} candidate bills`);

  const billsIntroduced = bills.filter((b) => {
    if (!b.introducedDate) return false;
    const introduced = new Date(b.introducedDate);
    return introduced >= weekStart && introduced <= weekEnd;
  }).length;

  // --- Summary generation ---
  const featuredBills: DigestBill[] = [];

  for (const bill of bills) {
    if (featuredBills.length >= MAX_FEATURED_BILLS) break;
    try {
      const summaryResult = await getOrCreateBillSummary(bill.type, bill.number, bill.congress);
      // Skip entries that produced no meaningful content
      if (summaryResult.summary === "Summary not yet available for this legislation.") continue;

      featuredBills.push({
        type: bill.type,
        number: bill.number,
        congress: bill.congress,
        title: bill.title,
        summary: summaryResult.summary,
        latestAction: bill.latestAction?.text,
        latestActionDate: bill.latestAction?.actionDate,
        url: bill.url,
      });
    } catch (err) {
      logger.warn(`Skipping ${bill.type} ${bill.number} — summary failed:`, err);
    }
  }

  // --- Headline + summary prose ---
  const weekOfStr = weekStart.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  const headline = `Your Weekly Congress Briefing — ${weekOfStr}`;
  const overallSummary = buildOverallSummary(billsIntroduced, bills.length, featuredBills.length);

  const stats: DigestStats = {
    billsIntroduced,
    billsWithRecentAction: bills.length,
    weekStart,
    weekEnd,
  };

  // --- Persist draft edition ---
  const editionNumber = (await prismaClient.digestEdition.count()) + 1;

  const edition = await prismaClient.digestEdition.create({
    data: {
      editionNumber,
      weekStart,
      weekEnd,
      headline,
      summary: overallSummary,
      status: "draft",
      sections: [
        {
          sectionType: "stats",
          title: "By the Numbers",
          content: overallSummary,
          items: [stats as unknown as Record<string, unknown>],
          order: 1,
        },
        {
          sectionType: "bills",
          title: "Bills in Focus",
          content: `${featuredBills.length} bill${featuredBills.length !== 1 ? "s" : ""} summarized this week`,
          items: featuredBills as unknown as Record<string, unknown>[],
          order: 2,
        },
      ],
    },
  });

  logger.info("Draft digest edition created", { editionNumber, editionId: edition.id });

  return {
    editionId: edition.id,
    editionNumber,
    weekStart,
    weekEnd,
    headline,
    overallSummary,
    stats,
    featuredBills,
  };
}

/**
 * Mark a digest edition as published.
 */
export async function markDigestPublished(editionId: string): Promise<void> {
  await prismaClient.digestEdition.update({
    where: { id: editionId },
    data: { status: "published", publishedAt: new Date() },
  });
}

// --- Private helpers ---

function buildOverallSummary(introduced: number, withAction: number, featured: number): string {
  const parts: string[] = [];
  if (introduced > 0) parts.push(`${introduced} new bill${introduced !== 1 ? "s" : ""} introduced`);
  if (withAction > 0) parts.push(`${withAction} bill${withAction !== 1 ? "s" : ""} with recent activity`);
  const body = parts.length > 0 ? parts.join(", ") + "." : "No significant bill activity recorded this week.";
  return `${body} Here ${featured !== 1 ? "are" : "is"} the week's ${featured > 0 ? featured + " " : ""}highlight${featured !== 1 ? "s" : ""}.`;
}

function rehydrateEdition(edition: {
  id: string;
  editionNumber: number;
  weekStart: Date;
  weekEnd: Date;
  headline: string;
  summary: string;
  sections: Array<{ sectionType: string; items: unknown[] }>;
}): GeneratedDigest {
  const statsSection = edition.sections.find((s) => s.sectionType === "stats");
  const billsSection = edition.sections.find((s) => s.sectionType === "bills");
  const rawStats = (statsSection?.items?.[0] ?? {}) as Record<string, unknown>;

  return {
    editionId: edition.id,
    editionNumber: edition.editionNumber,
    weekStart: edition.weekStart,
    weekEnd: edition.weekEnd,
    headline: edition.headline,
    overallSummary: edition.summary,
    stats: {
      billsIntroduced: (rawStats.billsIntroduced as number) ?? 0,
      billsWithRecentAction: (rawStats.billsWithRecentAction as number) ?? 0,
      weekStart: edition.weekStart,
      weekEnd: edition.weekEnd,
    },
    featuredBills: (billsSection?.items ?? []) as DigestBill[],
  };
}
