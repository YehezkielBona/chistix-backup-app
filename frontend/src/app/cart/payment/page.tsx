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

  const selectedEvent =
    DUMMY_EVENTS.find((e) => e.id.toString() === eventIdParam) || DUMMY_EVENTS[0];

  const totalAmount = amountParam ? parseInt(amountParam, 10) : selectedEvent.price;
  const ticketQty = qtyParam ? parseInt(qtyParam, 10) : 1;
  const ticketVariant = variantParam || "Presale";

  const [transactionId, setTransactionId] = useState("");
  const [timeLeft, setTimeLeft] = useState(10 * 60);

  useEffect(() => {
    const randomString = Math.random().toString(36).substring(2, 10).toUpperCase();
    setTransactionId(randomString);

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

  const handleAlreadyPaid = () => {
    router.push(
      `/cart/payment/success?eventId=${selectedEvent.id}&amount=${totalAmount}&qty=${ticketQty}&variant=${encodeURIComponent(ticketVariant)}`
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

          <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-center">
            <div className="text-[10px] font-semibold text-amber-700">Valid for</div>
            <div className="text-base font-extrabold text-amber-600 leading-tight">
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

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

        <div className="text-center space-y-3 py-2">
          <div className="w-52 h-52 mx-auto bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-col items-center justify-center">
            <div className="w-full h-full bg-white rounded-xl flex flex-col items-center justify-center border border-slate-100">
              <QRCodeSVG value={qrisPayload} size={160} level="H" includeMargin={true} />
            </div>
          </div>
          <p className="text-xs font-semibold text-slate-700">Scan QR Code</p>
        </div>

        <div className="space-y-2.5 pt-2">
          <button
            onClick={handleAlreadyPaid}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl transition cursor-pointer shadow-xs"
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

export default function QrPaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs text-slate-400">Loading...</div>}>
      <QrPaymentContent />
    </Suspense>
  );
}