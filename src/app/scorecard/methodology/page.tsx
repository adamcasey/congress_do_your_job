import Link from "next/link";
import { DEFAULT_WEIGHTS, METHODOLOGY_VERSION } from "@/services/scorecard-calculator";
import { ScoreCategory } from "@/types/scorecard";

export const metadata = {
  title: "Scorecard Methodology - Congress Do Your Job",
  description:
    "Transparent, documented methodology for how we calculate Civility & Productivity Scorecards for members of Congress.",
};

const categories = [
  {
    category: ScoreCategory.ATTENDANCE,
    name: "Attendance",
    weight: DEFAULT_WEIGHTS[ScoreCategory.ATTENDANCE],
    description:
      "Measures participation in floor votes and committee hearings. Vote participation is weighted more heavily (70%) because voting is the core legislative function.",
    formula: "(vote participation rate × 0.7) + (hearing attendance rate × 0.3)",
    dataSource: "Congress.gov vote records, official hearing schedules",
    notes:
      "Members are not penalized when no votes are scheduled. Vote pairing and announced positions are counted as participation.",
  },
  {
    category: ScoreCategory.LEGISLATION,
    name: "Legislation",
    weight: DEFAULT_WEIGHTS[ScoreCategory.LEGISLATION],
    description:
      "Measures legislative productivity using a points system that rewards activity at each stage of the legislative process. Points are normalized logarithmically to prevent bulk cosponsorships from distorting scores.",
    formula: "clamp(25 × log₂(points + 1), 10, 100)",
    dataSource: "Congress.gov bill records, cosponsor data, bill status",
    notes: [
      "Bill sponsored: 3 points",
      "Bill cosponsored: 1 point",
      "Bill advanced past committee: 5 points",
      "Bill passed chamber: 8 points",
      "Bill enacted into law: 15 points",
      "Amendment proposed: 2 points",
      "Amendment adopted: 4 points",
    ].join(" · "),
  },
  {
    category: ScoreCategory.BIPARTISANSHIP,
    name: "Bipartisanship",
    weight: DEFAULT_WEIGHTS[ScoreCategory.BIPARTISANSHIP],
    description:
      "Rewards working across party lines. Measured by the rate of cross-party cosponsorships and the proportion of bipartisan bill sponsorships.",
    formula: "(cross-party cosponsor rate × 0.6) + (bipartisan sponsor rate × 0.4)",
    dataSource: "Congress.gov cosponsor records with party affiliation cross-reference",
    notes:
      "Members with no cosponsorships receive a neutral score (50) rather than a penalty, since low cosponsor counts may reflect individual legislative style, not partisanship.",
  },
  {
    category: ScoreCategory.COMMITTEE_WORK,
    name: "Committee Work",
    weight: DEFAULT_WEIGHTS[ScoreCategory.COMMITTEE_WORK],
    description:
      "Measures active participation beyond floor votes: hearing attendance within assigned committees, participation in markup sessions, and breadth of committee service.",
    formula: "(hearing rate × 0.5) + (markup participation rate × 0.4) + min(committee count × 3, 10)",
    dataSource: "Congress.gov committee records, official hearing attendance",
    notes:
      "Committee service bonus is capped at +10 points to prevent artificial inflation from holding many minor committee seats.",
  },
  {
    category: ScoreCategory.CIVILITY,
    name: "Civility",
    weight: DEFAULT_WEIGHTS[ScoreCategory.CIVILITY],
    description:
      "Starts at a baseline of 80 (professional conduct assumed). Deductions are made only for documented, verifiable incivility in official proceedings. Bonuses are awarded for bipartisan engagement.",
    formula:
      "clamp(80 − (attacks × 10) − (censures × 25) − (ethics × 5) + min(caucuses × 5, 15) + min(⌊cosponsorships / 5⌋, 10), 0, 100)",
    dataSource: "Congressional Record, Ethics Committee records, official caucus memberships",
    notes:
      "Personal attacks are only counted when documented in the Congressional Record or official proceedings. Social media rhetoric is NOT included. All civility deductions require human editorial review before publication.",
  },
  {
    category: ScoreCategory.THEATER_RATIO,
    name: "Work vs. Theater",
    weight: DEFAULT_WEIGHTS[ScoreCategory.THEATER_RATIO],
    description:
      "Measures whether a member spends proportionate time governing versus performing. High legislative output with moderate media activity scores well. Low legislative output with high media activity scores poorly.",
    formula: "ratio = legislativeActions / (socialMedia + media + pressConferences + 1), mapped to 0–100",
    dataSource: "Congress.gov actions, Twitter/X API (public posts), TV appearance logs",
    notes: [
      "ratio ≥ 1.0 → score 90–100 (more work than theater)",
      "ratio ≥ 0.5 → score 70–89 (balanced)",
      "ratio ≥ 0.2 → score 40–69 (leaning theater)",
      "ratio < 0.2  → score 0–39 (all theater, no work)",
    ].join(" · "),
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
        <div className="max-w-3xl mx-auto px-6 py-10">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-800 transition-colors mb-6 inline-block">
            ← Back to home
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Scorecard Methodology</h1>
          <p className="mt-3 text-slate-600 text-lg leading-relaxed">
            Our Civility &amp; Productivity Scorecards are calculated entirely from verifiable public records. Every formula,
            weight, and data source is documented here.
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

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-16">
        {/* Principles */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Core Principles</h2>
          <ul className="space-y-3 text-slate-600">
            <li className="flex gap-3">
              <span className="text-slate-300 mt-0.5">—</span>
              <span>
                <strong className="text-slate-800">Verifiable only.</strong> Every data point can be traced to an official
                government record. We score what legislators DO, not what they say.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-slate-300 mt-0.5">—</span>
              <span>
                <strong className="text-slate-800">Non-partisan.</strong> Methodology never references party affiliation as a
                factor in scoring. We measure bipartisanship as a positive behavior, not partisanship as a negative one.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-slate-300 mt-0.5">—</span>
              <span>
                <strong className="text-slate-800">Human review required.</strong> All sentiment analysis, promise tracking, and
                media interpretation is reviewed by our editorial team before publication. No automated scoring of speech
                content.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-slate-300 mt-0.5">—</span>
              <span>
                <strong className="text-slate-800">Transparent methodology.</strong> Every change to the scoring algorithm is
                version-controlled and publicly documented.
              </span>
            </li>
          </ul>
        </section>

        {/* Category weights summary */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Category Weights</h2>
          <p className="text-slate-600 mb-5">
            The overall score is a weighted sum of six categories. Weights reflect the relative importance of each activity to
            the core job of legislating.
          </p>
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-slate-600">Category</th>
                  <th className="text-right px-5 py-3 font-medium text-slate-600">Weight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((cat) => (
                  <tr key={cat.category} className="bg-white">
                    <td className="px-5 py-3 text-slate-800">{cat.name}</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-900">{Math.round(cat.weight * 100)}%</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-semibold">
                  <td className="px-5 py-3 text-slate-700">Total</td>
                  <td className="px-5 py-3 text-right text-slate-900">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Category details */}
        <section className="space-y-10">
          <h2 className="text-xl font-semibold text-slate-900">Category Details</h2>
          {categories.map((cat) => (
            <div key={cat.category} className="rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-lg font-semibold text-slate-900">{cat.name}</h3>
                <span className="flex-shrink-0 text-sm font-medium text-slate-500 bg-slate-100 rounded-full px-3 py-0.5">
                  {Math.round(cat.weight * 100)}% of total
                </span>
              </div>

              <p className="text-slate-600 leading-relaxed">{cat.description}</p>

              <div className="space-y-2">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Formula</p>
                  <code className="text-sm text-slate-700 font-mono break-all">{cat.formula}</code>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Data Source</p>
                    <p className="text-sm text-slate-700">{cat.dataSource}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Notes</p>
                    <p className="text-sm text-slate-700">{cat.notes}</p>
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
              <strong>Partial data during early operation.</strong> Categories without live data sources (committee attendance,
              civility, theater ratio) use neutral defaults until connections are established. Each scorecard displays a data
              source transparency report showing which categories are live, partial, or using defaults.
            </p>
            <p>
              <strong>Not a complete picture.</strong> Constituent casework, private negotiations, and informal cross-aisle
              collaboration are difficult to quantify. This scorecard measures what can be verified from public records, not
              every aspect of an official's work.
            </p>
            <p>
              <strong>Corrections welcome.</strong> If you believe a score contains an error, use the community correction form.
              All corrections are reviewed with supporting evidence before any change is made.
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
