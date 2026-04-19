import { prismaClient } from "@/lib/db";
import { getBills } from "@/lib/congress-api";
import { getOrCreateBillSummary } from "@/services/bill-summary";
import { generateCongressNewsItems, CongressNewsItem } from "@/lib/gemini-api";
import { createLogger } from "@/lib/logger";

const logger = createLogger("DigestGenerator");

/** Maximum bills to surface in the digest's featured section. */
const MAX_FEATURED_BILLS = 3;

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
  newsItems: CongressNewsItem[];
  featuredBills: DigestBill[];
  congressFact: string;
  /** True when this edition was already published in a prior run — emails must NOT be re-sent. */
  alreadyPublished: boolean;
}

const CONGRESS_FACTS = [
  "The first Congress met in New York City in 1789 — the Capitol Building in Washington D.C. wasn't ready until 1800.",
  "Congress has overridden a presidential veto 112 times in U.S. history. The most recent was in 2021.",
  "The shortest session of Congress lasted just one day. The longest ran for over two years during World War II.",
  "A bill becomes law roughly 4% of the time it's introduced. In the 117th Congress, 16,601 bills were filed and 344 were signed.",
  "The House has 435 voting members. That number has been fixed by law since 1929, even as the U.S. population has grown from 106 million to 330 million.",
  "Congressional staff outnumber members roughly 10-to-1. There are about 10,000 personal and committee staff working on Capitol Hill.",
  "The Senate filibuster isn't in the Constitution. It emerged by accident in 1805 when a rule allowing debate to be cut off was removed.",
  "Only 10 women served in Congress in 1971. Today there are over 150 — still under a quarter of total members.",
  "The Congressional Record has been published daily since 1873. It runs to millions of pages and is available free online.",
  "Congress has declared war formally just 11 times, covering five wars. U.S. forces have been deployed abroad over 100 times without a formal declaration.",
  "The youngest person ever elected to the House was William Charles Cole Claiborne in 1797 — he was 22, below the constitutional minimum age of 25.",
  "Congress passed over 4,000 private bills in the 1940s alone. Today that number is typically in the single digits each year.",
  "The Capitol Building's dome was completed during the Civil War, in part as a symbol that the Union would hold.",
  "Before the 17th Amendment passed in 1913, U.S. senators were chosen by state legislatures — not by voters directly.",
  "The Congressional Budget Office was created in 1974 after Congress decided it needed its own budget analysis independent from the White House.",
  "Members of Congress receive mail from constituents at a rate of roughly 200 million pieces per year — letters, emails, and calls combined.",
  "C-SPAN has broadcast congressional proceedings since 1979. It was the first network to air the House live; the Senate followed in 1986.",
  "Congress holds roughly 10,000 committee and subcommittee meetings each session — most are open to the public.",
  "The 'lame duck' period between November elections and January inaugurations was shortened from 13 months to 2 months by the 20th Amendment in 1933.",
  "Representatives run for re-election every two years — meaning they are always running. Senators face voters every six years.",
];

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
    logger.info("Digest already published for this week — skipping re-send", { editionNumber: published.editionNumber });
    return { ...rehydrateEdition(published), alreadyPublished: true };
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

  // --- News items (grounded web search via Gemini) ---
  let newsItems: CongressNewsItem[] = [];
  try {
    newsItems = await generateCongressNewsItems(weekOfStr);
    logger.info(`Generated ${newsItems.length} congress news items`);
  } catch (err) {
    logger.warn("Failed to generate congress news items — omitting section:", err);
  }

  const stats: DigestStats = {
    billsIntroduced,
    billsWithRecentAction: bills.length,
    weekStart,
    weekEnd,
  };

  // --- Persist draft edition ---
  const editionNumber = (await prismaClient.digestEdition.count()) + 1;
  const congressFact = pickCongressFact(editionNumber);

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
          // Dates must be serialized as strings for Prisma's Json[] field
          items: [
            {
              billsIntroduced: stats.billsIntroduced,
              billsWithRecentAction: stats.billsWithRecentAction,
              weekStart: stats.weekStart.toISOString(),
              weekEnd: stats.weekEnd.toISOString(),
            },
          ],
          order: 1,
        },
        {
          sectionType: "bills",
          title: "Bills in Focus",
          content: `${featuredBills.length} bill${featuredBills.length !== 1 ? "s" : ""} summarized this week`,
          items: featuredBills.map((b) => ({ ...b })),
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
    newsItems,
    featuredBills,
    congressFact,
    alreadyPublished: false,
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
    newsItems: [],
    featuredBills: (billsSection?.items ?? []) as DigestBill[],
    congressFact: pickCongressFact(edition.editionNumber),
    alreadyPublished: false, // set by caller when returning a published edition
  };
}

function pickCongressFact(editionNumber: number): string {
  return CONGRESS_FACTS[(editionNumber - 1) % CONGRESS_FACTS.length];
}
