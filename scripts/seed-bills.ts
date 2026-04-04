#!/usr/bin/env tsx
/**
 * One-time seeding script: populates the `bill_index` MongoDB collection
 * with all bills from the current Congress via the Congress.gov API.
 *
 * Run from the project root:
 *   npx tsx scripts/seed-bills.ts
 *
 * Reads MONGODB_URI and CONGRESS_API_KEY from .env.local.
 * Safe to re-run — all writes are upserts.
 */

import * as dotenv from "dotenv";
import { resolve } from "path";
import { MongoClient } from "mongodb";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const CONGRESS_API_BASE = "https://api.congress.gov/v3";
const CURRENT_CONGRESS = 119;
const BATCH_SIZE = 250;
const DELAY_MS = 350; // stay well within Congress.gov rate limits

interface CongressBill {
  number: string;
  type: string;
  congress: number;
  originChamber?: string;
  introducedDate?: string;
  updateDate?: string;
  title?: string;
  url?: string;
  latestAction?: { actionDate?: string; text?: string };
  policyArea?: { name?: string };
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchPage(offset: number): Promise<{ bills: CongressBill[]; total: number }> {
  const apiKey = process.env.CONGRESS_API_KEY;
  if (!apiKey) throw new Error("CONGRESS_API_KEY not set in .env.local");

  const base = new URL(`${CONGRESS_API_BASE}/bill/${CURRENT_CONGRESS}`);
  base.searchParams.set("api_key", apiKey);
  base.searchParams.set("format", "json");
  base.searchParams.set("limit", String(BATCH_SIZE));
  base.searchParams.set("offset", String(offset));
  const url = `${base.toString()}&sort=updateDate+desc`;

  const res = await fetch(url, {
    headers: { "User-Agent": "CongressDoYourJob.com/1.0 (seed-bills)" },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Congress.gov API ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  return {
    bills: (data.bills ?? []) as CongressBill[],
    total: data.pagination?.count ?? 0,
  };
}

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error("MONGODB_URI not set in .env.local");

  const isLocal = mongoUri.includes("localhost") || mongoUri.includes("127.0.0.1");
  const client = new MongoClient(mongoUri, {
    tls: !isLocal,
    tlsAllowInvalidCertificates: isLocal,
    serverSelectionTimeoutMS: 15000,
  });

  await client.connect();
  console.log("Connected to MongoDB.");

  const col = client.db().collection("bill_index");

  // Idempotent index creation
  await col.createIndex(
    { billType: 1, billNumber: 1, congress: 1 },
    { unique: true, name: "bill_unique_key" },
  );
  await col.createIndex({ title: "text" }, { name: "title_text_search" });
  console.log("Indexes ensured.\n");

  let offset = 0;
  let total = 0;
  let totalUpserted = 0;
  let page = 0;

  do {
    page++;
    const { bills, total: apiTotal } = await fetchPage(offset);
    if (page === 1) total = apiTotal;

    if (bills.length === 0) break;

    const ops = bills.map((bill) => ({
      updateOne: {
        filter: { billType: bill.type, billNumber: bill.number, congress: bill.congress },
        update: {
          $set: {
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
          },
        },
        upsert: true,
      },
    }));

    const result = await col.bulkWrite(ops, { ordered: false });
    const batchCount = result.upsertedCount + result.modifiedCount;
    totalUpserted += batchCount;
    offset += bills.length;

    const pct = total > 0 ? ((offset / total) * 100).toFixed(1) : "?";
    process.stdout.write(`\rPage ${page} | ${offset}/${total} (${pct}%) | upserted: ${totalUpserted}`);

    if (bills.length < BATCH_SIZE) break;
    await sleep(DELAY_MS);
  } while (offset < total);

  console.log(`\n\nDone. Upserted/updated ${totalUpserted} of ${total} bills.`);
  await client.close();
}

main().catch((err) => {
  console.error("\nSeeding failed:", err);
  process.exit(1);
});
