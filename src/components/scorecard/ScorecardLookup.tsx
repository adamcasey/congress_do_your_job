"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { ScorecardCard } from "./ScorecardCard";
import { CalculatedScorecard } from "@/types/scorecard";
import type { ApiResponse } from "@/lib/api-response";

interface MemberSuggestion {
  bioguideId: string;
  name: string;
  state: string;
  chamber: string;
  district?: number;
  imageUrl?: string;
}

interface ScorecardData {
  scorecard: CalculatedScorecard;
  dataSources: Record<string, string>;
}

type Period = "session" | "yearly" | "quarterly";

const PERIOD_LABELS: Record<Period, string> = {
  session: "Full Session",
  yearly: "This Year",
  quarterly: "This Quarter",
};

// TODO: way too many useState hooks. Evaluate what's necessary for this component and determine if it should be in local state or in a context provider
// TODO: bring in react-query to handle loading, error, and data state management
export function ScorecardLookup() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<MemberSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberSuggestion | null>(null);
  const [period, setPeriod] = useState<Period>("session");
  const [scorecard, setScorecard] = useState<ScorecardData | null>(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingScorecard, setLoadingScorecard] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = (input: string) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (input.length < 2) {
      setSuggestions([]);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        const res = await fetch(`/api/v1/members/search?q=${encodeURIComponent(input)}`);
        const result = (await res.json()) as ApiResponse<{ members: MemberSuggestion[] }>;
        if (result.success) {
          setSuggestions(result.data.members ?? []);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSearch(false);
      }
    }, 300);
  };

  const handleQueryChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedMember(null);
    setScorecard(null);
    setError(null);
    fetchSuggestions(value);
  };

  const handleSelectMember = (member: MemberSuggestion) => {
    setSelectedMember(member);
    setQuery(member.name);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const loadScorecard = async (bioguideId: string, p: Period) => {
    setLoadingScorecard(true);
    setError(null);
    setScorecard(null);
    try {
      const res = await fetch(`/api/v1/scorecard/${bioguideId}?period=${p}`);
      const result = (await res.json()) as ApiResponse<ScorecardData>;
      if (!res.ok || !result.success) {
        setError((result as { error?: string }).error ?? "Failed to load scorecard");
      } else {
        setScorecard(result.data);
      }
    } catch {
      setError("Failed to load scorecard. Please try again.");
    } finally {
      setLoadingScorecard(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    loadScorecard(selectedMember.bioguideId, period);
  };

  // Reload scorecard when period changes and a member is already selected
  useEffect(() => {
    if (selectedMember && scorecard) {
      loadScorecard(selectedMember.bioguideId, period);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

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

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const memberLabel = (m: MemberSuggestion) => {
    const role = m.chamber === "House" ? `Rep. · ${m.state}${m.district ? `-${m.district}` : ""}` : `Sen. · ${m.state}`;
    return role;
  };

  return (
    <div className="space-y-8">
      {/* Search form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          {/* Name search */}
          <div className="flex-1 relative" ref={dropdownRef}>
            <label htmlFor="member-search" className="block text-sm font-medium text-slate-700 mb-1.5">
              Search by name
            </label>
            <input
              id="member-search"
              type="text"
              value={query}
              onChange={handleQueryChange}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="e.g. Pelosi, Sanders, McCarthy…"
              autoComplete="off"
              className="w-full h-12 rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
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

            {loadingSearch && <p className="mt-1.5 text-xs text-slate-400">Searching…</p>}
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
            disabled={!selectedMember || loadingScorecard}
            className="h-12 rounded-lg bg-slate-900 px-6 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-[1px] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex-shrink-0"
          >
            {loadingScorecard ? "Loading…" : "View Scorecard"}
          </button>
        </div>

        {!selectedMember && query.length > 0 && suggestions.length === 0 && !loadingSearch && (
          <p className="text-sm text-slate-500">No members found. Try a last name or partial name.</p>
        )}
      </form>

      {/* Loading skeleton */}
      {loadingScorecard && (
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
      {error && !loadingScorecard && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Scorecard result */}
      {scorecard && !loadingScorecard && selectedMember && (
        <ScorecardCard scorecard={scorecard.scorecard} memberName={selectedMember.name} periodLabel={PERIOD_LABELS[period]} />
      )}
    </div>
  );
}
