import type { Bill } from "@/types/congress";

export interface BillDetailModalProps {
  bill: Bill;
  onClose: () => void;
}

export interface BillTimelineProps {
  bill: Bill;
}

export interface Stage {
  label: string;
  key: string;
  activeColor: string;
  ringColor: string;
  barColor: string;
}

export interface RecentBillsProps {
  limit?: number;
  days?: number;
}
