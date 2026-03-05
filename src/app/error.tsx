"use client";

import { useEffect } from "react";
import Link from "next/link";
import { freePressFont } from "@/styles/fonts";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error tracking in production (Sentry etc. would hook in here)
    console.error("[Error boundary]", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#e4f0f9] via-[#e4f0f9] to-[#fde3e0] px-6">
      <div className="w-full max-w-lg text-center">
        <p
          className={`${freePressFont.className} mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400`}
        >
          Something went wrong
        </p>

        <h1 className="mb-4 text-3xl font-bold tracking-tight text-slate-900">
          We hit a snag.
        </h1>

        <p className="mb-8 text-base leading-relaxed text-slate-600">
          An unexpected error occurred while loading this page. Our team has been notified. You can
          try again — it&apos;s usually a temporary hiccup.
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

        {process.env.NODE_ENV === "development" && error.digest && (
          <p className="mt-8 font-mono text-xs text-slate-400">digest: {error.digest}</p>
        )}
      </div>
    </main>
  );
}
