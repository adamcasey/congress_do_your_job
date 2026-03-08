"use client";

import { ChangeEvent, useState } from "react";
import { Bill } from "@/types/congress";
import { BillTimeline } from "./BillTimeline";
import { Modal } from "@/components/ui/Modal";
import { useBillDetails, useBillSummary, useDebounce, useLegislationSearch } from "@/hooks";
import { formatDate, stripHtmlTags, extractSentences } from "@/utils/dates";

interface SearchResponse {
  bills: Bill[];
  count: number;
  query: string;
}

function getBillStatus(bill: Bill): { label: string; classes: string } {
  if (!bill.latestAction) {
    return { label: "Unknown", classes: "bg-slate-100 text-slate-800 border-slate-200" };
  }
  const action = bill.latestAction.text.toLowerCase();
  if (action.includes("became public law") || action.includes("signed by president")) {
    return { label: "Passed", classes: "bg-emerald-200 text-emerald-900 border-emerald-300" };
  }
  if (action.includes("passed") || action.includes("agreed to")) {
    return { label: "Moved", classes: "bg-emerald-100 text-emerald-800 border-emerald-200" };
  }
  if (action.includes("placed on") || action.includes("calendar")) {
    return { label: "Scheduled", classes: "bg-lime-100 text-lime-800 border-lime-200" };
  }
  if (action.includes("referred to")) {
    return { label: "In Committee", classes: "bg-slate-100 text-slate-800 border-slate-200" };
  }
  return { label: "Update", classes: "bg-slate-100 text-slate-800 border-slate-200" };
}

function BillDetailModal({ bill, onClose }: { bill: Bill; onClose: () => void }) {
  const { data: billDetails, loading: loadingDetails } = useBillDetails({
    billType: bill.type,
    billNumber: bill.number,
    congress: bill.congress,
    enabled: true,
  });
  const { data: summaryData, loading: summaryLoading } = useBillSummary({
    billType: bill.type,
    billNumber: bill.number,
    congress: bill.congress,
    enabled: true,
  });

  return (
    <Modal isOpen onClose={onClose} title={`${bill.type} ${bill.number}`}>
      {loadingDetails ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-4 w-3/4 rounded bg-slate-200" />
          <div className="h-4 w-full rounded bg-slate-200" />
          <div className="h-4 w-5/6 rounded bg-slate-200" />
        </div>
      ) : billDetails ? (
        <div className="flex flex-col">
          <div className="space-y-4 p-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{billDetails.title}</h3>
              <p className="mt-1 text-sm text-slate-600">
                Introduced: {formatDate(billDetails.introducedDate)}
                {billDetails.sponsors && billDetails.sponsors.length > 0 && (
                  <> by {billDetails.sponsors[0].fullName}</>
                )}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h4 className="text-sm font-semibold text-slate-900">What This Bill Does</h4>
              {summaryLoading ? (
                <div className="mt-2 animate-pulse space-y-2">
                  <div className="h-4 w-full rounded bg-slate-200" />
                  <div className="h-4 w-5/6 rounded bg-slate-200" />
                </div>
              ) : summaryData ? (
                <p className="mt-2 text-sm leading-relaxed text-slate-700">{summaryData.summary}</p>
              ) : billDetails.summaries && billDetails.summaries.length > 0 ? (
                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                  {extractSentences(stripHtmlTags(billDetails.summaries[0].text), 2)}
                </p>
              ) : (
                <p className="mt-2 text-sm leading-relaxed text-slate-600">Summary not yet available.</p>
              )}
            </div>
          </div>
          <BillTimeline bill={billDetails} />
        </div>
      ) : (
        <p className="text-sm text-slate-600">Failed to load bill details.</p>
      )}
    </Modal>
  );
}

export function LegislationSearch() {
  const [query, setQuery] = useState("");
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  const debouncedQuery = useDebounce(query, 400);

  const { data, isFetching, isFetchingNextPage, fetchNextPage, hasNextPage, error } =
    useLegislationSearch(debouncedQuery);

  const bills = data?.pages.flatMap((p) => p.bills) ?? [];
  const totalCount = data?.pages[0]?.count ?? 0;
  const isSearching = debouncedQuery.length >= 2;

  const handleQueryChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleExplain = (bill: Bill) => {
    setSelectedBill(bill);
  };

  const handleCloseModal = () => {
    setSelectedBill(null);
  };

  const handleLoadMore = () => {
    fetchNextPage();
  };

  const loading = isFetching && !isFetchingNextPage;

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div>
        <label htmlFor="legislation-search" className="sr-only">
          Search legislation
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          </div>
          <input
            id="legislation-search"
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder="Search bills by keyword, topic, or bill number…"
            autoComplete="off"
            className="w-full h-12 rounded-lg border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
          />
          {loading && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-4">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
            </div>
          )}
        </div>
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
          {isSearching ? `Results for "${debouncedQuery}"` : "Recent Activity"}
        </h3>
        {!loading && bills.length > 0 && (
          <span className="text-xs text-slate-400">
            {isSearching ? `${bills.length} of ${totalCount} bills` : `${bills.length} bills`}
          </span>
        )}
      </div>

      {/* Error */}
      {error && !loading && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error instanceof Error ? error.message : "Failed to load legislation. Please try again."}
        </div>
      )}

      {/* Loading skeletons (initial load only) */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border border-slate-200 bg-white p-4">
              <div className="h-4 w-3/4 rounded bg-slate-200" />
              <div className="mt-2 h-3 w-1/2 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && bills.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
          {isSearching ? `No bills found matching "${debouncedQuery}".` : "No recent legislative activity found."}
        </div>
      )}

      {/* Bill list */}
      {!loading && bills.length > 0 && (
        <div className="space-y-3">
          {bills.map((bill) => {
            const status = getBillStatus(bill);
            return (
              <div
                key={`${bill.congress}-${bill.type}-${bill.number}`}
                className="group rounded-lg border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500">
                        {bill.type} {bill.number}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${status.classes}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <h3 className="mt-1 text-sm font-semibold leading-snug text-slate-900">{bill.title}</h3>
                    {bill.latestAction && (
                      <p className="mt-2 text-xs text-slate-600">
                        <span className="font-medium">Latest: </span>
                        {bill.latestAction.text}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-slate-400">Updated {formatDate(bill.updateDate)}</p>
                  </div>
                  <button
                    onClick={() => handleExplain(bill)}
                    className="flex-shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                  >
                    Explain
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load More */}
      {!loading && hasNextPage && (
        <div className="flex justify-center pt-2">
          <button
            onClick={handleLoadMore}
            disabled={isFetchingNextPage}
            className="rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isFetchingNextPage ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                Loading…
              </span>
            ) : (
              "Load More"
            )}
          </button>
        </div>
      )}

      {/* Bill detail modal */}
      {selectedBill && <BillDetailModal bill={selectedBill} onClose={handleCloseModal} />}
    </div>
  );
}
