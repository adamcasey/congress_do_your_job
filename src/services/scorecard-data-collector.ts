/**
 * Scorecard Data Collection — Methodology v2
 *
 * Fetches two data sets from Congress.gov:
 *   1. Vote participation (House only): last 50 roll-call votes, member position on each
 *   2. Bipartisan engagement: sponsored + co-sponsored legislation with party cross-reference
 */

import {
  ScoringInput,
  ParticipationData,
  CivilityData,
} from "@/types/scorecard";
import {
  getMember,
  getMemberSponsoredLegislation,
  getMemberCosponsoredLegislation,
  getHouseVotes,
  getHouseVoteDetail,
  getCurrentCongress,
  deriveCurrentSession,
  CongressApiError,
} from "@/lib/congress-api";
import { Bill, Member, Cosponsor } from "@/types/congress";
import { buildCacheKey, getOrFetch, CacheTTL } from "@/lib/cache";
import { createLogger } from "@/lib/logger";

const logger = createLogger("ScorecardDataCollector");

const VOTE_SAMPLE_SIZE = 50;

export interface CollectionResult {
  input: ScoringInput;
  dataSources: { participation: string; civility: string };
}

export async function collectScorecardData(
  bioguideId: string,
  periodStart: Date,
  periodEnd: Date,
): Promise<CollectionResult> {
  const cacheKey = buildCacheKey(
    "scorecard",
    "collection",
    `${bioguideId}:${periodStart.toISOString().slice(0, 10)}:${periodEnd.toISOString().slice(0, 10)}`,
  );

  const cached = await getOrFetch<CollectionResult>(
    cacheKey,
    () => fetchAndAssemble(bioguideId, periodStart, periodEnd),
    CacheTTL.SCORECARD,
  );

  return cached.data!;
}

async function fetchAndAssemble(
  bioguideId: string,
  periodStart: Date,
  periodEnd: Date,
): Promise<CollectionResult> {
  logger.info(`Collecting scorecard data for ${bioguideId}`);

  const congress = getCurrentCongress();

  // Fetch member profile and legislation in parallel
  const [member, sponsoredResponse, cosponsoredResponse] = await Promise.all([
    getMember(bioguideId),
    getMemberSponsoredLegislation(bioguideId, { limit: 250 }),
    getMemberCosponsoredLegislation(bioguideId, { limit: 250 }),
  ]);

  const chamberRaw = (member.chamber as string) ?? member.terms?.item?.at(-1)?.chamber ?? "";
  const isHouse = chamberRaw.toLowerCase().includes("house");
  const chamber: "House" | "Senate" = isHouse ? "House" : "Senate";

  const sponsoredBills = (sponsoredResponse.bills ?? []).filter((b) => isWithinPeriod(b, periodStart, periodEnd));
  const cosponsoredBills = (cosponsoredResponse.bills ?? []).filter((b) => isWithinPeriod(b, periodStart, periodEnd));

  const civility = buildCivilityData(sponsoredBills, cosponsoredBills, member);

  let participation: ParticipationData;
  let participationSource: string;

  if (isHouse) {
    participation = await fetchVoteParticipation(bioguideId, congress);
    participationSource = participation.totalVotesSampled > 0 ? "live" : "unavailable";
  } else {
    participation = { votesParticipated: 0, totalVotesSampled: 0, totalVotesInSession: 0, available: false };
    participationSource = "unavailable — Senate vote data not yet integrated";
  }

  logger.info(`Data collection complete for ${bioguideId}: chamber=${chamber}, participation=${participationSource}`);

  return {
    input: { bioguideId, chamber, periodStart, periodEnd, participation, civility },
    dataSources: { participation: participationSource, civility: "partial — party affiliation from Congress.gov" },
  };
}

/**
 * Fetch the last VOTE_SAMPLE_SIZE roll-call votes and count the member's participation.
 * Uses Promise.allSettled so individual detail failures don't abort the whole score.
 */
async function fetchVoteParticipation(bioguideId: string, congress: number): Promise<ParticipationData> {
  try {
    const votesResponse = await getHouseVotes(congress, { limit: VOTE_SAMPLE_SIZE, offset: 0 });
    const totalVotesInSession = votesResponse.pagination?.count ?? 0;
    const voteList = votesResponse.houseRollCallVotes ?? [];

    if (voteList.length === 0) {
      return { votesParticipated: 0, totalVotesSampled: 0, totalVotesInSession, available: true };
    }

    const session = deriveCurrentSession(congress);

    const details = await Promise.allSettled(
      voteList.map((v) => getHouseVoteDetail(congress, v.session ?? session, v.rollNumber)),
    );

    let participated = 0;
    let sampled = 0;

    for (const result of details) {
      if (result.status !== "fulfilled") continue;
      sampled++;
      const memberRecord = result.value.memberVotes?.find((m) => m.bioguideId === bioguideId);
      // "Not Voting" = absent; absent from record entirely = also absent
      if (memberRecord && memberRecord.vote !== "Not Voting") {
        participated++;
      }
    }

    return { votesParticipated: participated, totalVotesSampled: sampled, totalVotesInSession, available: true };
  } catch (err) {
    if (err instanceof CongressApiError) {
      logger.warn(`Could not fetch vote data for ${bioguideId}:`, err.message);
    } else {
      logger.error(`Unexpected error fetching vote data for ${bioguideId}:`, err);
    }
    return { votesParticipated: 0, totalVotesSampled: 0, totalVotesInSession: 0, available: false };
  }
}

/**
 * Build civility data from sponsored/co-sponsored legislation.
 * Cross-party = bill's primary sponsor belongs to a different party than this member.
 */
function buildCivilityData(sponsoredBills: Bill[], cosponsoredBills: Bill[], member: Member): CivilityData {
  const memberParty = member.partyName;

  let crossPartyCosponsorships = 0;
  for (const bill of cosponsoredBills) {
    const sponsorParty = bill.sponsors?.[0]?.party;
    if (sponsorParty && sponsorParty !== memberParty) {
      crossPartyCosponsorships++;
    }
  }

  let bipartisanBillsSponsored = 0;
  for (const bill of sponsoredBills) {
    const cosponsors = bill.cosponsors ?? [];
    if (cosponsors.some((c: Cosponsor) => c.party && c.party !== memberParty)) {
      bipartisanBillsSponsored++;
    }
  }

  return {
    crossPartyCosponsorships,
    bipartisanBillsSponsored,
    totalCosponsorships: cosponsoredBills.length,
    totalBillsSponsored: sponsoredBills.length,
  };
}

function isWithinPeriod(bill: Bill, start: Date, end: Date): boolean {
  const dateStr = bill.introducedDate ?? bill.updateDate;
  if (!dateStr) return true;
  const date = new Date(dateStr);
  return date >= start && date <= end;
}
