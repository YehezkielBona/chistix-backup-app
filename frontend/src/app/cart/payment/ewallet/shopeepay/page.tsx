"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DUMMY_EVENTS } from "@/data/events";

function ShopeePayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const eventIdParam = searchParams.get("eventId");
  const amountParam = searchParams.get("amount");
  const qtyParam = searchParams.get("qty");
  const variantParam = searchParams.get("variant");

  const selectedEvent =
    DUMMY_EVENTS.find((e) => e.id.toString() === eventIdParam) || DUMMY_EVENTS[0];

  const totalAmount = amountParam ? parseInt(amountParam, 10) : selectedEvent.price;
  const ticketQty = qtyParam ? parseInt(qtyParam, 10) : 1;
  const ticketVariant = variantParam || "Presale";

  const [transactionId, setTransactionId] = useState("");
  const [timeLeft, setTimeLeft] = useState(10 * 60);
  const [copied, setCopied] = useState(false);
  const [shopeeNumber, setShopeeNumber] = useState("");

  useEffect(() => {
    const randomString = Math.random().toString(36).substring(2, 10).toUpperCase();
    setTransactionId(randomString);

    const phoneDigits = Math.floor(10000000 + Math.random() * 90000000);
    setShopeeNumber(`893 0812${phoneDigits}`);

    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatRupiah = (num: number) => "Rp " + num.toLocaleString("id-ID");

  const handleCopy = () => {
    navigator.clipboard.writeText(shopeeNumber.replace(/\s+/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAlreadyPaid = () => {
    router.push(
      `/cart/payment/success?eventId=${selectedEvent.id}&amount=${totalAmount}&qty=${ticketQty}&variant=${encodeURIComponent(
        ticketVariant
      )}`
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-slate-800">Pay with ShopeePay</h1>
            <p className="text-xs text-slate-400">
              Transaction ID: <span className="font-semibold text-slate-600">{transactionId || "..."}</span>
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-center">
            <div className="text-[10px] font-semibold text-amber-700">Valid for</div>
            <div className="text-base font-extrabold text-amber-600 leading-tight">
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        {/* Order Summary Card */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Total to Pay</div>
            <div className="text-lg font-bold text-amber-600 mt-0.5">
              {formatRupiah(totalAmount)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-slate-800">{selectedEvent.title}</div>
            <div className="text-[11px] text-slate-400">
              {ticketQty}x {ticketVariant}
            </div>
          </div>
        </div>

        {/* Virtual Account Container */}
        <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 space-y-1.5">
          <div className="text-[11px] text-slate-400">Virtual Account Number (ShopeePay)</div>
          <div className="flex items-center justify-between">
            <span className="text-base font-bold tracking-wider text-slate-900 font-mono">
              {shopeeNumber || "Memuat..."}
            </span>
            <button
              onClick={handleCopy}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
            >
              {copied ? "Tersalin ✓" : "Salin"}
            </button>
          </div>
          <p className="text-[10px] text-emerald-600 font-medium pt-1">
            Verifikasi otomatis kurang dari 10 menit
          </p>
        </div>

        {/* Tata Cara Pembayaran */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-2">
          <div className="font-bold text-slate-800">Cara Pembayaran ShopeePay</div>
          <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-500">
            <li>Buka aplikasi <span className="font-semibold text-slate-700">Shopee</span> di HP kamu.</li>
            <li>Pilih menu <span className="font-semibold text-slate-700">ShopeePay</span> lalu pilih <span className="font-semibold text-slate-700">Transfer Virtual Account</span>.</li>
            <li>Masukkan nomor VA: <span className="font-mono font-bold text-slate-800">{shopeeNumber}</span>.</li>
            <li>Pastikan total nominal sebesar <span className="font-semibold text-amber-600">{formatRupiah(totalAmount)}</span> sudah sesuai.</li>
            <li>Masukkan PIN ShopeePay kamu dan selesaikan transaksi.</li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={handleAlreadyPaid}
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl transition cursor-pointer shadow-xs"
          >
            Saya Sudah Bayar
          </button>

          <button
            onClick={() => router.push("/cart")}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}

export default function ShopeePayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs text-slate-400">Loading...</div>}>
      <ShopeePayContent />
    </Suspense>
  );
}