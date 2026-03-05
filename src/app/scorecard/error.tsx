"use client";

import Link from "next/link";

export default function ScorecardError({ reset }: { reset: () => void }) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#e4f0f9] via-[#e4f0f9] to-[#fde3e0] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="text-4xl mb-4">📋</p>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Scorecard unavailable</h1>
        <p className="text-slate-600 mb-6">
          We couldn&apos;t load the scorecard right now. This may be a temporary issue with the Congress.gov data feed.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white transition"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
