import React from "react";
import { TransactionStatus } from "@/types/transaction";

interface StatusBadgeProps {
  status: TransactionStatus;
  countdown?: string;
}

export default function StatusBadge({ status, countdown }: StatusBadgeProps) {
  const getBadgeStyle = () => {
    switch (status) {
      case "WAITING_PAYMENT":
        return "bg-amber-100 text-amber-800 font-semibold";
      case "WAITING_CONFIRM":
        return "bg-[#FDE68A] text-[#92400E] font-semibold";
      case "DONE":
        return "bg-[#A7F3D0] text-[#065F46] font-semibold";
      case "REJECTED":
        return "bg-transparent border border-rose-300 text-rose-500 font-semibold";
      case "CANCELED":
        return "bg-[#EF4444] text-white font-semibold";
      case "EXPIRED":
        return "bg-neutral-200 text-neutral-600 font-semibold";
      default:
        return "bg-neutral-100 text-neutral-700";
    }
  };
  const getLabel = () => {
    switch (status) {
      case "WAITING_PAYMENT":
        return "Wating Payment";
      case "WAITING_CONFIRM":
        return "Waiting Confirm";
      case "DONE":
        return "Done";
      case "REJECTED":
        return "Rejected";
      case "CANCELED":
        return "Canceled";
      case "EXPIRED":
        return "Expired";
    }
  };

  return (
    <div className="flex flex-col items-center sm:items-start">
      <span className={`px-3 py-1 rounded-full text-xs text-center inline-block min-w-95px ${getBadgeStyle()}`}>{getLabel()}</span>

      {countdown && <span className="text-[11px] text-[#DC2626] mt-1 font-medium whitespace-nowrap">{countdown}</span>}
    </div>
  );
}
