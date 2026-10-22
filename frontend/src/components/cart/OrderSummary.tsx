import React from "react";

interface OrderSummaryProps {
  ticketQty: number;
  subtotal: number;
  couponDiscount: number; // Potongan khusus kupon
  pointDiscount: number;  // Potongan khusus poin
  taxFee: number;
  totalAmount: number;
}

export default function OrderSummary({
  ticketQty,
  subtotal,
  couponDiscount,
  pointDiscount,
  taxFee,
  totalAmount,
}: OrderSummaryProps) {
  // Format ke Rupiah
  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  };

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
        Order Summary
      </h2>

      <div className="space-y-2 text-xs text-slate-600">
        <div className="flex justify-between">
          <span>Ticket Quantity</span>
          <span className="font-semibold text-slate-800">{ticketQty}x Ticket</span>
        </div>

        <div className="flex justify-between">
          <span>Cart Subtotal</span>
          <span className="font-semibold text-slate-800">{formatRupiah(subtotal)}</span>
        </div>

        {/* Baris Kupon Diskon (Warna Merah) */}
        {couponDiscount > 0 && (
          <div className="flex justify-between text-red-500 font-medium">
            <span>Coupon Discount</span>
            <span>-{formatRupiah(couponDiscount)}</span>
          </div>
        )}

        {/* Baris Potongan Poin (Warna Merah, Hanya tampil jika poin diklaim) */}
        {pointDiscount > 0 && (
          <div className="flex justify-between text-red-500 font-medium">
            <span>Point Discount</span>
            <span>-{formatRupiah(pointDiscount)}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span>Tax Fee (11%)</span>
          <span className="font-semibold text-slate-800">{formatRupiah(taxFee)}</span>
        </div>
      </div>

      <hr className="border-slate-200 my-2" />

      <div className="flex justify-between items-center text-sm">
        <span className="font-bold text-slate-800">Total Amount</span>
        <span className="font-bold text-amber-600 text-base">
          {formatRupiah(totalAmount)}
        </span>
      </div>
    </div>
  );
}