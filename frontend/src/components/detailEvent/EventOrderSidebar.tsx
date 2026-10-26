"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { TICKET_LABEL, type ApiEvent, type ApiTicketTier } from "@/types/api";

interface EventOrderSidebarProps {
  event?: ApiEvent | {
    id: number | string;
    title?: string;
    salesPhase?: string;
    ticketTiers?: ApiTicketTier[];
  };
}

const MAX_PER_ORDER = 10;

export default function EventOrderSidebar({ event }: EventOrderSidebarProps) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const isOrganizer = (session?.user as any)?.role === "ORGANIZER";

  const tiers: ApiTicketTier[] = useMemo(() => {
    if (Array.isArray(event?.ticketTiers) && event.ticketTiers.length > 0) {
      return event.ticketTiers;
    }
    return [];
  }, [event?.ticketTiers]);

  // Cari varian pertama yang sedang aktif
  const defaultTier = useMemo(() => {
    return tiers.find((t) => t.isAvailable) || tiers[0] || null;
  }, [tiers]);

  const [selectedTicketType, setSelectedTicketType] = useState<string>("");

  useEffect(() => {
    if (defaultTier) {
      setSelectedTicketType(defaultTier.ticketType);
    }
  }, [defaultTier]);

  const selectedTier = tiers.find((t) => t.ticketType === selectedTicketType) || defaultTier;

  const isSalesClosed = event?.salesPhase === "SALES_CLOSED";
  const isCurrentTierDisabled = !selectedTier || selectedTier.isAvailable === false || isSalesClosed;

  const maxQty = selectedTier ? Math.min(MAX_PER_ORDER, Math.max(1, selectedTier.remaining)) : 1;
  const [ticketAmount, setTicketAmount] = useState<number>(1);

  useEffect(() => {
    if (ticketAmount > maxQty && maxQty > 0) {
      setTicketAmount(maxQty);
    }
  }, [maxQty, ticketAmount]);

  const tierLabel = (t: ApiTicketTier) => {
    const price = t.finalPrice > 0 ? `Rp ${t.finalPrice.toLocaleString("id-ID")}` : "Gratis";
    const label = TICKET_LABEL[t.ticketType] || t.name;
    return `${label} - ${price}`;
  };

  const tierStatus = (t: ApiTicketTier) => {
    if (t.remaining <= 0) return "Habis";
    return t.statusLabel || "Tidak Tersedia";
  };

  const handleOrder = () => {
    if (isCurrentTierDisabled || !event?.id || isOrganizer) return;

    if (!session?.user) {
      router.push(`/auth/login?redirect=/events/${event.id}`);
      return;
    }

    const type = selectedTier?.ticketType || "REGULAR";
    if (typeof window !== "undefined") {
      sessionStorage.setItem("chistix_ticket_qty", ticketAmount.toString());
      sessionStorage.setItem("chistix_ticket_variant", type);
    }
    router.push(`/cart?eventId=${event.id}&ticketType=${type}&qty=${ticketAmount}`);
  };

  const buttonLabel = isOrganizer
    ? "Akun organizer tidak dapat membeli"
    : isSalesClosed
    ? "Penjualan Ditutup"
    : tiers.length === 0
    ? "Tiket Belum Tersedia"
    : !selectedTier?.isAvailable
    ? tierStatus(selectedTier)
    : !session?.user
    ? "Login untuk Order"
    : "Beli Tiket Sekarang";

  return (
    <div className="bg-white border border-slate-200/80 p-5 rounded-2xl space-y-4 shadow-sm w-full">
      {/* 1. Select Variant */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-700">
          Kategori Tiket
        </label>
        <div className="relative">
          <select
            value={selectedTier?.ticketType || ""}
            disabled={isSalesClosed || tiers.length === 0}
            onChange={(e) => setSelectedTicketType(e.target.value)}
            className="w-full appearance-none bg-white border border-slate-300 rounded-full px-4 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-amber-500 cursor-pointer pr-8 leading-tight disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {tiers.length === 0 ? (
              <option value="">Tiket Belum Tersedia</option>
            ) : (
              tiers.map((t) => (
                <option key={t.id || t.ticketType} value={t.ticketType} disabled={!t.isAvailable}>
                  {tierLabel(t)} {!t.isAvailable ? `(${tierStatus(t)})` : ""}
                </option>
              ))
            )}
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

        {/* Info status tier terpilih jika sedang tidak tersedia atau stok menipis */}
        {selectedTier?.statusLabel && !selectedTier.isAvailable && !isSalesClosed && (
          <p className="text-[11px] text-amber-700 font-medium pt-0.5">
            Tiket {TICKET_LABEL[selectedTier.ticketType] || selectedTier.name}: {tierStatus(selectedTier)}
          </p>
        )}
        {selectedTier?.lowStock && selectedTier.isAvailable && (
          <p className="text-[11px] font-semibold text-red-500 pt-0.5">
            Tinggal {selectedTier.remaining} tiket {TICKET_LABEL[selectedTier.ticketType]} lagi!
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
            disabled={isCurrentTierDisabled || ticketAmount <= 1}
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
            disabled={isCurrentTierDisabled || ticketAmount >= maxQty}
            onClick={() => setTicketAmount((prev) => Math.min(maxQty, prev + 1))}
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
          disabled={isCurrentTierDisabled || isOrganizer}
          className="w-full py-3 bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-xs rounded-full transition-colors cursor-pointer shadow-xs text-center disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}
