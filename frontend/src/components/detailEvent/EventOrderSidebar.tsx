"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

interface TicketTierItem {
  id?: string;
  name: string;
  price?: number;
  finalPrice?: number;
  isAvailable?: boolean;
  statusLabel?: string;
}

interface EventOrderSidebarProps {
  event?: {
    id: number | string;
    title?: string;
    price?: number;
    salesPhase?: string;
    ticketTiers?: TicketTierItem[];
    isPresale?: boolean;
    scheduledPublishEnd?: string;
    startDate?: string;
  };
}

export default function EventOrderSidebar({ event }: EventOrderSidebarProps) {
  const router = useRouter();

  // Susun daftar tier dari props API atau fallback standar
  const tiers: TicketTierItem[] = useMemo(() => {
    if (Array.isArray(event?.ticketTiers) && event.ticketTiers.length > 0) {
      return event.ticketTiers;
    }
    // Fallback default jika data statis
    return [
      { name: "Presale", isAvailable: true, statusLabel: "Tersedia" },
      { name: "VIP", isAvailable: true, statusLabel: "Tersedia" },
      { name: "Regular", isAvailable: true, statusLabel: "Tersedia" },
    ];
  }, [event?.ticketTiers]);

  // Cari varian pertama yang sedang aktif (available)
  const defaultVariant = useMemo(() => {
    const firstAvailable = tiers.find((t) => t.isAvailable !== false);
    return firstAvailable ? firstAvailable.name : tiers[0]?.name || "Regular";
  }, [tiers]);

  const [ticketAmount, setTicketAmount] = useState<number>(1);
  const [selectedVariant, setSelectedVariant] = useState<string>(defaultVariant);

  const selectedTier = tiers.find((t) => t.name === selectedVariant) || tiers[0];
  const isSalesClosed = event?.salesPhase === "SALES_CLOSED";
  const isCurrentTierDisabled = selectedTier?.isAvailable === false || isSalesClosed;

  const handleOrder = () => {
    if (isCurrentTierDisabled) return;

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
          Kategori Tiket
        </label>
        <div className="relative">
          <select
            value={selectedVariant}
            disabled={isSalesClosed}
            onChange={(e) => setSelectedVariant(e.target.value)}
            className="w-full appearance-none bg-white border border-slate-300 rounded-full px-4 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-amber-500 cursor-pointer pr-8 leading-tight disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {tiers.map((t) => (
              <option
                key={t.name}
                value={t.name}
                disabled={t.isAvailable === false}
              >
                {t.name} {t.statusLabel ? `(${t.statusLabel})` : ""}
              </option>
            ))}
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

        {/* Info status tier terpilih jika sedang tidak tersedia */}
        {selectedTier?.statusLabel && selectedTier.isAvailable === false && !isSalesClosed && (
          <p className="text-[11px] text-amber-700 font-medium pt-0.5">
            Tiket {selectedTier.name}: {selectedTier.statusLabel}
          </p>
        )}
      </div>

      {/* 2. Ticket Amount Counter */}
      <div className="space-y-1.5 pt-1">
        <label className="block text-xs font-bold text-slate-700">
          Jumlah Tiket
        </label>
        <div className="flex items-center gap-3 border border-slate-200 rounded-full px-3 py-1.5 w-fit">
          <button
            type="button"
            disabled={isCurrentTierDisabled}
            onClick={() => setTicketAmount((prev) => Math.max(1, prev - 1))}
            className="text-slate-400 hover:text-slate-700 font-bold text-xs cursor-pointer px-1 disabled:opacity-40"
          >
            -
          </button>
          <span className="text-xs font-bold text-slate-800 min-w-[16px] text-center">
            {ticketAmount}
          </span>
          <button
            type="button"
            disabled={isCurrentTierDisabled}
            onClick={() => setTicketAmount((prev) => prev + 1)}
            className="text-slate-400 hover:text-slate-700 font-bold text-xs cursor-pointer px-1 disabled:opacity-40"
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
          disabled={isCurrentTierDisabled}
          className="w-full py-3 bg-[#FF8A00] hover:bg-[#E07B00] text-white font-bold text-xs rounded-full transition-colors cursor-pointer shadow-xs text-center disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSalesClosed
            ? "Penjualan Ditutup (H-1)"
            : isCurrentTierDisabled
            ? `${selectedTier?.statusLabel || "Tiket Belum Tersedia"}`
            : "Beli Tiket Sekarang"}
        </button>
      </div>
    </div>
  );
}
