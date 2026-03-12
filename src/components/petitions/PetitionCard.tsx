import Link from "next/link";
import type { PetitionSummary } from "@/types/petition";

const CATEGORY_COLORS: Record<string, string> = {
  budget: "bg-blue-100 text-blue-700",
  infrastructure: "bg-green-100 text-green-700",
  healthcare: "bg-red-100 text-red-700",
  education: "bg-purple-100 text-purple-700",
  environment: "bg-emerald-100 text-emerald-700",
  default: "bg-slate-100 text-slate-600",
};

interface PetitionCardProps {
  petition: PetitionSummary;
}

export function PetitionCard({ petition }: PetitionCardProps) {
  const categoryColor = CATEGORY_COLORS[petition.category.toLowerCase()] ?? CATEGORY_COLORS.default;
  const isActive = petition.status === "active";

  return (
    <Link
      href={`/petitions/${petition.slug}`}
      className="group block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-[2px] hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${categoryColor}`}>
          {petition.category}
        </span>
        {!isActive && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 capitalize">
            {petition.status}
          </span>
        )}
      </div>

      <h3 className="mt-3 text-base font-semibold text-slate-900 group-hover:text-amber-700 transition-colors">
        {petition.title}
      </h3>
      <p className="mt-1 text-sm text-slate-500 line-clamp-2">{petition.description}</p>

      <div className="mt-4">
        {petition.goal ? (
          <>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
              <span>{petition.signatureCount.toLocaleString()} signatures</span>
              <span>Goal: {petition.goal.toLocaleString()}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-400 transition-all"
                style={{ width: `${petition.progressPercentage}%` }}
              />
            </div>
          </>
        ) : (
          <p className="text-sm font-medium text-slate-700">
            {petition.signatureCount.toLocaleString()}{" "}
            <span className="font-normal text-slate-500">signatures</span>
          </p>
        )}
      </div>
    </Link>
  );
}
