export function SectionHeader({
  title,
  eyebrow,
  description,
}: {
  title: string
  eyebrow?: string
  description?: string
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{eyebrow}</p>
        )}
        <h2 className="text-2xl font-semibold leading-tight text-slate-900">{title}</h2>
        {description && <p className="mt-2 max-w-2xl text-sm text-slate-600">{description}</p>}
      </div>
      <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
        TODO: connect to live data
      </span>
    </div>
  )
}
