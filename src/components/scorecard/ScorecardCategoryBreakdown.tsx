"use client";

import type { ScorecardCategoryBreakdownProps } from "./types";
import { CategoryRow } from "./CategoryRow";

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
