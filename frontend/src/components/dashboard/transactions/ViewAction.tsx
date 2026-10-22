import React from "react";
import { TransactionItem } from "@/types/transaction";
import StatusBadge from "./StatusBadge";
import { ReceiptPercentIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface ViewActionProps {
  isOpen: boolean;
  transaction: TransactionItem | null;
  onClose: () => void;
}

export default function ViewAction({ isOpen, transaction, onClose }: ViewActionProps) {
  if (!isOpen || !transaction) return null;

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-neutral-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center px-6 py-4 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-[#BB4D00]">
              <ReceiptPercentIcon className="w-5 h-5" />
            </div>
            <div>
                <h2 className="text-base md:text-lg font-bold text-neutral-900">History Transaction</h2>
                <p className="text-xs text-neutral-400">#{transaction.id}</p>
            </div>
          </div>
          <button
          onClick={onClose}
          className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4 text-xs md:text-sm">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <span className="text-neutral-500 font-medium">
                    Status Transaction :
                </span>
                <StatusBadge status={transaction.status} countdown={transaction.autoCancelCountdown} />
            </div>
            <div className="space-y-2.5">
                <div className="flex justify-between">
                    <span className="text-neutral-500">Customer Name:</span>
                    <span className="font-semibold text-neutral-900">{transaction.customerName}</span>
                </div>
                <div className="flex justify-between items-start gap-4">
                    <span className="text-neutral-500 shrink-0">Event Name:</span>
                    <span className="font-semibold text-neutral-900 text-right max-w-56 leading-snug" title={transaction.eventName}>{transaction.eventName}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-neutral-500">Ticket Category:</span>
                    <span className="font-semibold text-neutral-900 text-right">{transaction.ticketTier} x{transaction.quantity} </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-neutral-500">Payment Method:</span>
                    <span className="font-semibold text-neutral-700">Bank Transfer / QRIS</span>
                    <span></span>
                </div>
            </div>

            <div className="bg-[#FAF8F4] border border-[#BB4D00]/15 rounded-xl p-3.5 flex justify-between items-center mt-3">
                <span className="text-neutral-600 font-medium">Total Payment:</span>
                <span className="text-base font-bold text-[#BB4D00]">{formatRupiah(transaction.totalPrice)}</span>
            </div>
        </div>

        <div className="flex items-center justify-end px-6 py-4 bg-neutral-50 border-t border-neutral-100">
            <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 rounded-full text-xs md:text-sm font-semibold text-white bg-[#EA5B0C] hover:bg-[#BB4D00] shadow-xs transition-colors cursor-pointer"
            >
                Done
            </button>

        </div>
      </div>
    </div>
  );
}
