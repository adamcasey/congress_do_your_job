import { Bill } from "@/types/congress";
import { formatDate } from "@/utils/dates";

interface BillTimelineProps {
  bill: Bill;
}

export function BillTimeline({ bill }: BillTimelineProps) {
  const stages = [
    { label: "Introduced", key: "introduced", color: "emerald" },
    { label: "Committee", key: "committee", color: "amber" },
    { label: "Floor Vote", key: "floor", color: "lime" },
    { label: "Signed", key: "signed", color: "emerald" },
  ];

  const getCurrentStage = (bill: Bill): number => {
    const action = bill.latestAction?.text.toLowerCase() || "";

    if (action.includes("became public law") || action.includes("signed by president")) {
      return 3;
    }

    if (action.includes("passed") || action.includes("agreed to") || action.includes("calendar")) {
      return 2;
    }

    if (action.includes("committee") || action.includes("referred")) {
      return 1;
    }

    return 0;
  };

  const currentStage = getCurrentStage(bill);

  const getStageColor = (index: number, colorName: string) => {
    if (index <= currentStage) {
      const colors = {
        emerald: "bg-emerald-500",
        amber: "bg-amber-500",
        lime: "bg-lime-500",
      };
      return colors[colorName as keyof typeof colors] || "bg-emerald-500";
    }
    return "bg-slate-200";
  };

  return (
    <div className="w-full border-t border-slate-200 bg-gradient-to-r from-amber-50/30 via-white to-emerald-50/30 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-600">Legislative Progress</p>
      <div className="flex items-center justify-between">
        {stages.map((stage, index) => (
          <div key={stage.key} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div className={`h-3 w-3 rounded-full transition-colors ${getStageColor(index, stage.color)}`} />
              <p className={`mt-1 text-xs font-medium ${index <= currentStage ? "text-slate-900" : "text-slate-400"}`}>
                {stage.label}
              </p>
            </div>
            {index < stages.length - 1 && (
              <div className="mx-2 h-0.5 flex-1 bg-slate-200">
                <div
                  className={`h-full transition-all ${index < currentStage ? getStageColor(index, stage.color) : "w-0"}`}
                  style={{ width: index < currentStage ? "100%" : "0%" }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      {bill.latestAction && (
        <p className="mt-3 text-xs text-slate-600">
          <span className="font-medium">Latest:</span> {bill.latestAction.text} ({formatDate(bill.latestAction.actionDate)})
        </p>
      )}
    </div>
  );
}
