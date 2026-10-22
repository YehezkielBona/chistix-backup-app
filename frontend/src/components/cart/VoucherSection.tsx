"use client";

import React, { useState } from "react";

interface VoucherSectionProps {
  onApplyVoucher: (code: string) => void;
}

export default function VoucherSection({ onApplyVoucher }: VoucherSectionProps) {
  const [voucherCode, setVoucherCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyVoucher(voucherCode);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
        <span>🏷️</span> Voucher Discount
      </label>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={voucherCode}
          onChange={(e) => setVoucherCode(e.target.value)}
          placeholder="Masukkan kode voucher Anda..."
          className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all bg-white"
        />
        <button
          type="submit"
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-semibold text-sm rounded-lg transition-colors shadow-sm shrink-0"
        >
          Apply
        </button>
      </form>
    </div>
  );
}