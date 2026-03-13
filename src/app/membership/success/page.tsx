import { Metadata } from "next";
import Link from "next/link";
import { freePressFont } from "@/styles/fonts";
import { FlagGate } from "@/components/FlagGate";
import { FeatureFlag } from "@/lib/feature-flags";

export const metadata: Metadata = {
  title: "Welcome, Member — Congress Do Your Job",
};

export default function MembershipSuccessPage() {
  return (
    <FlagGate flag={FeatureFlag.COMING_SOON_LANDING_PAGE}>
      <main className="min-h-screen bg-gradient-to-br from-[#e4f0f9] via-[#e4f0f9] to-[#fde3e0] flex items-center justify-center px-6 py-16">
        <div className="mx-auto max-w-lg text-center">
          <div className="mb-6 text-5xl">🎉</div>

          <h1
            className={`${freePressFont.className} text-3xl leading-tight tracking-tight text-slate-900 md:text-4xl mb-4`}
          >
            Membership confirmed.
          </h1>

          <p className="text-lg text-slate-600 leading-relaxed mb-2">
            Thank you for supporting non-partisan accountability. A confirmation has been sent to
            your email.
          </p>

          <p className="text-sm text-slate-500 mb-10">
            Less theater. More legislation.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-[1px] hover:shadow-xl"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/membership"
              className="inline-flex h-12 items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-6 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:shadow-sm"
            >
              View membership
            </Link>
          </div>
        </div>
      </main>
    </FlagGate>
  );
}
