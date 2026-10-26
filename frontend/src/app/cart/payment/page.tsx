"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { DUMMY_EVENTS } from "@/data/events";

function QrPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const eventIdParam = searchParams.get("eventId");
  const amountParam = searchParams.get("amount");
  const qtyParam = searchParams.get("qty");
  const variantParam = searchParams.get("variant");
  const transactionIdParam = searchParams.get("transactionId");

  const selectedEvent = DUMMY_EVENTS.find((e) => e.id.toString() === eventIdParam) || DUMMY_EVENTS[0];

  const totalAmount = amountParam ? parseInt(amountParam, 10) : selectedEvent.price;
  const ticketQty = qtyParam ? parseInt(qtyParam, 10) : 1;
  const ticketVariant = variantParam || "Presale";

  const [transactionId, setTransactionId] = useState("");
  const [timeLeft, setTimeLeft] = useState(10 * 60);

  const isExpired = timeLeft <= 0;
    useEffect(() => {
    // Menggunakan ID resmi dari database, atau fallback jika diakses langsung
    const txId = transactionIdParam || Math.random().toString(36).substring(2, 10).toUpperCase();
    setTransactionId(txId);
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        // Jika sisa waktu tinggal 1 detik atau kurang, hentikan interval dan kunci di angka 0
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatRupiah = (num: number) => "Rp " + num.toLocaleString("id-ID");

  const handleAlreadyPaid = () => {
    if (isExpired) {
      alert("Payment time has expired. Please reorder your tickets.");
      return;
    }
    router.push(
      `/cart/payment/success?transactionId=${transactionId}&eventId=${selectedEvent.id}&amount=${totalAmount}&qty=${ticketQty}&variant=${encodeURIComponent(ticketVariant)}`
    );
  };

  const qrisPayload = `CHISTIX-PAYMENT-${transactionId}-Rp${totalAmount}`;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-slate-800">Pay with QRIS</h1>
            <p className="text-xs text-slate-400">
              Transaction ID: <span className="font-semibold text-slate-600">{transactionId || "..."}</span>
            </p>
          </div>

          {/* Badge Countdown: Berubah Merah jika Waktu Habis */}
          <div className={`px-3 py-1.5 rounded-xl text-center border transition-colors ${isExpired ? "bg-rose-50 border-rose-200" : "bg-amber-50 border-amber-200"}`}>
            <div className={`text-[10px] font-semibold ${isExpired ? "text-rose-700" : "text-amber-700"}`}>{isExpired ? "Status" : "Valid for"}</div>
            <div className={`text-base font-extrabold leading-tight ${isExpired ? "text-rose-600" : "text-amber-600"}`}>{isExpired ? "EXPIRED" : formatTime(timeLeft)}</div>
          </div>
        </div>

        {/* Ringkasan Total Bayar */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Total to Pay</div>
            <div className="text-lg font-bold text-amber-600 mt-0.5">{formatRupiah(totalAmount)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-slate-800">{selectedEvent.title}</div>
            <div className="text-[11px] text-slate-400">
              {ticketQty}x {ticketVariant}
            </div>
          </div>
        </div>

        {/* Kotak QR Code dengan Lapisan Kunci (Overlay) jika Expired */}
        <div className="text-center space-y-3 py-2">
          <div className="relative w-52 h-52 mx-auto bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-col items-center justify-center overflow-hidden">
            <div className={`w-full h-full bg-white rounded-xl flex flex-col items-center justify-center border border-slate-100 transition-all ${isExpired ? "blur-xs opacity-25" : ""}`}>
              <QRCodeSVG value={qrisPayload} size={160} level="H" includeMargin={true} />
            </div>

            {/* Lapisan Teks Expired di Atas QR Code */}
            {isExpired && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center">
                <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Payment time has expired!</span>
                <p className="text-[10px] text-slate-500 mt-1 leading-snug">The QR code is no longer valid. The ticket quota has been returned to the system.</p>
              </div>
            )}
          </div>
          <p className="text-xs font-semibold text-slate-700">{isExpired ? "Pembayaran Dibatalkan Otomatis" : "Scan QR Code"}</p>
        </div>

        {/* Tombol Aksi Bawah */}
        <div className="space-y-2.5 pt-2">
          {isExpired ? (
            /* Jika Expired: Tombol Berganti Menjadi Pesan Ulang */
            <button onClick={() => router.push(`/cart?eventId=${selectedEvent.id}`)} className="w-full py-3 bg-[#EA580C] hover:bg-[#BB4D00] text-white font-bold text-sm rounded-xl transition cursor-pointer shadow-xs">
              Reorder Ticket!
            </button>
          ) : (
            /* Jika Masih Aktif: Tombol Bayar Normal */
            <button onClick={handleAlreadyPaid} className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl transition cursor-pointer shadow-xs">
              Yes i already paid!
            </button>
          )}

          <button onClick={() => router.push("/")} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm rounded-xl transition cursor-pointer">
            Return Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default function QrPaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs text-slate-400">Loading...</div>}>
      <QrPaymentContent />
    </Suspense>
  );
}
