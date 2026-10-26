"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface PaymentMethodProps {
  totalAmount: number;
  quantity?: number;
}

function PaymentMethodContent({ totalAmount, quantity = 1 }: PaymentMethodProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State default memilih DANA
  const [selectedMethod, setSelectedMethod] = useState<string>("DANA");

  const methods = [
    { id: "DANA", label: "DANA", route: "/cart/payment/ewallet/dana", textColor: "text-blue-600" },
    { id: "QRIS", label: "QRIS", route: "/cart/payment", textColor: "text-slate-800" }, // Mengarah langsung ke /cart/payment
    { id: "ShopeePay", label: "ShopeePay", route: "/cart/payment/ewallet/shopeepay", textColor: "text-orange-600" },
  ];

  const handleCheckout = () => {
    const eventId = searchParams.get("eventId") || "1";
    // [LAMA] const variant = searchParams.get("variant") || "Presale";
    const variant = searchParams.get("ticketType") || searchParams.get("variant") || "Presale"; // [BARU] URL baru memakai ?ticketType=

    if (typeof window !== "undefined") {
      sessionStorage.setItem("chistix_total_amount", totalAmount.toString());
      sessionStorage.setItem("chistix_ticket_qty", quantity.toString());
    }

    const currentMethodObj = methods.find((m) => m.id === selectedMethod);
    const targetRoute = currentMethodObj ? currentMethodObj.route : "/cart/payment/ewallet/dana";

    // TODO langkah berikutnya: sebelum pindah halaman, panggil POST /api/transactions (checkout)
    // lalu kirim id transaksi asli ke halaman pembayaran
    router.push(
      `${targetRoute}?eventId=${eventId}&amount=${totalAmount}&qty=${quantity}&variant=${encodeURIComponent(
        variant
      )}`
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
        <span>💳</span> PAYMENT METHOD
      </h2>

      {/* Choice Buttons */}
      <div className="flex items-center justify-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
        {methods.map((m) => {
          const isSelected = selectedMethod === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedMethod(m.id)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                isSelected
                  ? "border-amber-500 bg-amber-50/50 ring-2 ring-amber-400/20"
                  : "border-slate-200 bg-white hover:border-slate-300"
              } ${m.textColor}`}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Check Out Button */}
      <div className="flex justify-center pt-1">
        <button
          type="button"
          onClick={handleCheckout}
          disabled={totalAmount <= 0}
          className="px-10 py-2.5 bg-[#FF8A00] hover:bg-[#E07B00] active:bg-amber-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-full transition-all shadow-xs cursor-pointer"
        >
          Check Out
        </button>
      </div>
    </div>
  );
}

export default function PaymentMethod(props: PaymentMethodProps) {
  return (
    <Suspense fallback={<div className="text-xs text-slate-400 text-center py-2">Loading payment method...</div>}>
      <PaymentMethodContent {...props} />
    </Suspense>
  );
}