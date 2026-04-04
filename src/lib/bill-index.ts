/**
 * Bill Index — MongoDB-backed title search
 *
 * Stores a lightweight projection of each bill (number, type, congress, title,
 * and a handful of display fields) in a `bill_index` collection with a MongoDB
 * text index on `title`.  This lets us do accurate title search without relying
 * on the Congress.gov list endpoint, which ignores the `q` parameter entirely.
 *
 * Use this for:
 *   - Title search (e.g. "SAVE Act" → HR 22)
 *   - Upserting bills during nightly refresh / incremental sync crons
 *
 * Use congress-api.ts for:
 *   - Direct bill lookup by number
 *   - Fetching recent bills for browsing (no query)
 */

import { getCollection } from "@/lib/mongodb";
import { Bill, BillType, Chamber } from "@/types/congress";
import { Document, WithId } from "mongodb";
import { createLogger } from "@/lib/logger";

const logger = createLogger("BillIndex");
const COLLECTION = "bill_index";

interface BillIndexDoc extends Document {
  billType: string;
  billNumber: string;
  congress: number;
  title: string;
  originChamber: string;
  introducedDate: string;
  updateDate: string;
  url: string;
  latestActionDate: string;
  latestActionText: string;
  policyArea: string;
}

// Module-level flag so we only attempt index creation once per process lifetime.
let indexEnsured = false;

async function ensureIndexes(): Promise<void> {
  if (indexEnsured) return;
  const col = await getCollection<BillIndexDoc>(COLLECTION);
  await col.createIndex(
    { billType: 1, billNumber: 1, congress: 1 },
    { unique: true, name: "bill_unique_key" },
  );
  await col.createIndex({ title: "text" }, { name: "title_text_search" });
  indexEnsured = true;
}

function billToDoc(bill: Bill): Omit<BillIndexDoc, "_id"> {
  return {
    billType: bill.type,
    billNumber: bill.number,
    congress: bill.congress,
    title: bill.title ?? "",
    originChamber: bill.originChamber ?? "",
    introducedDate: bill.introducedDate ?? "",
    updateDate: bill.updateDate ?? "",
    url: bill.url ?? "",
    latestActionDate: bill.latestAction?.actionDate ?? "",
    latestActionText: bill.latestAction?.text ?? "",
    policyArea: bill.policyArea?.name ?? "",
  };
}

function docToBill(doc: WithId<BillIndexDoc>): Bill {
  return {
    type: doc.billType as BillType,
    number: doc.billNumber,
    congress: doc.congress,
    title: doc.title,
    originChamber: doc.originChamber as Chamber,
    introducedDate: doc.introducedDate,
    updateDate: doc.updateDate,
    updateDateIncludingText: doc.updateDate,
    url: doc.url,
    latestAction: doc.latestActionDate
      ? { actionDate: doc.latestActionDate, text: doc.latestActionText }
      : undefined,
    policyArea: doc.policyArea ? { name: doc.policyArea } : undefined,
  };
}

/**
 * Upsert bills into the bill_index collection.
 * Returns the number of documents inserted or updated.
 */
export async function upsertBills(bills: Bill[]): Promise<number> {
  if (bills.length === 0) return 0;
  await ensureIndexes();
  const col = await getCollection<BillIndexDoc>(COLLECTION);

  const ops = bills.map((bill) => {
    const doc = billToDoc(bill);
    return {
      updateOne: {
        filter: { billType: doc.billType, billNumber: doc.billNumber, congress: doc.congress },
        update: { $set: doc },
        upsert: true,
      },
    };
  });

  const result = await col.bulkWrite(ops, { ordered: false });
  const count = result.upsertedCount + result.modifiedCount;
  logger.info(`upsertBills: ${count} upserted/updated of ${bills.length} provided`);
  return count;
}

/**
 * Search bills by title using MongoDB text search.
 * Returns up to `limit` bills, sorted by text relevance score.
 *
 * Strategy:
 *   1. For multi-word queries, try exact phrase search first ("SAVE Act")
 *   2. If that yields nothing, fall back to individual word matching (SAVE AND Act)
 */
export async function searchBillsByTitle(query: string, limit: number = 100): Promise<Bill[]> {
  await ensureIndexes();
  const col = await getCollection<BillIndexDoc>(COLLECTION);

  const runSearch = async (searchStr: string): Promise<WithId<BillIndexDoc>[]> =>
    col
      .find(
        { $text: { $search: searchStr } },
        { projection: { score: { $meta: "textScore" } } },
      )
      .sort({ score: { $meta: "textScore" } })
      .limit(limit)
      .toArray();

  if (query.includes(" ")) {
    const phraseResults = await runSearch(`"${query}"`);
    if (phraseResults.length > 0) return phraseResults.map(docToBill);
  }

  const wordResults = await runSearch(query);
  return wordResults.map(docToBill);
}

/**
 * Returns the number of bills indexed for a given congress.
 * Useful for health-checking whether the index has been seeded.
 */
export async function getBillIndexCount(congress: number): Promise<number> {
  const col = await getCollection<BillIndexDoc>(COLLECTION);
  return col.countDocuments({ congress });
}
