import type { CalculatedScorecard, CategoryScore, ScorecardGrade } from "@/types/scorecard";

export interface ScorecardGaugeProps {
  score: number;
  grade: ScorecardGrade;
  size?: "sm" | "md" | "lg";
}

export interface ScorecardCardProps {
  scorecard: CalculatedScorecard;
  memberName?: string;
  periodLabel?: string;
  dataSourceNote?: string;
}

export interface ScorecardCategoryBreakdownProps {
  categoryScores: CategoryScore[];
}

export interface CategoryRowProps {
  cs: CategoryScore;
}

export interface MemberSuggestion {
  bioguideId: string;
  name: string;
  state: string;
  chamber: string;
  district?: number;
  imageUrl?: string;
}

export interface ScorecardData {
  scorecard: CalculatedScorecard;
  dataSources: Record<string, string>;
}

export type Period = "session" | "yearly" | "quarterly";
