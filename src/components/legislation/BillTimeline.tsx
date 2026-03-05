"use client";

import { Bill } from "@/types/congress";
import { formatDate } from "@/utils/dates";

interface BillTimelineProps {
  bill: Bill;
}

interface Stage {
  label: string;
  key: string;
  activeColor: string;
  ringColor: string;
  barColor: string;
}

const STAGES: Stage[] = [
  { label: "Introduced", key: "introduced", activeColor: "bg-emerald-500", ringColor: "bg-emerald-400", barColor: "bg-emerald-400" },
  { label: "Committee", key: "committee", activeColor: "bg-amber-500", ringColor: "bg-amber-400", barColor: "bg-amber-400" },
  { label: "Floor Vote", key: "floor", activeColor: "bg-lime-500", ringColor: "bg-lime-400", barColor: "bg-lime-400" },
  { label: "Signed", key: "signed", activeColor: "bg-emerald-500", ringColor: "bg-emerald-400", barColor: "bg-emerald-400" },
];

function getCurrentStage(bill: Bill): number {
  const action = bill.latestAction?.text.toLowerCase() ?? "";
  if (action.includes("became public law") || action.includes("signed by president")) return 3;
  if (action.includes("passed") || action.includes("agreed to") || action.includes("calendar")) return 2;
  if (action.includes("committee") || action.includes("referred")) return 1;
  return 0;
}

function daysBetween(start: string, end: Date): number {
  const startDate = new Date(start);
  const diffMs = end.getTime() - startDate.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function buildTooltip(index: number, currentStage: number, bill: Bill): string {
  const now = new Date();

  if (index > currentStage) return "Not yet reached";

  if (index === currentStage) {
    // Active stage: days since the most recent recorded action
    const anchor = bill.latestAction?.actionDate ?? bill.introducedDate;
    const days = daysBetween(anchor, now);
    if (days === 0) return "Active today";
    return `Active for ${days} day${days !== 1 ? "s" : ""}`;
  }

  // Completed stage: we don't have exact per-stage timestamps without fetching
  // all actions, so show completion as acknowledged without fabricating dates
  if (index === 0) {
    const days = daysBetween(bill.introducedDate, now);
    return `Introduced ${days} day${days !== 1 ? "s" : ""} ago`;
  }

  return "Completed";
}

export function BillTimeline({ bill }: BillTimelineProps) {
  const currentStage = getCurrentStage(bill);

  return (
    <div className="w-full border-t border-slate-200 bg-gradient-to-r from-amber-50/30 via-white to-emerald-50/30 p-4">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-600">Legislative Progress</p>

      <div className="flex items-center">
        {STAGES.map((stage, index) => {
          const isCompleted = index < currentStage;
          const isActive = index === currentStage;
          const isPending = index > currentStage;
          const tooltip = buildTooltip(index, currentStage, bill);

          return (
            <div key={stage.key} className="flex flex-1 items-center">
              {/* Stage node */}
              <div className="group relative flex flex-col items-center">
                {/* Dot with optional pulse ring */}
                <div className="relative flex items-center justify-center">
                  {isActive && (
                    <span
                      className={`absolute inline-flex h-5 w-5 rounded-full opacity-60 animate-ping ${stage.ringColor}`}
                      aria-hidden="true"
                    />
                  )}
                  <div
                    className={`relative h-3.5 w-3.5 rounded-full transition-colors duration-300 ${
                      isCompleted || isActive ? stage.activeColor : "bg-slate-200"
                    }`}
                  />
                </div>

                {/* Label */}
                <p
                  className={`mt-1.5 whitespace-nowrap text-xs font-medium transition-colors ${
                    isPending ? "text-slate-400" : "text-slate-800"
                  }`}
                >
                  {stage.label}
                </p>

                {/* Hover tooltip */}
                <div
                  role="tooltip"
                  className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-md bg-slate-800 px-2.5 py-1.5 text-xs text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 whitespace-nowrap"
                >
                  {tooltip}
                  {/* Arrow */}
                  <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                </div>
              </div>

              {/* Connector bar (skip after last stage) */}
              {index < STAGES.length - 1 && (
                <div className="mx-1.5 h-0.5 flex-1 bg-slate-200 overflow-hidden rounded-full">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      index < currentStage ? stage.barColor : "w-0"
                    }`}
                    style={{ width: index < currentStage ? "100%" : "0%" }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Latest action summary */}
      {bill.latestAction && (
        <p className="mt-4 text-xs text-slate-600">
          <span className="font-medium">Latest:</span> {bill.latestAction.text}{" "}
          <span className="text-slate-400">({formatDate(bill.latestAction.actionDate)})</span>
        </p>
      )}
    </div>
  );
}
