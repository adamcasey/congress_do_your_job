"use client";

import { useState } from "react";
import { MemberDocument } from "@/lib/stripe";

interface MembershipStatusProps {
  member: MemberDocument;
}

export function MembershipStatus({ member }: MembershipStatusProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleManageBilling = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/v1/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stripeCustomerId: member.stripeCustomerId }),
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

  const planLabel = member.plan === "annual" ? "Annual ($70/year)" : "Monthly ($7/month)";
  const periodEnd = member.currentPeriodEnd
    ? new Date(member.currentPeriodEnd).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const statusColors: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-800",
    trialing: "bg-blue-100 text-blue-800",
    past_due: "bg-amber-100 text-amber-800",
    canceled: "bg-slate-100 text-slate-700",
    incomplete: "bg-red-100 text-red-800",
  };

  return (
    <div className="rounded-3xl bg-white/90 p-8 md:p-10 shadow-xl ring-1 ring-slate-200/80">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-1">
            Your membership
          </p>
          <h2 className="text-xl font-semibold text-slate-900">{planLabel}</h2>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
            statusColors[member.status] ?? statusColors.incomplete
          }`}
        >
          {member.status.replace("_", " ")}
        </span>
      </div>

      {periodEnd && (
        <p className="mt-4 text-sm text-slate-500">
          {member.cancelAtPeriodEnd ? (
            <>
              Access ends on <strong className="text-slate-700">{periodEnd}</strong>. Your membership
              will not renew.
            </>
          ) : (
            <>
              Renews on <strong className="text-slate-700">{periodEnd}</strong>.
            </>
          )}
        </p>
      )}

      <div className="mt-6 space-y-3">
        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
            {error}
          </p>
        )}

        <button
          onClick={handleManageBilling}
          disabled={loading}
          className="w-full h-12 rounded-xl border-2 border-slate-200 bg-white text-slate-900 font-semibold text-sm transition hover:border-slate-300 hover:shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Opening billing portal..." : "Manage billing →"}
        </button>
      </div>

      <p className="mt-6 text-xs text-slate-400 text-center">
        Billing managed securely via Stripe. Cancel, change plan, or update payment info any time.
      </p>
    </div>
  );
}
