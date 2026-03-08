export type Status = "advanced" | "stalled" | "overdue" | "scheduled" | "passed" | "update";

export const statusStyles: Record<Status, { label: string; classes: string }> = {
  advanced: { label: "Moved", classes: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  passed: { label: "Passed", classes: "bg-emerald-200 text-emerald-900 border-emerald-300" },
  stalled: { label: "Stalled", classes: "bg-amber-100 text-amber-800 border-amber-200" },
  overdue: { label: "Overdue", classes: "bg-orange-100 text-orange-900 border-orange-200" },
  scheduled: { label: "Scheduled", classes: "bg-lime-100 text-lime-800 border-lime-200" },
  update: { label: "Update", classes: "bg-slate-100 text-slate-800 border-slate-200" },
};

export function StatusBadge({ status }: { status: Status }) {
  const style = statusStyles[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${style.classes}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {style.label}
    </span>
  );
}
