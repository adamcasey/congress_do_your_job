/**
 * Congress.gov API type definitions
 * Based on api.congress.gov v3 schema
 */

export interface CongressApiResponse<T> {
  bill?: T;
  bills?: T[];
  summaries?: Summary[];
  amendments?: T[];
  member?: T;
  members?: T[];
  sponsoredLegislation?: T[];
  cosponsoredLegislation?: T[];
  /** House roll-call vote list: /house-vote/{congress} */
  houseRollCallVotes?: T[];
  /** House roll-call vote detail: /house-vote/{congress}/{session}/{rollNumber} */
  houseRollCallVote?: T;
  pagination?: Pagination;
  request?: RequestMetadata;
}

export interface Pagination {
  count: number;
  next?: string;
  prev?: string;
}

export interface RequestMetadata {
  contentType: string;
  format: string;
}

export interface Bill {
  number: string;
  type: BillType;
  congress: number;
  originChamber: Chamber;
  introducedDate: string;
  updateDate: string;
  updateDateIncludingText: string;
  title: string;
  url: string;
  latestAction?: LatestAction;
  sponsors?: Sponsor[];
  cosponsors?: Cosponsor[];
  committees?: Committee[];
  actions?: Action[];
  summaries?: Summary[];
  policyArea?: PolicyArea;
}

export type BillType =
  | "HR" // House bill
  | "S" // Senate bill
  | "HJRES" // House joint resolution
  | "SJRES" // Senate joint resolution
  | "HCONRES" // House concurrent resolution
  | "SCONRES" // Senate concurrent resolution
  | "HRES" // House resolution
  | "SRES"; // Senate resolution

export type Chamber = "House" | "Senate";

export interface LatestAction {
  actionDate: string;
  text: string;
  actionTime?: string;
}

export interface Sponsor {
  bioguideId: string;
  fullName: string;
  firstName: string;
  lastName: string;
  party: string;
  state: string;
  district?: number;
  url: string;
}

export interface Cosponsor extends Sponsor {
  sponsorshipDate: string;
  isOriginalCosponsor: boolean;
}

export interface Committee {
  name: string;
  systemCode: string;
  chamber: Chamber;
  type: string;
  url: string;
  activities?: CommitteeActivity[];
}

export interface CommitteeActivity {
  name: string;
  date: string;
}

export interface Action {
  actionDate: string;
  text: string;
  type?: string;
  actionCode?: string;
  sourceSystem?: SourceSystem;
  committees?: Committee[];
}

export interface SourceSystem {
  code: number;
  name: string;
}

export interface Summary {
  versionCode: string;
  actionDate: string;
  actionDesc: string;
  updateDate: string;
  text: string;
}

export interface PolicyArea {
  name: string;
}

export interface Member {
  bioguideId: string;
  name: string;
  partyName: string;
  state: string;
  district?: number;
  chamber: Chamber;
  depiction?: {
    imageUrl: string;
  };
  terms: TermItem;
  sponsoredLegislation?: {
    count: number;
    url: string;
  };
  cosponsoredLegislation?: {
    count: number;
    url: string;
  };
}

export interface TermItem {
  item: {
    chamber: string;
    startYear: number;
    endYear?: number;
  }[];
}

export interface Vote {
  congress: number;
  chamber: Chamber;
  rollNumber: number;
  session: number;
  date: string;
  question: string;
  result: string;
  description?: string;
  bill?: {
    number: string;
    type: BillType;
    congress: number;
    url: string;
  };
  amendment?: {
    number: string;
    url: string;
  };
  votes: {
    yea: number;
    nay: number;
    present: number;
    notVoting: number;
  };
  members?: MemberVote[];
}

export interface MemberVote {
  bioguideId: string;
  name: string;
  party: string;
  state: string;
  vote: "Yea" | "Nay" | "Present" | "Not Voting";
}

/** One entry from the /house-vote/{congress} list endpoint */
export interface HouseVoteListItem {
  congress: number;
  session: number;
  rollNumber: number;
  date: string;
  question: string;
  result: string;
  type?: string;
  description?: string;
  url: string;
  bill?: {
    congress: number;
    number: string;
    type: BillType;
    url: string;
  };
}

/** How a single member voted on a House roll-call */
export interface MemberRollCallVote {
  bioguideId: string;
  name: string;
  party: string;
  state: string;
  vote: "Yea" | "Nay" | "Present" | "Not Voting";
}

/** Full detail from /house-vote/{congress}/{session}/{rollNumber} */
export interface HouseVoteDetail extends HouseVoteListItem {
  voteTotals?: {
    yea: number;
    nay: number;
    present: number;
    notVoting: number;
  };
  memberVotes?: MemberRollCallVote[];
}

export interface Amendment {
  number: string;
  congress: number;
  type: string;
  purpose: string;
  description: string;
  chamber: Chamber;
  proposedDate: string;
  submittedDate: string;
  sponsor: Sponsor;
  actions: Action[];
  amendedBill?: {
    number: string;
    type: BillType;
    congress: number;
  };
}
