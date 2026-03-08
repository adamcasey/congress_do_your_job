export type DataStatus = "todo" | "partial" | "live";

const dataStatusBadge: Record<DataStatus, { label: string; classes: string }> = {
  todo: { label: "Static data", classes: "bg-white/70 text-slate-500 ring-1 ring-slate-200" },
  partial: { label: "Partial live data", classes: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
  live: { label: "Live data", classes: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
};

interface SectionHeaderProps {
  title: string;
  eyebrow?: string;
  description?: string;
  dataStatus?: DataStatus;
}

export function SectionHeader({ title, eyebrow, description, dataStatus = "todo" }: SectionHeaderProps) {
  const badge = dataStatusBadge[dataStatus];
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        {eyebrow && <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{eyebrow}</p>}
        <h2 className="text-2xl font-semibold leading-tight text-slate-900">{title}</h2>
        {description && <p className="mt-2 max-w-2xl text-sm text-slate-600">{description}</p>}
      </div>
      <span className={`rounded-full px-3 py-1 text-xs font-medium ${badge.classes}`}>{badge.label}</span>
    </div>
  );
}
