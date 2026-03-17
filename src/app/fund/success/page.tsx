import { Metadata } from "next";
import Link from "next/link";
import { freePressFont } from "@/styles/fonts";

export const metadata: Metadata = {
  title: "Pledge Confirmed — Eisenhower Fund",
};

export default function FundSuccessPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#e4f0f9] via-[#e4f0f9] to-[#fde3e0] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className={`${freePressFont.className} text-3xl text-slate-900 mb-3`}>
          Pledge confirmed.
        </h1>
        <p className="text-slate-600 text-base leading-relaxed mb-8">
          Thank you for joining the Eisenhower Fund. Your pledge goes into the shared pool —
          and when bipartisan legislation passes, the fund says thank you to the sponsors who made it happen.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/fund"
            className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-slate-800 transition"
          >
            View fund stats
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
