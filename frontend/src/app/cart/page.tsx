"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Coins, Info } from "lucide-react";
import CartItemTable from "@/components/cart/CartItemTable";
import VoucherSection from "@/components/cart/VoucherSection";
import OrderSummary from "@/components/cart/OrderSummary";
import PaymentMethod from "@/components/cart/PaymentMethod";
import { DUMMY_EVENTS } from "@/data/events";

function CartContent() {
  const searchParams = useSearchParams();

  // 1. Ambil query parameter dari URL
  const queryEventId = searchParams.get("eventId");
  const queryQty = searchParams.get("qty");
  const queryVariant = searchParams.get("variant");

   // 2. State Data Event Asli dari Backend
  const [eventData, setEventData] = useState<any>(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState<boolean>(true);

  // 3. State Jumlah Tiket
  const [ticketQty, setTicketQty] = useState<number>(() => {
    if (queryQty && Number(queryQty) > 0) return Number(queryQty);
    return 1;
  });

  // 4. State Varian Tiket (VIP, Regular, atau Presale)
  const [ticketVariant, setTicketVariant] = useState<string>(() => {
    if (queryVariant) return queryVariant.toUpperCase();
    return "REGULAR";
  });

  // 5. State Diskon Voucher & Poin
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [appliedVoucherCode, setAppliedVoucherCode] = useState<string>("");
  const [pointBalance, setPointBalance] = useState<number>(0);
  const [isPointsClaimed, setIsPointsClaimed] = useState<boolean>(false);

  // 6. Tarik Data Event Riil dari Backend Express
  useEffect(() => {
    const fetchEventDetail = async () => {
      try {
        setIsLoadingEvent(true);
        // Jika ada queryEventId, pakai ID itu, jika tidak ada, ambil event pertama yang aktif
        const url = queryEventId ? `/api/events/${queryEventId}` : "/api/events";
        const res = await fetch(url);
        const json = await res.json();

        if (json.success && json.data) {
          const fetched = Array.isArray(json.data) ? json.data[0] : json.data;
          setEventData(fetched);
        }
      } catch (err) {
        console.error("Gagal mengambil event dari backend:", err);
      } finally {
        setIsLoadingEvent(false);
      }
    };

    fetchEventDetail();
  }, [queryEventId]);
  // Sync state dengan URL Query Parameter saat URL berubah
  useEffect(() => {
    const qty = searchParams.get("qty");
    const variant = searchParams.get("variant");

    if (qty && Number(qty) > 0) setTicketQty(Number(qty));
    if (variant) setTicketVariant(variant);
  }, [searchParams]);

  // Hitung Harga Satuan Tiket Sesuai Kategori dari Database
  const getPriceByTier = () => {
    if (!eventData) return 0;
    const variantUpper = ticketVariant.toUpperCase();
    if (variantUpper === "VIP") {
      return eventData.vipPriceFinal || eventData.vipPriceNormal || 0;
    }
    if (variantUpper === "PRESALE") {
      return eventData.presalePriceFinal || eventData.presalePriceNormal || 0;
    }
    return eventData.regularPriceFinal || eventData.regularPriceNormal || 0;
  };
  const basePricePerTicket = getPriceByTier();
  const rawSubtotal = basePricePerTicket * ticketQty;
  const taxFee = Math.round(rawSubtotal * 0.11); // PPN 11%

  // Nilai potongan poin (hanya aktif jika di-toggle)
  const pointDiscountValue = isPointsClaimed ? pointBalance : 0;
  
  // Total Diskon (Kupon + Poin)
  const totalDiscount = couponDiscount + pointDiscountValue;

  // Total Akhir
  const subtotalAfterDiscount = Math.max(0, rawSubtotal - totalDiscount);
  const totalAmount = Math.max(0, subtotalAfterDiscount + taxFee);

  // Validasi kode voucher ke backend (Express): POST /api/vouchers/validate
  // Hasilnya mengisi couponDiscount (state milik tim cart).
  const handleApplyVoucher = async (code: string) => {
    const res = await fetch("/api/vouchers/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, eventId: queryEventId }),
    });
    const json = await res.json();

    if (json.success) {
      const { discountType, discount } = json.data;
      setAppliedVoucherCode(code); // <-- Simpan kode voucher agar bisa dikirim saat checkout
      if (discountType === "PERCENTAGE") {
        setCouponDiscount(Math.round(rawSubtotal * (discount / 100)));
      } else {
        setCouponDiscount(discount);
      }
      alert(`Voucher berhasil! Potongan: ${discountType === "PERCENTAGE" ? discount + "%" : "Rp " + discount.toLocaleString("id-ID")}`);
    } else {
      setAppliedVoucherCode("");
      alert(json.message);
    }
  }

  return (
    <div className="w-full max-w-xl bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
      
      {/* Header Cart */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          Event Cart
        </h1>
      </div>

      {/* 1. Event Ticket Section */}
      <section>
        <CartItemTable
          eventTitle={eventData?.title || "Memuat Event..."}
          organizerName={eventData?.organizer?.name || "Nusantara Orchestra Productions"}
          quantity={ticketQty}
          setQuantity={(newQty) => {
            setTicketQty(newQty);
            if (typeof window !== "undefined") {
              sessionStorage.setItem("chistix_ticket_qty", newQty.toString());
            }
          }}
          variant={ticketVariant}
          basePrice={basePricePerTicket}
        />
      </section>

      {/* 2. Voucher Discount Section (Tulisan "Discount Coupon" ganda sudah dihapus) */}
      <section className="bg-slate-50 p-4 rounded-xl border border-slate-100">
        <VoucherSection onApplyVoucher={handleApplyVoucher} />
      </section>

      {/* 3. Point Balance Section */}
      <section className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-amber-500" /> Point Balance
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <Info className="w-3.5 h-3.5" />
            <span>Use points to get extra discounts</span>
          </div>
        </div>

        {/* Garis Pemisah (Divider) */}
        <hr className="border-slate-200 my-2" />
        
        {/* Informasi Poin & Switch Toggle */}
        <div className="flex items-center justify-between py-1">
          <p className="text-xs text-slate-600 font-medium">
            You have <span className="font-bold text-amber-600">{pointBalance} Coins</span>
          </p>

          <button
            type="button"
            onClick={() => setIsPointsClaimed(!isPointsClaimed)}
            disabled={pointBalance === 0}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              pointBalance === 0
                ? "bg-slate-200 cursor-not-allowed"
                : isPointsClaimed
                ? "bg-emerald-500"
                : "bg-slate-300"
            }`}
            role="switch"
            aria-checked={isPointsClaimed}
          >
            <span className="sr-only">Claim Points</span>
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isPointsClaimed ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </section>

      {/* 4. Order Summary Section */}
      <section className="bg-slate-50 p-4 rounded-xl border border-slate-100">
        <OrderSummary
          ticketQty={ticketQty}
          subtotal={rawSubtotal}
          couponDiscount={couponDiscount}
          pointDiscount={pointDiscountValue}
          taxFee={taxFee}
          totalAmount={totalAmount}
        />
      </section>

      {/* 5. Payment Method & Checkout */}
      <section className="pt-2">
        <PaymentMethod
          totalAmount={totalAmount}
          quantity={ticketQty}
          eventId={eventData?.id || queryEventId || ""}
          ticketVariant={ticketVariant}
          voucherCode={appliedVoucherCode}
          pointsUsed={pointDiscountValue}
        />
      </section>
    </div>
  );
}

export default function CartPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 flex flex-col items-center">
      <Suspense fallback={<div className="text-sm text-slate-500 py-10">Loading cart...</div>}>
        <CartContent />
      </Suspense>
    </div>
  );
}
