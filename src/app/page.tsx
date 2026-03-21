"use client";

import Link from "next/link";
import { freePressFont, latoFont } from "@/styles/fonts";
import { BudgetCountdown } from "@/components/BudgetCountdown";
import { RecentBills } from "@/components/legislation/RecentBills";
import { WaitlistForm } from "@/components/forms/WaitlistForm";
import { useCongressStats } from "@/hooks";
import { StatusBadge, SectionHeader } from "@/components/ui";
import type { Status } from "@/components/ui";

const DAY_MS = 1000 * 60 * 60 * 24;

type BriefingItem = {
  title: string;
  summary: string;
  status: Status;
  detail: string;
};

type ChoreItem = {
  title: string;
  due: string;
  status: Status;
  impact: string;
  source: string;
  sourceUrl?: string;
};

type Metric = {
  label: string;
  value: string;
  change: string;
  tone?: "good" | "caution" | "neutral";
};

type Official = {
  name: string;
  office: string;
  score: number;
  attendance: string;
  civilityNotes: string;
};

type CivicAction = {
  title: string;
  summary: string;
  level: string;
  action: string;
};

const weeklyBriefing: BriefingItem[] = [
  {
    title: "Appropriations: Senate advanced 7 of 12 spending bills",
    summary: "Committee marked up Transportation and Energy packages with near-unanimous votes.",
    status: "advanced",
    detail: "Next: full Senate consideration. House versions still pending.",
  },
  {
    title: "FAA reauthorization still awaiting floor time",
    summary: "Renewal remains stalled while temporary extension covers airport operations.",
    status: "stalled",
    detail: "Deadline approaching; no confirmed debate window.",
  },
  {
    title: "Disaster aid supplemental cleared the House",
    summary: "Passed with broad support after amendment debate focused on reporting requirements.",
    status: "passed",
    detail: "Heads to Senate; agency funding needs to be released before October.",
  },
  {
    title: "AI framework hearing held in Senate Commerce",
    summary: 'Experts testified on transparency standards; draft bill promised "before recess."',
    status: "update",
    detail: "Committee staff compiling recommendations; no vote scheduled.",
  },
];

const deadlines: BriefingItem[] = [
  {
    title: "Government funding runs out",
    summary: "Current stopgap expires; House has 4 of 12 bills drafted, none on floor calendar.",
    status: "overdue",
    detail: "Congressional Research Service notes seven-day notice needed for orderly transition.",
  },
  {
    title: "National Flood Insurance Program renewal",
    summary: "Short-term extension expires; lapse would pause new policies.",
    status: "overdue",
    detail: "Floor time not yet reserved in either chamber.",
  },
  {
    title: "Defense authorization conference report",
    summary: "Chambers still reconciling procurement sections; conferees not announced.",
    status: "scheduled",
    detail: 'Leaders said "before end of month," but no public timeline released.',
  },
];

const choreList: ChoreItem[] = [
  {
    title: "FAA Reauthorization (multi-year)",
    due: "Past due - temporary patch ends in weeks",
    status: "overdue",
    impact: "Keeps airports, safety inspectors, and modernization projects funded.",
    source: "Congress.gov",
    sourceUrl:
      "https://www.congress.gov/search?q=%7B%22source%22%3A%22legislation%22%2C%22search%22%3A%22FAA+reauthorization%22%7D",
  },
  {
    title: "Appropriations x12",
    due: "Next shutdown date: 4 weeks",
    status: "scheduled",
    impact: "Full-year budgets prevent automatic cuts and agency slowdowns.",
    source: "Congress.gov",
    sourceUrl: "https://www.congress.gov/appropriations",
  },
  {
    title: "Defense Authorization (NDAA)",
    due: "Conference report pending",
    status: "advanced",
    impact: "Sets pay, procurement, and policy guidance for the services.",
    source: "Congress.gov",
    sourceUrl:
      "https://www.congress.gov/search?q=%7B%22source%22%3A%22legislation%22%2C%22search%22%3A%22National+Defense+Authorization+Act%22%7D",
  },
  {
    title: "Data privacy baseline",
    due: "Draft expected; no vote scheduled",
    status: "stalled",
    impact: "National rules for data handling and consumer transparency.",
    source: "Congress.gov",
    sourceUrl:
      "https://www.congress.gov/search?q=%7B%22source%22%3A%22legislation%22%2C%22search%22%3A%22data+privacy%22%7D",
  },
];

const officials: Official[] = [
  {
    name: "Jordan Lee",
    office: "U.S. Senator - Mid-Atlantic",
    score: 86,
    attendance: "98% vote attendance - 94% committee attendance",
    civilityNotes: "No recorded decorum issues this session.",
  },
  {
    name: "Avery Chen",
    office: "U.S. Representative - 7th District",
    score: 72,
    attendance: "93% vote attendance - 88% committee attendance",
    civilityNotes: "Filed 3 bipartisan co-sponsor clusters in June.",
  },
  {
    name: "Samira Patel",
    office: "U.S. Senator - Southwest",
    score: 64,
    attendance: "89% vote attendance - 80% committee attendance",
    civilityNotes: "One formal warning for withdrawn remarks; resolved.",
  },
];

const civicActions: CivicAction[] = [
  {
    title: "Letter: Finish full-year budgets",
    summary: "Direct, neutral message reminding members to move all 12 appropriations bills before the next deadline.",
    level: "Federal",
    action: "Send to your delegation",
  },
  {
    title: "Petition: Publish hearing materials on time",
    summary: "Requests committees to post witness lists, slides, and recordings within 48 hours of each hearing.",
    level: "Congressional committees",
    action: "Add your name",
  },
  {
    title: "Alert: Track FAA reauthorization",
    summary: "Get updates when the reauthorization bill moves committees or is scheduled for floor debate.",
    level: "Federal aviation policy",
    action: "Start tracking",
  },
];

const scoreBands: Record<NonNullable<Metric["tone"]>, { text: string; bar: string; chip: string }> = {
  good: {
    text: "text-emerald-700",
    bar: "bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600",
    chip: "bg-emerald-50 text-emerald-800 border border-emerald-200",
  },
  caution: {
    text: "text-amber-700",
    bar: "bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500",
    chip: "bg-amber-50 text-amber-800 border border-amber-200",
  },
  neutral: {
    text: "text-slate-700",
    bar: "bg-gradient-to-r from-slate-300 via-slate-400 to-slate-500",
    chip: "bg-slate-50 text-slate-800 border border-slate-200",
  },
};

// Productivity metrics that cannot yet be derived from the Congress.gov API.
// These will be replaced with live data when additional data sources are wired.
const STATIC_METRICS: Metric[] = [
  { label: "Hearings held", value: "—", change: "data coming soon", tone: "neutral" },
  { label: "Floor hours worked", value: "—", change: "data coming soon", tone: "neutral" },
  { label: "Vote attendance", value: "—", change: "data coming soon", tone: "neutral" },
  { label: "Committee attendance", value: "—", change: "data coming soon", tone: "neutral" },
  { label: "Deadlines missed", value: "3", change: "overdue tasks", tone: "caution" },
];

function getBudgetStats(dateString: string) {
  const parsed = Date.parse(dateString);
  if (!Number.isFinite(parsed)) {
    return { daysSinceBudget: 0, lastBudgetDateLabel: "unknown" };
  }

  const daysSinceBudget = Math.max(0, Math.floor((Date.now() - parsed) / DAY_MS));
  const lastBudgetDateLabel = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(parsed));

  return { daysSinceBudget, lastBudgetDateLabel };
}

const showBudgetTimer = process.env.NEXT_PUBLIC_SHOW_BUDGET_TIMER === "true";

export default function Home() {
  const { data: statsData, loading: statsLoading } = useCongressStats();

  const lastBudgetDate = process.env.NEXT_PUBLIC_BUDGET_LAST_PASSED_DATE ?? "2024-03-23";
  const { daysSinceBudget, lastBudgetDateLabel } = getBudgetStats(lastBudgetDate);

  const billsValue = statsLoading ? "..." : (statsData?.billsAdvancedThisWeek?.toString() ?? "—");

  const billsChangeLabel = (() => {
    if (!statsData) return "...";
    const diff = statsData.billsChange;
    if (diff === 0) return "same as last week";
    const sign = diff > 0 ? "+" : "";
    return `${sign}${diff} vs last week`;
  })();

  const productivityMetrics: Metric[] = [
    {
      label: "Bills advanced this week",
      value: billsValue,
      change: billsChangeLabel,
      tone: statsData?.billsChangeTone ?? "neutral",
    },
    ...STATIC_METRICS,
  ];

  const heroMetrics = [
    { label: "Bills advanced", value: billsValue, detail: billsChangeLabel },
    { label: "Hearings", value: "—", detail: "data coming soon" },
    { label: "Vote attendance", value: "—", detail: "data coming soon" },
    {
      label: "Days since budget passed",
      value: daysSinceBudget.toLocaleString("en-US"),
      detail: `since ${lastBudgetDateLabel}`,
    },
  ];

  return (
    <main className={`min-h-screen px-4 pb-20 pt-10 text-slate-900 ${latoFont.className}`}>
      <div className="mx-auto flex max-w-6xl flex-col gap-12">
        <header className="flex flex-col gap-8">
          {showBudgetTimer && <BudgetCountdown />}
          <div className="relative overflow-hidden rounded-[32px] border border-amber-100/80 bg-gradient-to-br from-[#eaf4fb] via-white to-[#fde7e3] px-6 py-10 shadow-xl shadow-amber-100/40">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(148,163,184,0.32)_1px,transparent_1px)] bg-[size:26px_26px] opacity-40" />
            <div className="pointer-events-none absolute -left-24 -top-24 h-48 w-48 rotate-6 rounded-full bg-amber-200/40 blur-3xl" />
            <div className="pointer-events-none absolute -right-16 bottom-0 h-56 w-56 rotate-12 rounded-full bg-emerald-200/40 blur-3xl" />
            <div className="relative flex flex-col items-center gap-5 text-center">
              <div className="flex flex-col items-center gap-3 text-slate-800">
                <h1
                  className={`${freePressFont.className} text-4xl leading-none tracking-tight text-slate-900 sm:text-5xl md:text-6xl`}
                >
                  Congress Do Your Job
                </h1>
                <p className="text-base font-semibold uppercase tracking-[0.22em] text-slate-500 sm:text-lg">
                  Less theater. More legislation.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-medium">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 ring-1 ring-emerald-100">
                  Public alpha
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 ring-1 ring-slate-200">
                  Neutral, plain English
                </span>
              </div>
            </div>
          </div>

          <section className="relative overflow-hidden rounded-3xl border border-amber-100 bg-gradient-to-r from-amber-50 via-white to-emerald-50 px-4 sm:px-8 py-6 sm:py-10 shadow-xl shadow-amber-100/40">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(148,163,184,0.35)_1px,transparent_1px)] bg-[size:22px_22px] opacity-40" />
            <div className="absolute inset-y-0 right-0 w-1/2 max-w-md bg-gradient-to-l from-emerald-100/50 via-white to-transparent blur-3xl" />
            <div className="relative grid gap-10 lg:grid-cols-[1.3fr_1fr]">
              <div className="space-y-6">
                <p className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 ring-1 ring-amber-100">
                  Weekly civic briefing
                </p>
                <h2 className={`${freePressFont.className} text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl`}>
                  What your representatives actually did this week - no spin, no red/blue.
                </h2>
                <p className="max-w-2xl text-lg text-slate-700">
                  Plain-English updates on bills, attendance, hearings, and deadlines. Built for people who want facts without
                  outrage.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/legislation"
                    className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background shadow-lg shadow-slate-300/60 transition hover:-translate-y-[1px] hover:shadow-xl hover:shadow-slate-300/80"
                  >
                    See this week&apos;s briefing
                    <span aria-hidden>&rarr;</span>
                  </Link>
                  <Link
                    href="/representatives"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:-translate-y-[1px] hover:border-slate-300"
                  >
                    Find your representatives
                  </Link>
                </div>
              </div>
              <div className="relative grid gap-4 rounded-2xl bg-white/90 p-5 ring-1 ring-amber-100 backdrop-blur">
                <div className="flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3 text-white shadow-lg shadow-slate-900/40">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-200">Do Your Job score</p>
                    <p className="text-3xl font-semibold">78.4</p>
                    <p className="text-xs text-slate-200">Congressional average - live every Monday</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-xs text-emerald-200">
                    <span className="rounded-full bg-white/10 px-3 py-1 font-semibold text-emerald-100">+1.7 pts</span>
                    <span className="text-slate-200">Week over week</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 text-sm font-medium text-slate-800 sm:grid-cols-2">
                  {heroMetrics.map((item) => (
                    <div key={item.label} className="rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
                      <p className="text-2xl font-semibold text-slate-900">{item.value}</p>
                      <p className="text-xs text-slate-500">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </header>

        <section className="grid gap-6 rounded-3xl border border-slate-200/80 bg-white/90 p-6 md:p-8 shadow-lg shadow-slate-200/60">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Live Data</p>
              <h2 className="text-2xl font-semibold leading-tight text-slate-900">Recent Congressional Activity</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Real-time legislative updates from Congress.gov. Bills, votes, and actions from the past 7 days.
              </p>
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <div className="space-y-4">
              <RecentBills limit={5} days={7} />
            </div>
            <div className="space-y-4 rounded-2xl border border-amber-100 bg-amber-50/70 p-5 shadow-inner">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Deadlines and what slipped</h3>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 ring-1 ring-amber-100">
                  Schedule
                </span>
              </div>
              {deadlines.map((item) => (
                <article key={item.title} className="rounded-xl border border-amber-100 bg-white/90 px-4 py-3 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-base font-semibold text-slate-900">{item.title}</h4>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-700">{item.summary}</p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-slate-500">{item.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-slate-200/80 bg-white/90 p-6 md:p-8 shadow-lg shadow-slate-200/60">
          <SectionHeader
            eyebrow="Chores list"
            title="What Congress still owes the public"
            description="The accountability board. Each task gets a due date, current status, and why it matters."
          />
          <div className="grid gap-4 md:grid-cols-2">
            {choreList.map((chore) => (
              <article
                key={chore.title}
                className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:-translate-y-[2px] hover:border-amber-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{chore.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{chore.impact}</p>
                  </div>
                  <StatusBadge status={chore.status} />
                </div>
                <div className="mt-3 flex items-center justify-between text-sm font-medium text-slate-700">
                  <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-amber-800 ring-1 ring-amber-100">
                    <span className="h-2 w-2 rounded-full bg-amber-400" aria-hidden />
                    {chore.due}
                  </div>
                  {chore.sourceUrl ? (
                    <a
                      href={chore.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 underline-offset-2 hover:underline"
                    >
                      {chore.source}
                    </a>
                  ) : (
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{chore.source}</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-slate-200/80 bg-white/90 p-6 md:p-8 shadow-lg shadow-slate-200/60">
          <SectionHeader
            eyebrow="Productivity dashboard"
            title="Behavior over rhetoric"
            description="Daily-updated stats designed to feel like Strava for Congress: reps, recovery, and accountability."
            dataStatus="partial"
          />
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {productivityMetrics.map((metric) => {
              const band = metric.tone ? scoreBands[metric.tone] : scoreBands.neutral;
              return (
                <div
                  key={metric.label}
                  className="flex h-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:-translate-y-[2px] hover:border-amber-200 hover:shadow-md"
                >
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{metric.label}</p>
                  <p className="text-3xl font-semibold text-slate-900">{metric.value}</p>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full ${band.bar}`} />
                  </div>
                  <span
                    className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${band.chip}`}
                  >
                    {metric.change}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-slate-200/80 bg-white/90 p-6 md:p-8 shadow-lg shadow-slate-200/60">
          <SectionHeader
            eyebrow="Member profiles"
            title="Behavior-first scorecards"
            description="Vote attendance, committee work, and documented decorum events. No party labels, no ideology."
          />
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {officials.map((official) => (
              <article
                key={official.name}
                className="flex h-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:-translate-y-[2px] hover:border-amber-200 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{official.office}</p>
                    <h3 className="text-xl font-semibold text-slate-900">{official.name}</h3>
                  </div>
                  <div className="rounded-full bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white shadow-lg shadow-slate-900/40">
                    {official.score}
                  </div>
                </div>
                <p className="text-sm text-slate-600">{official.attendance}</p>
                <div className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800 ring-1 ring-emerald-100">
                  {official.civilityNotes}
                </div>
              </article>
            ))}
          </div>
          <div className="flex justify-end">
            <Link
              href="/scorecard"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 underline-offset-4 hover:underline"
            >
              Look up any member&apos;s scorecard
              <span aria-hidden>&rarr;</span>
            </Link>
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-slate-200/80 bg-white/90 p-6 md:p-8 shadow-lg shadow-slate-200/60">
          <SectionHeader
            eyebrow="Civic actions"
            title="Calm actions you can take in one tap"
            description="Carefully worded letters and petitions. No outrage. No party framing."
          />
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {civicActions.map((action) => (
              <article
                key={action.title}
                className="flex h-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:-translate-y-[2px] hover:border-amber-200 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{action.level}</p>
                    <h3 className="text-lg font-semibold text-slate-900">{action.title}</h3>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-amber-800 ring-1 ring-amber-100">
                    Ready
                  </span>
                </div>
                <p className="text-sm text-slate-600">{action.summary}</p>
                <button className="inline-flex w-fit items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-background shadow-sm shadow-slate-300/70 transition hover:-translate-y-[1px] hover:shadow">
                  {action.action}
                  <span aria-hidden>&rarr;</span>
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-amber-50 px-4 sm:px-8 py-6 sm:py-10 shadow-lg shadow-emerald-100/50">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(148,163,184,0.35)_1px,transparent_1px)] bg-[size:20px_20px] opacity-50" />
          <div className="relative grid gap-6 md:grid-cols-[1.2fr_1fr]">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">Stay in the loop</p>
              <h3 className={`${freePressFont.className} text-3xl font-semibold text-slate-900`}>Weekly inbox briefing</h3>
              <p className="max-w-xl text-sm text-slate-700">
                Every Monday morning: what moved, what stalled, what slipped, and what to expect next week. Free while we build;
                premium tier will add personalized tracking.
              </p>
              <div className="flex flex-wrap gap-3 text-sm text-slate-700">
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
                  Neutral. No outrage.
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
                  Plain English summaries
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
                  Primary source links
                </span>
              </div>
            </div>
            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
              <p className="text-sm font-semibold text-slate-800">Get the Monday briefing</p>
              <WaitlistForm />
              <p className="text-xs text-slate-500">No spam, ever. Unsubscribe anytime.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
