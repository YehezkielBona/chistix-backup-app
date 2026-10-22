"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface EventOrderSidebarProps {
  event?: {
    id: number | string;
    title?: string;
    price?: number;
  };
}

export default function EventOrderSidebar({ event }: EventOrderSidebarProps) {
  const router = useRouter();
  const [ticketAmount, setTicketAmount] = useState<number>(1);
  const [selectedVariant, setSelectedVariant] = useState<string>("Presale");

  const handleOrder = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("chistix_ticket_qty", ticketAmount.toString());
      sessionStorage.setItem("chistix_ticket_variant", selectedVariant);
    }

    const eventId = event?.id || 1;
    router.push(
      `/cart?eventId=${eventId}&variant=${encodeURIComponent(selectedVariant)}&qty=${ticketAmount}`
    );
  };

  return (
    <div className="bg-white border border-slate-200/80 p-5 rounded-2xl space-y-4 shadow-sm w-full">
      {/* 1. Select Variant */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-700">
          Variant
        </label>
        <div className="relative">
          <select
            value={selectedVariant}
            onChange={(e) => setSelectedVariant(e.target.value)}
            className="w-full appearance-none bg-white border border-slate-300 rounded-full px-4 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-amber-500 cursor-pointer pr-8 leading-tight"
          >
            <option value="Presale">Presale</option>
            <option value="VIP">VIP</option>
            <option value="Regular">Regular</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>
      </div>

      {/* 2. Ticket Amount Counter */}
      <div className="space-y-1.5 pt-1">
        <label className="block text-xs font-bold text-slate-700">
          Ticket Amount
        </label>
        <div className="flex items-center gap-3 border border-slate-200 rounded-full px-3 py-1.5 w-fit">
          <button
            type="button"
            onClick={() => setTicketAmount((prev) => Math.max(1, prev - 1))}
            className="text-slate-400 hover:text-slate-700 font-bold text-xs cursor-pointer px-1"
          >
            -
          </button>
          <span className="text-xs font-bold text-slate-800 min-w-[16px] text-center">
            {ticketAmount}
          </span>
          <button
            type="button"
            onClick={() => setTicketAmount((prev) => prev + 1)}
            className="text-slate-400 hover:text-slate-700 font-bold text-xs cursor-pointer px-1"
          >
            +
          </button>
        </div>
      </div>

      {/* 3. Tombol Order Ticket */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleOrder}
          className="w-full py-3 bg-[#FF8A00] hover:bg-[#E07B00] text-white font-bold text-xs rounded-full transition-colors cursor-pointer shadow-xs text-center"
        >
          Order Ticket
        </button>
      </div>
    </div>
  );
}