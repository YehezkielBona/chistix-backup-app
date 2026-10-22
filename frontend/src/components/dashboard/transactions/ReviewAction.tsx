import React from "react";
import { TransactionItem } from "@/types/transaction";
import { XMarkIcon, PhotoIcon } from "@heroicons/react/24/outline";

interface ReviewActionProps {
  isOpen: boolean;
  transaction: TransactionItem | null;
  onClose: () => void;
  onAccept: (trxId: string) => void;
  onReject: (trxId: string) => void;
}

export default function ReviewAction({ isOpen, transaction, onClose, onAccept, onReject }: ReviewActionProps) {
  if (!isOpen || !transaction) return null;

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs-p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-neutral-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center px-6 py-4 border-b border-neutral-100">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">Review Payment Proof</h2>
            <p className="text-xs text-neutral-400 mt-0.5">ID Transaksi: #{transaction.id}</p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs md:text-sm">
          <div className="bg-neutral-50 rounded-xl p-4 space y-2 border border-neutral-100">
            <div className="flex justify-between">
              <span className="text-neutral-500">Customer:</span>
              <span className="font-semibold text-neutral-900">{transaction.customerName}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-neutral-500">Event:</span>
                <span className="font-semibold text-neutral-900 text-right max-w-56" title={transaction.eventName}>{transaction.eventName}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-neutral-500">Ticket Category</span>
                <span className="font-semibold text-neutral-900">{transaction.ticketTier} x{transaction.quantity}</span>
            </div>
            <div className="flex justify-between border-t border-neutral-200/60 pt-2 mt-2">
              <span className="font-medium text-neutral-700">Total Pembayaran:</span>
              <span className="font-bold text-[#BB4D00]">
                {formatRupiah(transaction.totalPrice)}
              </span>
            </div>
          </div>

          <div>
            <p className="font-semibold text-neutral-700 mb-2">
                Payment Proof Attached :
            </p>
            <div className="border-2 border-dashed border-neutral-200 rounded-xl p-6 flex flex-col items-center justify-center bg-neutral-50/50 text-neutral-400">
            <PhotoIcon className="w-10 h-10 mb-1 text-neutral-300"/>
            <p className="text-xs font-medium text-neutral-500">proof-example.jpg</p>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1">
                ✓ Correct amount ({formatRupiah(transaction.totalPrice)})
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 px-6 py-4 bg-neutral-50/60 border-t border-neutral-100">
            <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-ws md: text-sm font-semibold text-neutral-600 hover:bg-neutral-200/60 transition-colors cursor-pointer"
            >
                Cancel
            </button>

            <button
            onClick={() => onReject(transaction.id)}
            className="px-4 py-2 rounded-full text-ws md: text-sm font-semibold text-neutral-600 hover:bg-neutral-200/60 transition-colors cursor-pointer"
            >
                Reject
            </button>

            <button
            onClick={(() => onAccept(transaction.id))}
            className="px-5 py-2 rounded-full text-xs md:text-sm font-semibold text-white bg-[#EA580C] hover:bg-[#BB4D00] shadow-xs transition-colors cursor-pointer"
            >
                Accept
            </button>
        </div>
        
      </div>
    </div>
  );
}
