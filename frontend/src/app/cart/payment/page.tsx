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

  const [eventData, setEventData] = useState<any>(null);

  // Ambil detail event riil dari backend agar judul tidak salah
  useEffect(() => {
    if (!eventIdParam) return;
    fetch(`/api/events/${eventIdParam}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) setEventData(json.data);
      })
      .catch(() => {});
  }, [eventIdParam]);

  const fallbackEvent = DUMMY_EVENTS.find((e) => e.id.toString() === eventIdParam) || DUMMY_EVENTS[0];
  const eventTitle = eventData?.title || fallbackEvent.title;

  const totalAmount = amountParam ? parseInt(amountParam, 10) : fallbackEvent.price;
  const ticketQty = qtyParam ? parseInt(qtyParam, 10) : 1;
  const ticketVariant = variantParam || "Regular";

  const [transactionId, setTransactionId] = useState("");
  const [timeLeft, setTimeLeft] = useState(10 * 60);

  const isExpired = timeLeft <= 0;
  useEffect(() => {
    const txId = transactionIdParam || Math.random().toString(36).substring(2, 10).toUpperCase();
    setTransactionId(txId);
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [transactionIdParam]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatRupiah = (num: number) => "Rp " + num.toLocaleString("id-ID");

  const handleAlreadyPaid = async () => {
    if (isExpired) {
      alert("Payment time has expired. Please reorder your tickets.");
      return;
    }

    // Update status transaksi menjadi WAITING_CONFIRM di backend
    if (transactionId) {
      try {
        await fetch(`/api/transactions/${transactionId}/paid`, { method: "PATCH" });
      } catch (err) {
        console.error("Gagal update status transaksi:", err);
      }
    }

    router.push(
      `/cart/payment/success?transactionId=${transactionId}&eventId=${eventIdParam || fallbackEvent.id}&amount=${totalAmount}&qty=${ticketQty}&variant=${encodeURIComponent(ticketVariant)}`
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
          <div className="text-right max-w-[200px]">
            <div className="text-xs font-bold text-slate-800 truncate">{eventTitle}</div>
            <div className="text-[11px] text-slate-400">
              {ticketQty}x {ticketVariant}
            </div>
          </div>
        </div>

        {/* Kotak QR Code */}
        <div className="text-center space-y-3 py-2">
          <div className="relative w-52 h-52 mx-auto bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-col items-center justify-center overflow-hidden">
            <div className={`w-full h-full bg-white rounded-xl flex flex-col items-center justify-center border border-slate-100 transition-all ${isExpired ? "blur-xs opacity-25" : ""}`}>
              <QRCodeSVG value={qrisPayload} size={160} level="H" includeMargin={true} />
            </div>

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
            <button onClick={() => router.push(`/cart?eventId=${eventIdParam || fallbackEvent.id}`)} className="w-full py-3 bg-[#EA580C] hover:bg-[#BB4D00] text-white font-bold text-sm rounded-xl transition cursor-pointer shadow-xs">
              Reorder Ticket!
            </button>
          ) : (
            <button onClick={handleAlreadyPaid} className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl transition cursor-pointer shadow-xs">
              Yes I already paid!
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
