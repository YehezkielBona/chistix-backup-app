"use client";

// [LAMA] import React, { useState } from "react";
import React, { useState, useMemo } from "react"; // [BARU] + useMemo
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client"; // [BARU] cek login
import type { ApiEvent, ApiTicketTier } from "@/types/api"; // [BARU]

// [LAMA]
// interface EventOrderSidebarProps {
//   event?: {
//     id: number | string;
//     title?: string;
//     price?: number;
//     stock?: number;
//   };
// }

// [BARU] sidebar menerima data event asli dari backend
interface EventOrderSidebarProps {
  event: ApiEvent;
}

const MAX_PER_ORDER = 10; // [BARU] sama dengan aturan Zod di backend

export default function EventOrderSidebar({ event }: EventOrderSidebarProps) {
  const router = useRouter();
  const { data: session } = authClient.useSession(); // [BARU]
  const [ticketAmount, setTicketAmount] = useState<number>(1);
  // [LAMA] const [selectedVariant, setSelectedVariant] = useState<string>("Presale");

  // [LAMA] harga & stok dihitung/dikarang di frontend
  // // Mengambil harga dasar dari database/props event, fallback ke 88.000 jika tidak ada
  // const basePrice = event?.price || 88000;
  //
  // // Mengambil stok tiket (default simulasi sisa 5 tiket)
  // const stockLeft = event?.stock ?? 5;
  //
  // // Logika harga: VIP 2x lipat dari harga dasar, Presale & Regular menggunakan harga dasar
  // const getUnitPrice = (variant: string) => {
  //   if (variant === "VIP") {
  //     return basePrice * 2;
  //   }
  //   return basePrice;
  // };
  //
  // const unitPrice = getUnitPrice(selectedVariant);

  // [BARU] tier yang benar-benar dijual event ini (kuota > 0), lengkap dengan harga & sisa kursi
  const tiers: ApiTicketTier[] = useMemo(
    () => event.ticketTiers.filter((t) => t.quota > 0),
    [event.ticketTiers],
  );
  const defaultTier = tiers.find((t) => t.isAvailable) ?? tiers[0];
  const [selectedVariant, setSelectedVariant] = useState<string>(defaultTier?.name ?? "Regular");

  const selectedTier = tiers.find((t) => t.name === selectedVariant) ?? defaultTier;
  const unitPrice = selectedTier?.finalPrice ?? 0;
  const normalPrice = selectedTier?.price ?? 0;
  const stockLeft = selectedTier ? Math.max(0, selectedTier.quota - selectedTier.sold) : 0;
  const maxAmount = Math.min(MAX_PER_ORDER, stockLeft);

  const isSalesClosed = event.salesPhase === "SALES_CLOSED";
  const isOrganizer = String((session?.user as { role?: string } | undefined)?.role ?? "").toUpperCase() === "ORGANIZER";
  const canOrder = Boolean(selectedTier?.isAvailable) && !isSalesClosed && stockLeft > 0 && !isOrganizer;

  const formatRupiah = (num: number) => "Rp " + num.toLocaleString("id-ID");

  // [BARU] ganti tier -> jumlah tiket kembali ke 1
  const handleVariantChange = (name: string) => {
    setSelectedVariant(name);
    setTicketAmount(1);
  };

  const handleOrder = () => {
    // [LAMA]
    // if (typeof window !== "undefined") {
    //   sessionStorage.setItem("chistix_ticket_qty", ticketAmount.toString());
    //   sessionStorage.setItem("chistix_ticket_variant", selectedVariant);
    // }
    //
    // const eventId = event?.id || 1;
    // router.push(
    //   `/cart?eventId=${eventId}&variant=${encodeURIComponent(selectedVariant)}&qty=${ticketAmount}`
    // );

    // [BARU]
    if (!canOrder) return;
    if (!session?.user) {
      router.push("/login"); // wajib login sebelum beli
      return;
    }
    const ticketType = selectedVariant.toUpperCase(); // "Regular" -> "REGULAR" (enum backend)
    router.push(`/cart?eventId=${event.id}&ticketType=${ticketType}&qty=${ticketAmount}`);
  };

  // [BARU] teks tombol sesuai kondisi
  const buttonLabel = isOrganizer
    ? "Akun organizer tidak dapat membeli"
    : isSalesClosed
      ? "Penjualan Ditutup (H-1)"
      : !selectedTier?.isAvailable
        ? selectedTier?.statusLabel || "Tiket Belum Tersedia"
        : "Order Ticket";

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
              // [LAMA] onChange={(e) => setSelectedVariant(e.target.value)}
              onChange={(e) => handleVariantChange(e.target.value)}
              disabled={isSalesClosed || tiers.length === 0}
              className="w-full appearance-none bg-white border border-slate-300 rounded-full px-4 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-amber-500 cursor-pointer pr-8 leading-tight disabled:opacity-50"
            >
              {/* [LAMA]
              <option value="Presale">Presale</option>
              <option value="VIP">VIP</option>
              <option value="Regular">Regular</option>
              */}
              {/* [BARU] daftar tier dari backend, tier yang belum/tidak dijual dinonaktifkan */}
              {tiers.map((t) => (
                <option key={t.id} value={t.name} disabled={!t.isAvailable}>
                  {t.name}
                  {!t.isAvailable ? ` (${t.statusLabel})` : ""}
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
            {/* [BARU] */}
            {stockLeft === 0 && (
              <span className="text-[11px] font-semibold text-red-500">Sold out</span>
            )}
          </div>

          <div className="flex items-center gap-3 border border-slate-200 rounded-full px-3 py-1.5 w-fit">
            <button
              type="button"
              onClick={() => setTicketAmount((prev) => Math.max(1, prev - 1))}
              disabled={!canOrder} // [BARU]
              className="text-slate-400 hover:text-slate-700 font-bold text-xs cursor-pointer px-1 disabled:opacity-40"
            >
              -
            </button>
            <span className="text-xs font-bold text-slate-800 min-w-[16px] text-center">
              {ticketAmount}
            </span>
            <button
              type="button"
              // [LAMA] onClick={() => setTicketAmount((prev) => prev + 1)}
              onClick={() => setTicketAmount((prev) => Math.min(maxAmount, prev + 1))} // [BARU] tidak melebihi sisa kursi / maks 10
              disabled={!canOrder || ticketAmount >= maxAmount}
              className="text-slate-400 hover:text-slate-700 font-bold text-xs cursor-pointer px-1 disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>

        {/* Price Information */}
        <div className="pt-2 border-t border-slate-100 text-xs space-y-1">
          <div className="flex justify-between items-center text-slate-500">
            <span>Price</span>
            <span className="font-semibold text-slate-700">
              {/* [BARU] harga normal dicoret kalau organizer memberi harga diskon */}
              {normalPrice > unitPrice && (
                <span className="mr-1.5 text-[11px] text-slate-400 line-through">{formatRupiah(normalPrice)}</span>
              )}
              {unitPrice === 0 ? "Gratis" : formatRupiah(unitPrice)}
            </span>
          </div>
          {/* [BARU] subtotal sementara, harga final tetap dihitung backend di cart */}
          <div className="flex justify-between items-center text-slate-500">
            <span>Subtotal</span>
            <span className="font-bold text-slate-800">{formatRupiah(unitPrice * ticketAmount)}</span>
          </div>
        </div>

        {/* Tombol Order Ticket */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleOrder}
            disabled={!canOrder} // [BARU]
            className="w-full py-3 bg-[#FF8A00] hover:bg-[#E07B00] text-white font-bold text-xs rounded-full transition-colors cursor-pointer shadow-xs text-center disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {/* [LAMA] Order Ticket */}
            {buttonLabel}
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