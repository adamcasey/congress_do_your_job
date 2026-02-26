"use client";

import { useState } from "react";
import { CategoryScore, ScoreCategory } from "@/types/scorecard";

interface ScorecardCategoryBreakdownProps {
  categoryScores: CategoryScore[];
}

const categoryDisplayNames: Record<ScoreCategory, string> = {
  [ScoreCategory.ATTENDANCE]: "Attendance",
  [ScoreCategory.LEGISLATION]: "Legislation",
  [ScoreCategory.BIPARTISANSHIP]: "Bipartisanship",
  [ScoreCategory.COMMITTEE_WORK]: "Committee Work",
  [ScoreCategory.CIVILITY]: "Civility",
  [ScoreCategory.THEATER_RATIO]: "Work vs. Theater",
};

const categoryDescriptions: Record<ScoreCategory, string> = {
  [ScoreCategory.ATTENDANCE]: "Vote and hearing participation rate",
  [ScoreCategory.LEGISLATION]: "Bills sponsored, advanced, and enacted",
  [ScoreCategory.BIPARTISANSHIP]: "Working across party lines",
  [ScoreCategory.COMMITTEE_WORK]: "Hearing, markup, and committee participation",
  [ScoreCategory.CIVILITY]: "Professional conduct on the record",
  [ScoreCategory.THEATER_RATIO]: "Legislative actions vs. media activity",
};

function getBarColor(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 70) return "bg-teal-500";
  if (score >= 60) return "bg-amber-500";
  if (score >= 50) return "bg-orange-400";
  return "bg-red-400";
}

function formatInputKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

interface CategoryRowProps {
  cs: CategoryScore;
}

function CategoryRow({ cs }: CategoryRowProps) {
  const [expanded, setExpanded] = useState(false);
  const displayName = categoryDisplayNames[cs.category];
  const description = categoryDescriptions[cs.category];
  const barColor = getBarColor(cs.rawScore);
  const weightPct = Math.round(cs.weight * 100);

  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left py-4 px-0 group"
        aria-expanded={expanded}
      >
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <span className="font-medium text-slate-900 text-sm">{displayName}</span>
            <span className="ml-2 text-xs text-slate-400">({weightPct}% weight)</span>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-sm font-semibold text-slate-700">{Math.round(cs.rawScore)}</span>
            <span className="text-xs text-slate-400 group-hover:text-slate-600 transition-colors">{expanded ? "▲" : "▼"}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${cs.rawScore}%` }} />
        </div>

        <p className="text-xs text-slate-500 mt-1.5">{description}</p>
      </button>

      {/* Expanded detail panel */}
      {expanded && (
        <div className="pb-4 space-y-3">
          <div className="rounded-lg bg-slate-50 p-4 text-xs space-y-2">
            <p className="text-slate-600">{cs.details.description}</p>

            <div className="pt-2 border-t border-slate-200">
              <p className="font-medium text-slate-700 mb-1.5">Data inputs:</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {Object.entries(cs.details.inputs).map(([key, val]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-slate-500">{formatInputKey(key)}</span>
                    <span className="font-medium text-slate-700">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <p className="font-medium text-slate-700 mb-1">Formula:</p>
              <code className="text-slate-600 font-mono text-[11px] break-all">{cs.details.formula}</code>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
              <span className="text-slate-500">Weighted contribution to total:</span>
              <span className="font-semibold text-slate-800">{cs.weightedScore.toFixed(1)} pts</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ScorecardCategoryBreakdown({ categoryScores }: ScorecardCategoryBreakdownProps) {
  return (
    <div className="w-full">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Category Breakdown</h3>
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-5">
        {categoryScores.map((cs) => (
          <CategoryRow key={cs.category} cs={cs} />
        ))}
      </div>
    </div>
  );
}
