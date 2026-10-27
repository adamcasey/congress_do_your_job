import Link from "next/link";
import { METHODOLOGY_VERSION } from "@/services/scorecard-calculator";

export const metadata = {
  title: "Scorecard Methodology - Congress Do Your Job",
  description:
    "Transparent, documented methodology for how we calculate Productivity Scorecards for members of Congress.",
};

const categories = [
  {
    name: "Vote Participation",
    weight: 50,
    description:
      "The core job of a legislator is to show up and cast a vote. This score measures the percentage of roll-call votes a member participated in (Yea, Nay, or Present) out of the last 50 votes held. Not Voting counts as a miss.",
    formula: "votesParticipated / totalVotesSampled × 100",
    dataSource: "Congress.gov House roll-call vote records",
    notes: [
      "Based on a sample of the 50 most recent roll-call votes in the session.",
      "Not Voting is treated as a missed vote.",
      "Senate vote data is not yet available from Congress.gov — Senate members are scored on Bipartisan Engagement only.",
      "Members are not penalized if no votes are scheduled during the selected period.",
    ],
  },
  {
    name: "Bipartisan Engagement",
    weight: 50,
    description:
      "Measures the share of a member's legislative activity that crosses party lines. Two things count: bills they sponsored that attracted at least one co-sponsor from the other party, and bills from the other party that they chose to co-sign. A member where 40% or more of their legislative activity is bipartisan earns a perfect 100.",
    formula: "min(100, (crossPartyCosponsorships + bipartisanBillsSponsored) / (totalCosponsorships + totalBillsSponsored) × 250)",
    dataSource: "Congress.gov sponsored and co-sponsored legislation with party affiliation",
    notes: [
      "crossPartyCosponsorships: bills from the other party that this member co-signed.",
      "bipartisanBillsSponsored: own bills that attracted at least one cross-party co-sponsor.",
      "A member with zero bipartisan activity earns a 0 — there is no neutral baseline.",
      "Party affiliation is sourced from Congress.gov member records.",
    ],
  },
];

const gradeTable = [
  { range: "97–100", grade: "A+" },
  { range: "93–96", grade: "A" },
  { range: "90–92", grade: "A−" },
  { range: "87–89", grade: "B+" },
  { range: "83–86", grade: "B" },
  { range: "80–82", grade: "B−" },
  { range: "77–79", grade: "C+" },
  { range: "73–76", grade: "C" },
  { range: "70–72", grade: "C−" },
  { range: "67–69", grade: "D+" },
  { range: "63–66", grade: "D" },
  { range: "60–62", grade: "D−" },
  { range: "0–59", grade: "F" },
];

export default function MethodologyPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-800 transition-colors mb-6 inline-block">
            ← Back to home
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Scorecard Methodology</h1>
          <p className="mt-3 text-slate-600 text-lg leading-relaxed">
            Scores are calculated from two verifiable metrics: showing up to vote, and working across the aisle.
            Nothing else.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5">
            <span>Methodology version {METHODOLOGY_VERSION}</span>
            <span>·</span>
            <a href="https://github.com" className="text-slate-700 underline underline-offset-2 hover:text-slate-900">
              Version history on GitHub
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-16">
        {/* Principles */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Core Principles</h2>
          <ul className="space-y-3 text-slate-600">
            <li className="flex gap-3">
              <span className="text-slate-300 mt-0.5">—</span>
              <span>
                <strong className="text-slate-800">Verifiable only.</strong> Every data point traces to an official
                government record. We score what legislators DO, not what they say.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-slate-300 mt-0.5">—</span>
              <span>
                <strong className="text-slate-800">Non-partisan.</strong> Party affiliation is never a scoring factor.
                We measure bipartisanship as a positive behavior, not partisanship as a negative one.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-slate-300 mt-0.5">—</span>
              <span>
                <strong className="text-slate-800">Simple and honest.</strong> Two scores. No neutral baselines. A member
                who shows up and works across the aisle earns a high score. A member who doesn&apos;t earns a low one.
              </span>
            </li>
          </ul>
        </section>

        {/* Category weights summary */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Category Weights</h2>
          <p className="text-slate-600 mb-5">
            The overall score is an equal-weight average of two categories. For Senate members, Vote Participation
            data is unavailable; Bipartisan Engagement carries 100% of the score.
          </p>
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-slate-600">Category</th>
                  <th className="text-right px-5 py-3 font-medium text-slate-600">Weight (House)</th>
                  <th className="text-right px-5 py-3 font-medium text-slate-600">Weight (Senate)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((cat) => (
                  <tr key={cat.name} className="bg-white">
                    <td className="px-5 py-3 text-slate-800">{cat.name}</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-900">{cat.weight}%</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-500">
                      {cat.name === "Vote Participation" ? "N/A" : "100%"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Category details */}
        <section className="space-y-10">
          <h2 className="text-xl font-semibold text-slate-900">Category Details</h2>
          {categories.map((cat) => (
            <div key={cat.name} className="rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-lg font-semibold text-slate-900">{cat.name}</h3>
                <span className="flex-shrink-0 text-sm font-medium text-slate-500 bg-slate-100 rounded-full px-3 py-0.5">
                  {cat.weight}% of total
                </span>
              </div>

              <p className="text-slate-600 leading-relaxed">{cat.description}</p>

              <div className="space-y-2">
                <div className="bg-slate-50 rounded-xl border border-slate-100 px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Formula</p>
                  <p
                    className="text-[15px] text-slate-800 leading-relaxed italic tracking-wide"
                    style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
                  >
                    {cat.formula}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Data Source</p>
                    <p className="text-sm text-slate-700">{cat.dataSource}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Notes</p>
                    <ul className="space-y-1">
                      {cat.notes.map((note, i) => (
                        <li key={i} className="flex gap-2 text-sm text-slate-700">
                          <span className="text-slate-400 flex-shrink-0 mt-px">·</span>
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Grade scale */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Grade Scale</h2>
          <p className="text-slate-600 mb-5">
            Numerical scores (0–100) are converted to letter grades using a standard academic scale.
          </p>
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-slate-600">Score Range</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-600">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {gradeTable.map(({ range, grade }) => (
                  <tr key={grade} className="bg-white">
                    <td className="px-5 py-2.5 text-slate-600">{range}</td>
                    <td className="px-5 py-2.5 font-semibold text-slate-900">{grade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Data limitations */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Data Limitations</h2>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900 space-y-3">
            <p>
              <strong>Vote participation is a sample.</strong> Participation is calculated from the 50 most recent
              roll-call votes. This is an accurate proxy for recent performance but does not cover the entire session.
            </p>
            <p>
              <strong>Senate participation is unavailable.</strong> Congress.gov does not yet expose Senate roll-call
              vote data through the same API. Senate members are scored only on Bipartisan Engagement until this
              data source is integrated.
            </p>
            <p>
              <strong>Not a complete picture.</strong> Constituent casework, private negotiations, and informal
              cross-aisle collaboration are difficult to quantify from public records alone.
            </p>
            <p>
              <strong>Corrections welcome.</strong> If you believe a score contains an error, use the community
              correction form. All corrections are reviewed with supporting evidence before any change is made.
            </p>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="border-t border-slate-200 pt-8">
          <p className="text-slate-500 text-sm">
            Have questions about this methodology?{" "}
            <Link href="/about" className="text-slate-800 underline underline-offset-2 hover:text-slate-900">
              Learn more about our approach
            </Link>{" "}
            or review the{" "}
            <a href="https://github.com" className="text-slate-800 underline underline-offset-2 hover:text-slate-900">
              source code and test suite
            </a>{" "}
            for the scoring engine.
          </p>
        </section>
      </div>
    </main>
  );
}
