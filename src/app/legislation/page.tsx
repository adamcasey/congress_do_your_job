import { BackButton } from "@/components/ui";
import { LegislationSearch } from "@/components/legislation/LegislationSearch";
import { freePressFont } from "@/styles/fonts";

export const metadata = {
  title: "Legislation - Congress Do Your Job",
  description:
    "Search and track federal legislation. See what bills are moving through Congress, their current status, and plain-English summaries.",
};

export default function LegislationPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#e4f0f9] via-[#e4f0f9] to-[#fde3e0]">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 md:py-16">
        <BackButton href="/">Back to Dashboard</BackButton>

        <header className="mb-10 mt-8 text-center">
          <h1
            className={`${freePressFont.className} text-3xl leading-tight tracking-tight text-slate-900 sm:text-4xl md:text-5xl lg:text-6xl mb-4`}
          >
            Legislation Tracker
          </h1>
          <p className="mx-auto max-w-xl text-lg text-slate-600 text-balance">
            Search federal bills by bill number, title, or keywords. Click any bill for a plain-English summary and its progress
            through Congress.
          </p>
        </header>

        <div className="rounded-3xl bg-white/90 p-6 md:p-10 shadow-xl ring-1 ring-slate-200/80 backdrop-blur-sm">
          <LegislationSearch />
        </div>

        <footer className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            Data sourced from{" "}
            <a
              href="https://api.congress.gov"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-slate-700 transition"
            >
              Congress.gov
            </a>
            . Summaries are AI-generated from official CRS text.
          </p>
        </footer>
      </div>
    </main>
  );
}
