"use client";

import { useVotingRecord } from "@/hooks";
import { formatDate } from "@/lib/format-date";
import type { MemberVoteRecord } from "@/app/api/v1/votes/[bioguideId]/route";

interface VotingRecordProps {
  bioguideId: string;
  memberName?: string;
  enabled?: boolean;
}

function VotePositionBadge({ vote }: { vote: MemberVoteRecord["memberVote"] }) {
  if (!vote) {
    return <span className="text-xs text-slate-400">—</span>;
  }

  const styles: Record<string, string> = {
    Yea: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Nay: "bg-red-100 text-red-800 border-red-200",
    Present: "bg-amber-100 text-amber-800 border-amber-200",
    "Not Voting": "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
        styles[vote] ?? styles["Not Voting"]
      }`}
    >
      {vote}
    </span>
  );
}

function VoteResultBadge({ result }: { result: string }) {
  const lower = result.toLowerCase();
  const passed = lower.includes("passed") || lower.includes("agreed") || lower.includes("elected");
  return (
    <span
      className={`text-[10px] font-medium uppercase tracking-wider ${
        passed ? "text-emerald-700" : "text-red-700"
      }`}
    >
      {result}
    </span>
  );
}

export function VotingRecord({ bioguideId, memberName, enabled = false }: VotingRecordProps) {
  const { data, isPending, error } = useVotingRecord(bioguideId, enabled);

  if (!enabled) return null;

  if (isPending) {
    return (
      <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden animate-pulse">
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="h-4 w-40 bg-slate-200 rounded" />
        </div>
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-6 py-4 flex items-center gap-4">
              <div className="h-3 flex-1 bg-slate-100 rounded" />
              <div className="h-5 w-12 bg-slate-200 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return null;
  }

  if (!data) return null;

  if (!data.available) {
    return (
      <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">Recent Roll-Call Votes</h3>
        </div>
        <div className="px-6 py-8 text-center">
          <p className="text-sm text-slate-500">{data.unavailableReason}</p>
        </div>
      </div>
    );
  }

  if (!data.votes || data.votes.length === 0) {
    return (
      <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">Recent Roll-Call Votes</h3>
        </div>
        <div className="px-6 py-8 text-center">
          <p className="text-sm text-slate-500">No recent votes found for this member.</p>
        </div>
      </div>
    );
  }

  const title = memberName ? `${memberName}'s Recent Votes` : "Recent Roll-Call Votes";

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <span className="text-xs text-slate-400">House · 119th Congress</span>
      </div>

      <div className="divide-y divide-slate-100">
        {data.votes.map((v) => (
          <div key={`${v.session}-${v.rollNumber}`} className="px-6 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500">
                  Roll Call {v.rollNumber} &middot; {formatDate(v.date)}
                </p>
                <p className="mt-0.5 text-sm font-medium text-slate-900 leading-snug">
                  {v.description ?? v.question}
                </p>
                {v.bill && (
                  <p className="mt-0.5 text-xs text-slate-500">
                    {v.bill.type} {v.bill.number}
                  </p>
                )}
                <div className="mt-1">
                  <VoteResultBadge result={v.result} />
                </div>
              </div>
              <div className="flex-shrink-0 pt-0.5">
                <VotePositionBadge vote={v.memberVote} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
        <p className="text-xs text-slate-400">
          Vote data sourced from{" "}
          <a
            href="https://api.congress.gov"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-slate-600"
          >
            Congress.gov
          </a>
          . Showing most recent {data.votes.length} roll-call votes.
        </p>
      </div>
    </div>
  );
}
