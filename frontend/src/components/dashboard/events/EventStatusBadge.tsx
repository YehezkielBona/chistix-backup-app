import React from "react";
import { EventStatus } from "@/types/event";

interface EventStatusBadgeProps {
  status: EventStatus;
}

export default function EventStatusBadge({ status }: EventStatusBadgeProps) {

  const normalizedStatus = (status || "").replace("_", " ").toUpperCase()

  const getStyle = () => {
    switch (normalizedStatus) {
      case "ON STAGE":
        return "bg-rose-100 text-rose-700 border border-rose-300 font-bold";
      case "UPCOMING":
        return "bg-emerald-100 text-emerald-700 border border-emerald-200";
      case "DRAFT":
        return "bg-neutral-100 text-neutral-500 border border-neutral-200";
      case "ENDED":
        return "bg-amber-100 text-amber-700 border border-amber-200";
      default:
        return "bg-neutral-100 text-neutral-700";
    }
  };

  const isLive = normalizedStatus === "ON STAGE"

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${getStyle()}`}
    >
      {isLive && (
        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping inline-block" />
      )}
      {isLive ? "Live: On Stage" : normalizedStatus.charAt(0) + normalizedStatus.slice(1).toLowerCase()}
    </span>
  );
}
