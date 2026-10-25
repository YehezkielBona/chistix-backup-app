import React, {useState} from "react";
import { TransactionItem } from "@/types/transaction";
import { XMarkIcon, PhotoIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";

interface ReviewActionProps {
  isOpen: boolean;
  transaction: TransactionItem | null;
  onClose: () => void;
  onAccept: (trxId: string) => Promise<void>;
  onReject: (trxId: string) => Promise<void>;
}

export default function ReviewAction({ isOpen, transaction, onClose, onAccept, onReject }: ReviewActionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen || !transaction) return null;

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleAction = async (action: "accept" | "reject") => {
    setIsSubmitting(true)
    try {
      if (action === "accept") {
        await onAccept(transaction.id)
      } else {
        await onReject(transaction.id)
      } 
    } finally {
      setIsSubmitting(false)
    }
  }

 return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-neutral-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center px-6 py-4 border-b border-neutral-100">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">Review Payment Proof</h2>
            <p className="text-xs text-neutral-400 mt-0.5">Transaction ID: #{transaction.id}</p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4 text-xs md:text-sm max-h-[75vh] overflow-y-auto">

          <div className="bg-neutral-50 rounded-xl p-4 space-y-2 border border-neutral-100">
            <div className="flex justify-between">
              <span className="text-neutral-500">Customer:</span>
              <span className="font-semibold text-neutral-900">{transaction.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Event:</span>
              <span className="font-semibold text-neutral-900 text-right max-w-56 truncate" title={transaction.eventName}>
                {transaction.eventName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Ticket Category:</span>
              <span className="font-semibold text-neutral-900">
                {transaction.ticketTier} x{transaction.quantity}
              </span>
            </div>

            <div className="pt-2 border-t border-neutral-200/60 space-y-1.5">
              <div className="flex justify-between text-neutral-600">
                <span>Harga Normal:</span>
                <span>{formatRupiah(transaction.normalPrice)}</span>
              </div>
              {transaction.voucherCode ? (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Voucher Diskon ({transaction.voucherCode}):</span>
                  <span>- {formatRupiah(transaction.discPrice)}</span>
                </div>
              ) : null}
              {transaction.pointUsed > 0 ? (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Kupon / Poin Referral:</span>
                  <span>- {formatRupiah(transaction.pointUsed)}</span>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-neutral-200/60 pt-2 font-bold">
                <span className="text-neutral-800">Total Payment:</span>
                <span className="text-[#BB4D00] text-sm md:text-base">{formatRupiah(transaction.totalPrice)}</span>
              </div>
            </div>
          </div>

          <div>
            <p className="font-semibold text-neutral-700 mb-2">Payment Proof Attached:</p>
            {transaction.paymentProof ? (
              <div className="relative group border border-neutral-200 rounded-xl overflow-hidden bg-neutral-950 flex flex-col items-center">
                <img
                  src={transaction.paymentProof}
                  alt="Bukti Transfer Customer"
                  className="max-h-72 w-full object-contain"
                />
                <a
                  href={transaction.paymentProof}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute bottom-2 right-2 bg-black/70 hover:bg-black text-white px-2.5 py-1 rounded-md text-[11px] flex items-center gap-1 backdrop-blur-xs transition"
                >
                  Open Full Image <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                </a>
              </div>
            ) : (
              <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 flex flex-col items-center justify-center bg-neutral-50 text-neutral-400">
                <PhotoIcon className="w-10 h-10 mb-1 text-neutral-300" />
                <p className="text-xs font-medium text-neutral-500">There's no payment proof uploaded</p>
              </div>
            )}
          </div>
        </div>


        <div className="flex items-center justify-end gap-2.5 px-6 py-4 bg-neutral-50/60 border-t border-neutral-100">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-full text-xs md:text-sm font-semibold text-neutral-600 hover:bg-neutral-200/60 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={() => handleAction("reject")}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-full text-xs md:text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? "Processing..." : "Reject"}
          </button>

          <button
            onClick={() => handleAction("accept")}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-full text-xs md:text-sm font-semibold text-white bg-[#EA580C] hover:bg-[#BB4D00] shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? "Processing..." : "Accept"}
          </button>
        </div>
      </div>
    </div>
  );
}
