"use client";

import { Bill } from "@/types/congress";
import { BillTimeline } from "./BillTimeline";
import { Modal } from "@/components/ui/Modal";
import { useBillDetails, useBillSummary } from "@/hooks";
import { formatDate, stripHtmlTags, extractSentences } from "@/utils/dates";
import type { BillDetailModalProps } from "./types";

export function BillDetailModal({ bill, onClose }: BillDetailModalProps) {
  const { data: billDetails, loading: loadingDetails } = useBillDetails({
    billType: bill.type,
    billNumber: bill.number,
    congress: bill.congress,
    enabled: true,
  });
  const { data: summaryData, loading: summaryLoading } = useBillSummary({
    billType: bill.type,
    billNumber: bill.number,
    congress: bill.congress,
    enabled: true,
  });

  return (
    <Modal isOpen onClose={onClose} title={`${bill.type} ${bill.number}`}>
      {loadingDetails ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-4 w-3/4 rounded bg-slate-200" />
          <div className="h-4 w-full rounded bg-slate-200" />
          <div className="h-4 w-5/6 rounded bg-slate-200" />
        </div>
      ) : billDetails ? (
        <div className="flex flex-col">
          <div className="space-y-4 p-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{billDetails.title}</h3>
              <p className="mt-1 text-sm text-slate-600">
                Introduced: {formatDate(billDetails.introducedDate)}
                {billDetails.sponsors && billDetails.sponsors.length > 0 && <> by {billDetails.sponsors[0].fullName}</>}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h4 className="text-sm font-semibold text-slate-900">What This Bill Does</h4>
              {summaryLoading ? (
                <div className="mt-2 animate-pulse space-y-2">
                  <div className="h-4 w-full rounded bg-slate-200" />
                  <div className="h-4 w-5/6 rounded bg-slate-200" />
                </div>
              ) : summaryData ? (
                <p className="mt-2 text-sm leading-relaxed text-slate-700">{summaryData.summary}</p>
              ) : billDetails.summaries && billDetails.summaries.length > 0 ? (
                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                  {extractSentences(stripHtmlTags(billDetails.summaries[0].text), 2)}
                </p>
              ) : (
                <p className="mt-2 text-sm leading-relaxed text-slate-600">Summary not yet available.</p>
              )}
            </div>
          </div>
          <BillTimeline bill={billDetails} />
        </div>
      ) : (
        <p className="text-sm text-slate-600">Failed to load bill details.</p>
      )}
    </Modal>
  );
}
