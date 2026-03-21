"use client";

import { useState } from "react";
import { Bill } from "@/types/congress";
import { BillDetailModal } from "./BillDetailModal";
import { useDebounce, useLegislationSearch } from "@/hooks";
import { formatDate } from "@/utils/dates";
import { SearchBar } from "@/components/ui";

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

export function LegislationSearch() {
  const [query, setQuery] = useState("");
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  const debouncedQuery = useDebounce(query, 400);

  const { data, isFetching, isFetchingNextPage, fetchNextPage, hasNextPage, error } =
    useLegislationSearch(debouncedQuery);

  const allBills = data?.pages.flatMap((p) => p.bills) ?? [];
  const seen = new Set<string>();
  const bills = allBills.filter((bill) => {
    const key = `${bill.congress}-${bill.type}-${bill.number}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const totalCount = data?.pages[0]?.count ?? 0;
  const isSearching = debouncedQuery.length >= 2;

  const handleQueryChange = (value: string) => {
    setQuery(value);
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
      <SearchBar
        id="legislation-search"
        label="Search legislation"
        labelClassName="sr-only"
        value={query}
        onChange={handleQueryChange}
        placeholder="Search bills by keyword, topic, or bill number…"
        isLoading={loading}
      />

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
