"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DUMMY_EVENTS } from "@/data/events";

function formatEventDate(dateString?: string) {
  if (!dateString) return "15 November 2026 • 16:00";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d).replace(".", ":");
}

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const eventIdParam = searchParams.get("eventId");
  const transactionIdParam = searchParams.get("transactionId");
  const amountParam = searchParams.get("amount");
  const qtyParam = searchParams.get("qty");
  const variantParam = searchParams.get("variant");
  const customerParam = searchParams.get("customer");

  const [trxData, setTrxData] = useState<any>(null);

  useEffect(() => {
    if (!transactionIdParam) return;
    fetch(`/api/transactions/${transactionIdParam}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setTrxData(json.data);
        }
      })
      .catch((err) => console.error("Failed load transaction detail:", err));
  }, [transactionIdParam]);

  const fallbackEvent =
    DUMMY_EVENTS.find((e) => e.id.toString() === eventIdParam) || DUMMY_EVENTS[0];

  const eventTitle = trxData?.event?.title || fallbackEvent.title;
  const eventDate = trxData?.event?.startDate || fallbackEvent.date;
  const eventLocation = trxData?.event?.venueDetail 
    ? `${trxData.event.venueDetail}, ${trxData.event.cityName}` 
    : (fallbackEvent.location || "Jakarta, Indonesia");
  const customerName = trxData?.user?.name || customerParam || "Customer";
  const ticketVariant = trxData?.ticketType || variantParam || "Regular";
  const ticketQty = trxData?.quantity || (qtyParam ? parseInt(qtyParam, 10) : 1);
  
  // Utamakan amountParam dari URL (yang sudah include tax 11%) atau totalPrice dari DB
  const totalAmount = amountParam ? parseInt(amountParam, 10) : (trxData?.totalPrice || fallbackEvent.price);

  const formatRupiah = (num: number) => "Rp " + num.toLocaleString("id-ID");

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
        <div className="flex justify-center mb-3">
          <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white stroke-current"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="3"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Payment Successful!</h1>
          <p className="text-xs text-amber-600 font-medium mt-1">
            Your order is being confirmed by the organizer (max. 2 hours).
          </p>
        </div>

        <div className="space-y-3 text-xs font-medium border-t border-slate-100 pt-4 mb-2">
          {transactionIdParam && (
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-slate-400">Transaction ID</span>
              <span className="font-mono font-bold text-slate-800 text-[11px]">{transactionIdParam}</span>
            </div>
          )}
          <div className="flex justify-between items-start gap-4">
            <span className="text-slate-400 shrink-0">Events</span>
            <span className="font-bold text-right text-slate-900 max-w-[240px] leading-snug break-words">
              {eventTitle}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Customer</span>
            <span className="font-bold text-slate-900">{customerName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Ticket Type</span>
            <span className="font-bold text-slate-900">
              {ticketVariant} ({ticketQty}x Ticket)
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Date & Time</span>
            <span className="font-bold text-slate-900">
              {formatEventDate(eventDate)}
            </span>
          </div>
          <div className="flex justify-between items-start gap-4">
            <span className="text-slate-400 shrink-0">Location</span>
            <span className="font-bold text-slate-900 text-right max-w-[240px] leading-snug break-words">
              {eventLocation}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
            <span className="text-slate-400">Total Amount</span>
            <span className="font-bold text-emerald-600 text-sm">
              {formatRupiah(totalAmount)}
            </span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-md mt-4 space-y-2">
        <button
          onClick={() => router.push("/customer/dashboard?tab=transactions")}
          className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-2xl transition cursor-pointer shadow-xs text-center block"
        >
          Check Transaction Status
        </button>

        <button
          onClick={() => router.push("/")}
          className="w-full py-3.5 bg-slate-200/70 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition cursor-pointer text-center block"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-xs text-slate-400">
          Loading...
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
