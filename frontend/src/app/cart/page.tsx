"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Coins, Info } from "lucide-react";
import CartItemTable from "@/components/cart/CartItemTable";
import VoucherSection from "@/components/cart/VoucherSection";
import OrderSummary from "@/components/cart/OrderSummary";
import PaymentMethod from "@/components/cart/PaymentMethod";
import { apiFetch } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { TICKET_LABEL, type ApiEvent, type CustomerOverview, type TicketTypeEnum } from "@/types/api";

const MAX_PER_ORDER = 10;

const toTicketType = (v: string | null): TicketTypeEnum | null => {
  const up = (v ?? "").toUpperCase();
  return up === "VIP" || up === "REGULAR" || up === "PRESALE" ? up : null;
};

function CartContent() {
  const searchParams = useSearchParams();

  // 1. Ambil query parameter dari URL
  const queryEventId = searchParams.get("eventId");
  const queryQty = searchParams.get("qty");
  const queryTicketType = toTicketType(searchParams.get("ticketType") ?? searchParams.get("variant"));

  // 2. Ambil data event asli berdasarkan eventId dari URL
  const [event, setEvent] = useState<ApiEvent | null>(null);
  const [loadError, setLoadError] = useState("");
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (!queryEventId) {
      setLoadError("Pilih tiket dari halaman detail event terlebih dahulu.");
      return;
    }
    apiFetch<{ data: ApiEvent }>(`/api/events/${queryEventId}`)
      .then((r) => setEvent(r.data))
      .catch((e: Error) => setLoadError(e.message));
  }, [queryEventId]);

  // 3. State Jumlah Tiket
  const [ticketQty, setTicketQty] = useState<number>(() => {
    if (queryQty && Number(queryQty) > 0) return Number(queryQty);
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("chistix_ticket_qty");
      if (saved && Number(saved) > 0) return Number(saved);
    }
    return 1;
  });

  // 4. State Varian Tiket
  const [ticketType, setTicketType] = useState<TicketTypeEnum>(() => {
    if (queryTicketType) return queryTicketType;
    if (typeof window !== "undefined") {
      const saved = toTicketType(sessionStorage.getItem("chistix_ticket_variant"));
      if (saved) return saved;
    }
    return "REGULAR";
  });

  // 5. State Diskon Voucher & Poin
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [appliedVoucherCode, setAppliedVoucherCode] = useState<string>("");
  const [pointBalance, setPointBalance] = useState<number>(0);
  const [isPointsClaimed, setIsPointsClaimed] = useState<boolean>(false);

  // Saldo poin asli customer dari backend
  useEffect(() => {
    if (!session?.user) return;
    apiFetch<{ data: CustomerOverview }>("/api/customer/overview")
      .then((r) => setPointBalance(r.data.points ?? 0))
      .catch(() => setPointBalance(0));
  }, [session?.user]);

  // Sync state dengan URL Query Parameter saat URL berubah
  useEffect(() => {
    const qty = searchParams.get("qty");
    const type = toTicketType(searchParams.get("ticketType") ?? searchParams.get("variant"));

    if (qty && Number(qty) > 0) setTicketQty(Number(qty));
    if (type) setTicketType(type);
  }, [searchParams]);

  // 6. Penentuan Harga & Sisa Kursi Kategori
  const selectedTier = event?.ticketTiers.find((t) => t.ticketType === ticketType) ?? null;
  const basePricePerTicket = selectedTier?.finalPrice ?? 0;
  const maxQty = selectedTier ? Math.min(MAX_PER_ORDER, selectedTier.remaining) : 0;

  useEffect(() => {
    if (maxQty > 0 && ticketQty > maxQty) setTicketQty(maxQty);
  }, [maxQty, ticketQty]);

  const rawSubtotal = basePricePerTicket * ticketQty;
  const taxFee = Math.round(rawSubtotal * 0.11); // PPN 11%

  // Potongan poin
  const pointDiscountValue = isPointsClaimed ? Math.min(pointBalance, Math.max(0, rawSubtotal - couponDiscount)) : 0;
  const totalDiscount = couponDiscount + pointDiscountValue;
  const subtotalAfterDiscount = Math.max(0, rawSubtotal - totalDiscount);
  const totalAmount = Math.max(0, subtotalAfterDiscount + taxFee);

  // Validasi kode voucher
  const handleApplyVoucher = async (code: string) => {
    try {
      const res = await fetch("/api/vouchers/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, eventId: queryEventId }),
      });
      const json = await res.json();

      if (json.success) {
        const { discountType, discount } = json.data;
        setAppliedVoucherCode(code); // Simpan kode untuk proses checkout
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
    } catch (err: any) {
      setAppliedVoucherCode("");
      alert(err.message || "Gagal validasi voucher");
    }
  };

  if (loadError) {
    return (
      <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-600">
        {loadError}
      </div>
    );
  }
  if (!event) {
    return <div className="text-sm text-slate-500 py-10">Memuat data event...</div>;
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
      <section className="space-y-2">
        <CartItemTable
          eventTitle={event.title}
          organizerName={event.organizer?.name ?? "-"}
          quantity={ticketQty}
          setQuantity={(newQty) => {
            setTicketQty(newQty);
            if (typeof window !== "undefined") {
              sessionStorage.setItem("chistix_ticket_qty", newQty.toString());
            }
          }}
          variant={TICKET_LABEL[ticketType]}
          basePrice={basePricePerTicket}
          maxQuantity={maxQty}
        />
        {selectedTier?.lowStock && (
          <p className="text-[11px] font-semibold text-red-500">
            Tinggal {selectedTier.remaining} tiket {TICKET_LABEL[ticketType]} lagi!
          </p>
        )}
        {(!selectedTier || !selectedTier.isAvailable) && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
            Tiket {TICKET_LABEL[ticketType]}{" "}
            {selectedTier ? selectedTier.statusLabel.toLowerCase() : "tidak dijual untuk event ini"}.
          </p>
        )}
      </section>

      {/* 2. Voucher Discount Section */}
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

        <hr className="border-slate-200 my-2" />
        
        <div className="flex items-center justify-between py-1">
          <p className="text-xs text-slate-600 font-medium">
            You have <span className="font-bold text-amber-600">{pointBalance.toLocaleString("id-ID")} Points</span>
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
      {selectedTier?.isAvailable && (
        <section className="pt-2">
          <PaymentMethod
            totalAmount={totalAmount}
            quantity={ticketQty}
            eventId={event?.id || queryEventId || ""}
            ticketVariant={ticketType}
            voucherCode={appliedVoucherCode}
            pointsUsed={pointDiscountValue}
          />
        </section>
      )}
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