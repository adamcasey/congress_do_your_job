import { statusStyles } from './styleMaps'
import { Status } from './types'

export function StatusBadge({ status }: { status: Status }) {
  const style = statusStyles[status]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${style.classes}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {style.label}
    </span>
  )
}
