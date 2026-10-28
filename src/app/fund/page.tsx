import { Metadata } from "next";
import { BackButton } from "@/components/ui";
import { freePressFont } from "@/styles/fonts";

export const metadata: Metadata = {
  title: "Eisenhower Fund — Congress Do Your Job",
  description: "Pledge to reward legislators who do the work.",
};

export default function FundPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#e4f0f9] via-[#e4f0f9] to-[#fde3e0]">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12 md:py-16">
        <BackButton href="/">Back to Dashboard</BackButton>

        <div className="mt-24 flex flex-col items-center text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 mb-3">
            The Eisenhower Fund
          </p>
          <h1
            className={`${freePressFont.className} text-3xl leading-tight tracking-tight text-slate-900 sm:text-4xl md:text-5xl mb-6`}
          >
            Coming soon.
          </h1>
          <p className="mx-auto max-w-md text-lg text-slate-600 text-balance leading-relaxed">
            The Eisenhower Fund — which rewards legislators for bipartisan work — is under development. Check back soon.
          </p>
          <p className="mt-8 text-sm text-slate-400">
            Questions?{" "}
            <a href="mailto:hello@congressdoyourjob.com" className="underline hover:text-slate-600">
              hello@congressdoyourjob.com
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
