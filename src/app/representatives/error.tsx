"use client";

import { useEffect } from "react";
import Link from "next/link";
import { freePressFont } from "@/styles/fonts";

/**
 * Error boundary for the representatives lookup page.
 * Provides context-specific messaging since this page relies on Google Civic
 * and Congress.gov API calls that can fail due to rate limits or quota issues.
 */
export default function RepresentativesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Representatives error boundary]", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#e4f0f9] via-[#e4f0f9] to-[#fde3e0] px-6">
      <div className="w-full max-w-lg text-center">
        <p
          className={`${freePressFont.className} mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400`}
        >
          Representative Lookup
        </p>

        <h1 className="mb-4 text-3xl font-bold tracking-tight text-slate-900">
          Couldn&apos;t load your representatives.
        </h1>

        <p className="mb-3 text-base leading-relaxed text-slate-600">
          We weren&apos;t able to reach our data sources right now. This can happen when the Google
          Civic Information API or Congress.gov is temporarily unavailable.
        </p>
        <p className="mb-8 text-sm leading-relaxed text-slate-500">
          Your address was not sent — no data was stored. Try again in a moment.
        </p>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-[1px] hover:shadow-lg"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:-translate-y-[1px] hover:border-slate-300"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
