"use client";

import { useState } from "react";
import { PLANS, PlanKey } from "@/lib/stripe";

export function MembershipPlans() {
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>("annual");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubscribe = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/v1/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan }),
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
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Choose a plan</h2>
      <p className="text-sm text-slate-500 mb-6">Both plans include all features. Cancel anytime.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        {(Object.entries(PLANS) as [PlanKey, (typeof PLANS)[PlanKey]][]).map(([key, plan]) => {
          const isSelected = selectedPlan === key;
          return (
            <button
              key={key}
              onClick={() => setSelectedPlan(key)}
              className={`rounded-2xl border-2 p-5 text-left transition focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 ${
                isSelected
                  ? "border-amber-400 bg-amber-50 shadow-md"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-slate-900 text-base">{plan.name}</p>
                {key === "annual" && (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 whitespace-nowrap">
                    Best value
                  </span>
                )}
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">{plan.label}</p>
              <p className="mt-1 text-xs text-slate-500">{plan.annualEquivalent}</p>
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
        onClick={handleSubscribe}
        disabled={loading}
        className="w-full h-14 rounded-xl bg-slate-900 text-white font-semibold text-base shadow-lg shadow-slate-900/20 transition hover:-translate-y-[1px] hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
      >
        {loading ? "Redirecting to checkout..." : "Become a Member →"}
      </button>

      <p className="mt-4 text-center text-xs text-slate-400">
        Powered by Stripe. Your payment details are never stored on our servers.
      </p>
    </div>
  );
}
