"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface EventOrderSidebarProps {
  event?: {
    id: number | string;
    title?: string;
    price?: number;
    stock?: number;
  };
}

export default function EventOrderSidebar({ event }: EventOrderSidebarProps) {
  const router = useRouter();
  const [ticketAmount, setTicketAmount] = useState<number>(1);
  const [selectedVariant, setSelectedVariant] = useState<string>("Presale");

  // Mengambil harga dasar dari database/props event, fallback ke 88.000 jika tidak ada
  const basePrice = event?.price || 88000;

  // Mengambil stok tiket (default simulasi sisa 5 tiket)
  const stockLeft = event?.stock ?? 5;

  // Logika harga: VIP 2x lipat dari harga dasar, Presale & Regular menggunakan harga dasar
  const getUnitPrice = (variant: string) => {
    if (variant === "VIP") {
      return basePrice * 2;
    }
    return basePrice;
  };

  const unitPrice = getUnitPrice(selectedVariant);

  const formatRupiah = (num: number) => "Rp " + num.toLocaleString("id-ID");

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
    <div className="space-y-4 max-w-[280px] w-full">
      {/* 1. Kartu Utama Order Sidebar */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-2xl space-y-4 shadow-sm">
        {/* Select Variant */}
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

        {/* Ticket Amount Counter */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700">
              Ticket Amount
            </label>

            {/* Info sisa tiket warna merah jika <= 5 */}
            {stockLeft <= 5 && stockLeft > 0 && (
              <span className="text-[11px] font-semibold text-red-500">
                {stockLeft} tickets left!
              </span>
            )}
          </div>

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

        {/* Price Information */}
        <div className="pt-2 border-t border-slate-100 text-xs">
          <div className="flex justify-between items-center text-slate-500">
            <span>Price</span>
            <span className="font-semibold text-slate-700">{formatRupiah(unitPrice)}</span>
          </div>
        </div>

        {/* Tombol Order Ticket */}
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

      {/* 2. Kotak Logo Media Sosial (Twitter/X, Instagram, Facebook) */}
      <div className="bg-white border border-slate-200/80 p-3.5 rounded-2xl flex items-center justify-around shadow-sm text-[#FF8A00]">
        {/* X (Twitter) */}
        <a href="#" aria-label="X" className="hover:opacity-80 transition-opacity">
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </a>
        {/* Instagram */}
        <a href="#" aria-label="Instagram" className="hover:opacity-80 transition-opacity">
          <svg className="w-5 h-5 fill-none stroke-current stroke-[2]" viewBox="0 0 24 24">
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
          </svg>
        </a>
        {/* Facebook */}
        <a href="#" aria-label="Facebook" className="hover:opacity-80 transition-opacity">
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
          </svg>
        </a>
      </div>
    </div>
  );
}