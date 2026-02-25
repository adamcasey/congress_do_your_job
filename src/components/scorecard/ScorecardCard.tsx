import { CalculatedScorecard } from '@/types/scorecard'
import { ScorecardGauge } from './ScorecardGauge'
import { ScorecardCategoryBreakdown } from './ScorecardCategoryBreakdown'

interface ScorecardCardProps {
  scorecard: CalculatedScorecard
  memberName?: string
  periodLabel?: string
  dataSourceNote?: string
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function ScorecardCard({
  scorecard,
  memberName,
  periodLabel,
  dataSourceNote,
}: ScorecardCardProps) {
  const period = periodLabel
    ?? `${formatDate(scorecard.periodStart)} – ${formatDate(scorecard.periodEnd)}`

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-100">
        <div className="flex items-start justify-between gap-4">
          <div>
            {memberName && (
              <h2 className="text-xl font-bold text-slate-900">{memberName}</h2>
            )}
            <p className="text-sm text-slate-500 mt-0.5">
              Productivity Scorecard &middot; {period}
            </p>
          </div>
          <span className="text-xs text-slate-400 border border-slate-200 rounded-full px-2 py-0.5">
            v{scorecard.methodologyVersion}
          </span>
        </div>
      </div>

      {/* Score gauge */}
      <div className="flex justify-center py-8 bg-slate-50/50">
        <ScorecardGauge
          score={scorecard.totalScore}
          grade={scorecard.grade}
          size="lg"
        />
      </div>

      {/* Category breakdown */}
      <div className="px-6 pb-6">
        <ScorecardCategoryBreakdown categoryScores={scorecard.categoryScores} />
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            {dataSourceNote ?? 'Data sourced from Congress.gov official records.'}
            {' '}
            <a href="/scorecard/methodology" className="text-slate-700 underline underline-offset-2 hover:text-slate-900">
              View methodology
            </a>
          </p>
          <p className="text-xs text-slate-400 flex-shrink-0">
            Updated {formatDate(scorecard.calculatedAt)}
          </p>
        </div>
      </div>
    </div>
  )
}
