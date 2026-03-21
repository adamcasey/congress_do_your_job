"use client";

import { useState } from "react";
import { FUND_TIERS, type FundTierKey } from "@/lib/stripe";

export function FundPledgeForm() {
  const [selectedTier, setSelectedTier] = useState<FundTierKey>("advocate");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePledge = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/v1/fund/pledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: selectedTier }),
      });

      const data = (await res.json()) as { success: boolean; data?: { url: string }; error?: string };

      if (!data.success || !data.data?.url) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      window.location.href = data.data.url;
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl bg-white/90 p-8 md:p-10 shadow-xl ring-1 ring-slate-200/80">
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Choose your pledge</h2>
      <p className="text-sm text-slate-500 mb-6">All tiers pool together. Cancel anytime.</p>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        {(Object.entries(FUND_TIERS) as [FundTierKey, (typeof FUND_TIERS)[FundTierKey]][]).map(([key, tier]) => {
          const isSelected = selectedTier === key;
          return (
            <button
              key={key}
              onClick={() => setSelectedTier(key)}
              className={`rounded-2xl border-2 p-5 text-left transition focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 ${
                isSelected
                  ? "border-amber-400 bg-amber-50 shadow-md"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
              }`}
            >
              <p className="font-semibold text-slate-900 text-base">{tier.name}</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{tier.label}</p>
              <p className="mt-1 text-xs text-slate-500">{tier.description}</p>
              <div
                className={`mt-3 h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                  isSelected ? "border-amber-500 bg-amber-500" : "border-slate-300"
                }`}
              >
                {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
          {error}
        </p>
      )}

      <button
        onClick={handlePledge}
        disabled={loading}
        className="w-full h-14 rounded-xl bg-slate-900 text-white font-semibold text-base shadow-lg shadow-slate-900/20 transition hover:-translate-y-[1px] hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
      >
        {loading ? "Redirecting to checkout..." : "Join the Eisenhower Fund →"}
      </button>

      <p className="mt-4 text-center text-xs text-slate-400">
        Powered by Stripe. Your pledge is a monthly subscription. Cancel anytime.
      </p>
    </div>
  );
}
