"use client";

import { ScorecardGrade } from "@/types/scorecard";

interface ScorecardGaugeProps {
  score: number;
  grade: ScorecardGrade;
  size?: "sm" | "md" | "lg";
}

const gradeColors: Record<string, { stroke: string; text: string; bg: string }> = {
  "A+": { stroke: "#10b981", text: "text-emerald-600", bg: "bg-emerald-50" },
  A: { stroke: "#10b981", text: "text-emerald-600", bg: "bg-emerald-50" },
  "A-": { stroke: "#34d399", text: "text-emerald-500", bg: "bg-emerald-50" },
  "B+": { stroke: "#14b8a6", text: "text-teal-600", bg: "bg-teal-50" },
  B: { stroke: "#14b8a6", text: "text-teal-600", bg: "bg-teal-50" },
  "B-": { stroke: "#2dd4bf", text: "text-teal-500", bg: "bg-teal-50" },
  "C+": { stroke: "#f59e0b", text: "text-amber-600", bg: "bg-amber-50" },
  C: { stroke: "#f59e0b", text: "text-amber-600", bg: "bg-amber-50" },
  "C-": { stroke: "#fbbf24", text: "text-amber-500", bg: "bg-amber-50" },
  "D+": { stroke: "#f97316", text: "text-orange-600", bg: "bg-orange-50" },
  D: { stroke: "#f97316", text: "text-orange-600", bg: "bg-orange-50" },
  "D-": { stroke: "#fb923c", text: "text-orange-500", bg: "bg-orange-50" },
  F: { stroke: "#ef4444", text: "text-red-600", bg: "bg-red-50" },
};

const sizes = {
  sm: { viewBox: 120, r: 45, cx: 60, cy: 60, scoreSize: "text-2xl", gradeSize: "text-sm", strokeWidth: 8 },
  md: { viewBox: 160, r: 60, cx: 80, cy: 80, scoreSize: "text-4xl", gradeSize: "text-base", strokeWidth: 10 },
  lg: { viewBox: 200, r: 80, cx: 100, cy: 100, scoreSize: "text-5xl", gradeSize: "text-lg", strokeWidth: 12 },
};

export function ScorecardGauge({ score, grade, size = "md" }: ScorecardGaugeProps) {
  const colors = gradeColors[grade] ?? gradeColors["F"];
  const config = sizes[size];

  // Arc spans 270 degrees (from 135° to 405°, with 0° at top)
  // Starting at bottom-left (135°), ending at bottom-right (405°)
  const arcDegrees = 270;
  const circumference = 2 * Math.PI * config.r;
  const arcLength = circumference * (arcDegrees / 360);
  const filledLength = arcLength * (score / 100);
  const gapLength = circumference - arcLength;

  // SVG: rotate so the arc starts at 135° (bottom-left)
  const rotation = 135;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg
          width={config.viewBox}
          height={config.viewBox}
          viewBox={`0 0 ${config.viewBox} ${config.viewBox}`}
          role="img"
          aria-label={`Score: ${score} out of 100, Grade: ${grade}`}
        >
          {/* Track arc (unfilled) */}
          <circle
            cx={config.cx}
            cy={config.cy}
            r={config.r}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={config.strokeWidth}
            strokeDasharray={`${arcLength} ${gapLength}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            transform={`rotate(${rotation} ${config.cx} ${config.cy})`}
          />
          {/* Filled arc */}
          <circle
            cx={config.cx}
            cy={config.cy}
            r={config.r}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={config.strokeWidth}
            strokeDasharray={`${filledLength} ${circumference - filledLength}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            transform={`rotate(${rotation} ${config.cx} ${config.cy})`}
          />
        </svg>

        {/* Centered score text */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ paddingBottom: `${config.viewBox * 0.08}px` }}
        >
          <span className={`${config.scoreSize} font-bold text-slate-900 leading-none`}>{Math.round(score)}</span>
          <span className="text-xs text-slate-500 mt-1">/ 100</span>
        </div>
      </div>

      {/* Grade badge */}
      <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 ${colors.bg}`}>
        <span className={`text-xs font-medium text-slate-600`}>Grade</span>
        <span className={`font-bold ${colors.text} ${config.gradeSize}`}>{grade}</span>
      </div>
    </div>
  );
}
