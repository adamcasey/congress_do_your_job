"use client";

import Link from "next/link";

export default function FundError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#e4f0f9] via-[#e4f0f9] to-[#fde3e0] flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <p className="text-sm font-semibold uppercase tracking-widest text-amber-600 mb-3">Error</p>
        <h1 className="text-2xl font-semibold text-slate-900 mb-3">Something went wrong</h1>
        <p className="text-slate-500 text-sm mb-6">
          We couldn&apos;t load the Eisenhower Fund page. Please try again.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
