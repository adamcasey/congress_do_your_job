"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScorecardCard } from "./ScorecardCard";
import { SearchBar } from "@/components/ui";
import { useDebounce } from "@/hooks/useDebounce";
import type { ApiResponse } from "@/lib/api-response";
import type { MemberSuggestion, ScorecardData, Period } from "./types";

const PERIOD_LABELS: Record<Period, string> = {
  session: "Full Session",
  yearly: "This Year",
  quarterly: "This Quarter",
};

async function fetchMemberSuggestions(query: string): Promise<MemberSuggestion[]> {
  const res = await fetch(`/api/v1/members/search?q=${encodeURIComponent(query)}`);
  const result = (await res.json()) as ApiResponse<{ members: MemberSuggestion[] }>;
  if (!result.success) return [];
  return result.data.members ?? [];
}

async function fetchScorecard(bioguideId: string, period: Period): Promise<ScorecardData> {
  const res = await fetch(`/api/v1/scorecard/${bioguideId}?period=${period}`);
  const result = (await res.json()) as ApiResponse<ScorecardData>;
  if (!res.ok || !result.success) {
    throw new Error((result as { error?: string }).error ?? "Failed to load scorecard");
  }
  return result.data;
}

export function ScorecardLookup() {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberSuggestion | null>(null);
  const [period, setPeriod] = useState<Period>("session");
  const [scorecardEnabled, setScorecardEnabled] = useState(false);

  const debouncedQuery = useDebounce(query, 300);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: suggestions = [], isFetching: loadingSearch } = useQuery({
    queryKey: ["memberSearch", debouncedQuery],
    queryFn: () => fetchMemberSuggestions(debouncedQuery),
    enabled: debouncedQuery.length >= 2 && !selectedMember,
    staleTime: 30 * 1000,
  });

  const {
    data: scorecard,
    isPending: loadingScorecard,
    error: scorecardError,
  } = useQuery({
    queryKey: ["scorecard", selectedMember?.bioguideId, period],
    queryFn: () => fetchScorecard(selectedMember!.bioguideId, period),
    enabled: scorecardEnabled && !!selectedMember,
    staleTime: 5 * 60 * 1000,
    retry: 0,
  });

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setSelectedMember(null);
    setScorecardEnabled(false);
    setShowSuggestions(true);
  };

  const handleSelectMember = (member: MemberSuggestion) => {
    setSelectedMember(member);
    setQuery(member.name);
    setShowSuggestions(false);
    setScorecardEnabled(false);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setScorecardEnabled(true);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const memberLabel = (m: MemberSuggestion) => {
    return m.chamber === "House" ? `Rep. · ${m.state}${m.district ? `-${m.district}` : ""}` : `Sen. · ${m.state}`;
  };

  const errorMessage = scorecardError instanceof Error ? scorecardError.message : null;
  const showScorecard = scorecardEnabled && scorecard && !loadingScorecard && selectedMember;

  return (
    <div className="space-y-8">
      {/* Search form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          {/* Name search */}
          <div className="flex-1 relative" ref={dropdownRef}>
            <SearchBar
              id="member-search"
              label="Search by name"
              value={query}
              onChange={handleQueryChange}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="e.g. Pelosi, Sanders, McCarthy…"
              isLoading={loadingSearch}
            />

            {/* Suggestion dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {suggestions.map((m) => (
                  <button
                    key={m.bioguideId}
                    type="button"
                    onClick={() => handleSelectMember(m)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 transition border-b border-slate-100 last:border-b-0 flex items-center gap-3"
                  >
                    {m.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.imageUrl} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0 bg-slate-100" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-slate-900">{m.name}</p>
                      <p className="text-xs text-slate-500">{memberLabel(m)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Period selector */}
          <div className="sm:w-44">
            <label htmlFor="period-select" className="block text-sm font-medium text-slate-700 mb-1.5">
              Period
            </label>
            <select
              id="period-select"
              value={period}
              onChange={(e) => setPeriod(e.target.value as Period)}
              className="w-full h-12 rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
            >
              {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
                <option key={p} value={p}>
                  {PERIOD_LABELS[p]}
                </option>
              ))}
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!selectedMember || (scorecardEnabled && loadingScorecard)}
            className="h-12 rounded-lg bg-slate-900 px-6 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-[1px] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex-shrink-0"
          >
            {scorecardEnabled && loadingScorecard ? "Loading…" : "View Scorecard"}
          </button>
        </div>

        {!selectedMember && query.length > 0 && suggestions.length === 0 && !loadingSearch && (
          <p className="text-sm text-slate-500">No members found. Try a last name or partial name.</p>
        )}
      </form>

      {/* Loading skeleton */}
      {scorecardEnabled && loadingScorecard && (
        <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden animate-pulse">
          <div className="px-6 pt-6 pb-4 border-b border-slate-100">
            <div className="h-5 w-48 bg-slate-200 rounded" />
            <div className="h-3 w-32 bg-slate-100 rounded mt-2" />
          </div>
          <div className="py-10 flex justify-center bg-slate-50/50">
            <div className="w-48 h-48 rounded-full bg-slate-200" />
          </div>
          <div className="px-6 pb-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-lg" />
            ))}
          </div>
        </div>
      )}

      {/* Error state */}
      {errorMessage && scorecardEnabled && !loadingScorecard && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
      )}

      {/* Scorecard result */}
      {showScorecard && (
        <ScorecardCard scorecard={scorecard.scorecard} memberName={selectedMember.name} periodLabel={PERIOD_LABELS[period]} />
      )}
    </div>
  );
}
