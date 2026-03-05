import { BackButton } from "@/components/ui";
import { ScorecardLookup } from "@/components/scorecard";
import { freePressFont } from "@/styles/fonts";
import Link from "next/link";

export const metadata = {
  title: "Productivity Scorecards - Congress Do Your Job",
  description:
    "Look up Civility & Productivity Scorecards for any current member of Congress. Objective, transparent scoring based on attendance, legislation, bipartisanship, and more.",
};

export default function ScorecardPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#e4f0f9] via-[#e4f0f9] to-[#fde3e0]">
      <div className="mx-auto max-w-3xl px-6 py-12 md:py-16">
        <BackButton href="/">Back to Dashboard</BackButton>

        <header className="mb-10 mt-8 text-center">
          <h1
            className={`${freePressFont.className} text-4xl leading-tight tracking-tight text-slate-900 md:text-5xl lg:text-6xl mb-4`}
          >
            Productivity Scorecards
          </h1>
          <p className="mx-auto max-w-xl text-lg text-slate-600 text-balance">
            Objective, transparent scores for every current member of Congress — based on what they actually do, not what
            they say.
          </p>
        </header>

        <div className="rounded-3xl bg-white/90 p-6 md:p-10 shadow-xl ring-1 ring-slate-200/80 backdrop-blur-sm">
          <ScorecardLookup />
        </div>

        <footer className="mt-8 text-center space-y-2">
          <p className="text-sm text-slate-500">
            Scores are calculated from official Congress.gov records.{" "}
            <Link href="/scorecard/methodology" className="underline underline-offset-2 hover:text-slate-700 transition">
              View full methodology
            </Link>
          </p>
          <p className="text-xs text-slate-400">
            Some categories (committee hearings, civility, theater ratio) use neutral defaults while additional data sources come
            online. Data transparency is shown in each score breakdown.
          </p>
        </footer>
      </div>
    </main>
  );
}
