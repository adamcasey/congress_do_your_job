export function DistrictSnapshotCard() {
  return (
    <div className="h-[200px] rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">District Snapshot</p>
          <h4 className="mt-1 text-lg font-semibold text-slate-900">Missouri - 02</h4>
        </div>
        <span className="rounded-full bg-emerald-100/80 px-3 py-1 text-xs font-semibold text-emerald-700">
          Example
        </span>
      </div>
      <div className="mt-4 grid gap-3 text-sm text-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Population</span>
          <span className="font-semibold text-slate-900">766k</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Median age</span>
          <span className="font-semibold text-slate-900">38</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Next election</span>
          <span className="font-semibold text-slate-900">Nov 2026</span>
        </div>
      </div>
      <p className="mt-8 text-xs text-slate-500">
        District stats appear after lookup.
      </p>
    </div>
  )
}
