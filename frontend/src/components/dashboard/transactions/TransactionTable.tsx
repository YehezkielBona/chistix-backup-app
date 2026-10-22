import React from "react";
import { TransactionItem } from "@/types/transaction";
import StatusBadge from "./StatusBadge";

interface TransactionTableProps {
  transactions: TransactionItem[];
  onReview: (trx: TransactionItem) => void;
  onView: (trx: TransactionItem) => void;
}

export default function TransactionTable({ transactions, onReview, onView }: TransactionTableProps) {
  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (transactions.length === 0) {
    return <div className="text-center py-12 text-neutral-400 text-sm">There's no match transaction founded by this filter</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs md:text-sm">
        <thead>
          <tr className="text-neutral-900 font-semibold border-b border-neutral-100">
            <th className="pb-3.5 pl-1 w-40">Customer</th>
            <th className="pb-3.5 pr-4">Event & Ticket</th>
            <th className="pb-3.5 px-4 whitespace-nowrap">Total</th>
            <th className="pb-3.5 px-4 min-w-32">Status</th>
            <th className="pb-3.5 text-center pr-2">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {transactions.map((trx) => (
            <tr key={trx.id} className="hover:bg-neutral-50/50 transition-colors">
              <td className="py-4 pl-1 align-top">
                <p className="font-semibold text-neutral-900">{trx.customerName}</p>
                <p className="text-neutral-400 text-xs mt-0.5">#{trx.id}</p>
              </td>

              <td className="py-4 pr-4 align-top max-w-64">
                <p className="font-semibold text-neutral-900 leading-snug line-clamp-3">{trx.eventName}</p>
                <p className="text-neutral-400 text-xs mt-0.5 font-medium">
                  {trx.ticketTier} <span className="text-neutral-500 font-semibold">x{trx.quantity}</span>
                </p>
              </td>

              <td className="py-4 px-4 align-top font-semibold text-neutral-900 whitespace-nowrap">{formatRupiah(trx.totalPrice)}</td>

              <td className="py-4 px-4 align-top">
                <StatusBadge status={trx.status} countdown={trx.autoCancelCountdown} />
              </td>

              <td className="py-4 pr-2 align-top text-right">
                {trx.status === "WAITING_CONFIRM" ? (
                  <button onClick={() => onReview(trx)} className="w-20 py-1.5 bg-[#EA580C] hover:bg-[#BB4D00] text-white px-3.5 rounded-full text-xs font-semibold shadow-2xs transition-all cursor-pointer">
                    Review
                  </button>
                ) : (
                  <button onClick={() => onView(trx)} className="w-20 py-1.5 text-neutral-500 hover:text-[#BB4D00] text-xs underline font-medium cursor-pointer">
                    View
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
