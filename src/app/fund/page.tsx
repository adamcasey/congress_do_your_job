import { Metadata } from "next";
import { FlagGate } from "@/components/FlagGate";
import { FeatureFlag } from "@/lib/feature-flags";
import { BackButton } from "@/components/ui";
import { freePressFont } from "@/styles/fonts";
import { FundPledgeForm } from "@/components/fund/FundPledgeForm";
import type { FundStatsResponse } from "@/types/fund";
import type { ApiResponse } from "@/lib/api-response";

export const metadata: Metadata = {
  title: "Eisenhower Fund — Congress Do Your Job",
  description:
    "Pledge $5–$20/month to a shared pool. When bipartisan bills pass, the fund sends thank-you donations to the sponsors — rewarding legislators who actually do their job.",
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://congressdoyourjob.com";

async function getFundStats(): Promise<FundStatsResponse | null> {
  try {
    const res = await fetch(`${APP_URL}/api/v1/fund/stats`, { next: { revalidate: 300 } });
    const json = (await res.json()) as ApiResponse<FundStatsResponse>;
    return json.success && json.data ? json.data : null;
  } catch {
    return null;
  }
}

export default async function FundPage() {
  const stats = await getFundStats();

  return (
    <FlagGate flag={FeatureFlag.COMING_SOON_LANDING_PAGE}>
      <main className="min-h-screen bg-gradient-to-br from-[#e4f0f9] via-[#e4f0f9] to-[#fde3e0]">
        <div className="mx-auto max-w-4xl px-6 py-12 md:py-16">
          <BackButton href="/">Back to Dashboard</BackButton>

          <header className="mb-12 mt-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 mb-3">
              The Eisenhower Fund
            </p>
            <h1
              className={`${freePressFont.className} text-4xl leading-tight tracking-tight text-slate-900 md:text-5xl mb-4`}
            >
              Reward legislators
              <br />
              who do the work.
            </h1>
            <p className="mx-auto max-w-xl text-lg text-slate-600 text-balance leading-relaxed">
              Pledge $5–$20/month to a shared pool. When bipartisan bills pass Congress,
              the fund sends thank-you donations to the sponsors — positive reinforcement for
              governing, not performing.
            </p>
          </header>

          {stats && (
            <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-2 max-w-sm mx-auto">
              <div className="rounded-2xl bg-white/80 p-6 text-center ring-1 ring-slate-200/80 shadow-sm">
                <p className="text-3xl font-bold text-slate-900">{stats.activePledgers.toLocaleString()}</p>
                <p className="mt-1 text-sm text-slate-500">active pledgers</p>
              </div>
              <div className="rounded-2xl bg-white/80 p-6 text-center ring-1 ring-slate-200/80 shadow-sm">
                <p className="text-3xl font-bold text-slate-900">{stats.monthlyPoolFormatted}</p>
                <p className="mt-1 text-sm text-slate-500">pooled per month</p>
              </div>
            </div>
          )}

          <FundPledgeForm />

          <HowItWorks />

          <footer className="mt-12 text-center space-y-2">
            <p className="text-sm text-slate-500">
              Secure payments via Stripe. Cancel anytime from your billing portal.
            </p>
            <p className="text-xs text-slate-400">
              Questions?{" "}
              <a href="mailto:hello@congressdoyourjob.com" className="underline hover:text-slate-600">
                hello@congressdoyourjob.com
              </a>
            </p>
          </footer>
        </div>
      </main>
    </FlagGate>
  );
}

function HowItWorks() {
  const steps = [
    {
      number: "1",
      title: "Pledge monthly",
      desc: "Choose $5, $10, or $20 per month. Your pledge goes into a shared pool with other subscribers.",
    },
    {
      number: "2",
      title: "Bipartisan bills pass",
      desc: "When legislation with meaningful cross-party co-sponsorship passes Congress, we identify the sponsors.",
    },
    {
      number: "3",
      title: "The fund says thank you",
      desc: "A portion of the pool is donated to the bill's sponsors as a direct thank-you for working across the aisle.",
    },
    {
      number: "4",
      title: "Transparent reporting",
      desc: "Every distribution is published here. You can see exactly which bills triggered payments and to whom.",
    },
  ];

  return (
    <div className="mt-10 rounded-3xl bg-white/80 p-8 shadow-sm ring-1 ring-slate-200/80">
      <h2 className="text-lg font-semibold text-slate-900 mb-6">How it works</h2>
      <ol className="space-y-5">
        {steps.map((step) => (
          <li key={step.number} className="flex items-start gap-4">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white mt-0.5">
              {step.number}
            </span>
            <div>
              <p className="font-semibold text-slate-900 text-sm">{step.title}</p>
              <p className="text-sm text-slate-500 mt-0.5">{step.desc}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-6 text-xs text-slate-400 border-t border-slate-100 pt-4">
        Methodology: Bipartisan bills are defined as legislation with co-sponsors from both parties
        representing at least 20% of the total co-sponsorship. All distributions are reviewed by the
        editorial team before release. Full records are published on this page.
      </p>
    </div>
  );
}
