import React from "react";
import { VoucherStatus } from "@/types/voucher";

interface VoucherStatusBadgeProps {
  status: VoucherStatus;
}

export default function VoucherStatusBadge({ status }: VoucherStatusBadgeProps) {
  const getBadgeStyle = () => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-500 text-white";
      case "SCHEDULED":
        return "bg-amber-500 text-white";
      case "EXPIRED":
        return "bg-gray-500 text-white";
      default:
        return "bg-neutral-200 text-neutral-700";
    }
  };

  const getLabel = () => {
    switch (status) {
      case "ACTIVE":
        return "Active";
      case "SCHEDULED":
        return "Scheduled";
      case "EXPIRED":
        return "Expired";
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-block ${getBadgeStyle()}`}>
        {getLabel()}
    </span>
  );
}
