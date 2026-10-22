"use client";

import React, { useState } from "react";
import UploadPaymentModal from "./UploadPaymentModal";
import { TransactionItem } from "@/app/customer/dashboard/page";

interface TransactionsTabProps {
  transactions?: TransactionItem[];
}

export default function TransactionsTab({ transactions = [] }: TransactionsTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Transactions</h1>
        <p className="mt-0.5 text-xs text-neutral-500">Manage and view your order history</p>
      </div>

      <div className="w-full">
        <table className="w-full text-left text-xs table-fixed">
          <thead className="border-b border-neutral-100 text-neutral-400">
            <tr>
              <th className="pb-3 font-medium text-left w-[28%]">Event Name</th>
              <th className="pb-3 font-medium text-center px-1 w-[13%]">Ticket Type</th>
              <th className="pb-3 font-medium text-center px-1 w-[8%]">Qty</th>
              <th className="pb-3 font-medium text-center px-1 w-[18%]">Status</th>
              <th className="pb-3 font-medium text-center px-1 w-[18%]">Price</th>
              <th className="pb-3 font-medium text-center px-1 w-[15%]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50 text-neutral-700">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-neutral-400">
                  Belum ada riwayat transaksi.
                </td>
              </tr>
            ) : (
              transactions.map((trx) => (
                <tr key={trx.id}>
                  <td className="py-4 font-semibold text-neutral-900 pr-2 break-words text-left">
                    {trx.title}
                  </td>
                  <td className="py-4 text-center px-1 truncate">{trx.ticketType}</td>
                  <td className="py-4 text-center px-1">{trx.qty}</td>
                  <td
                    className={`py-4 text-center px-1 font-semibold whitespace-nowrap ${
                      trx.status === "Waiting Payment"
                        ? "text-amber-500"
                        : trx.status === "Done"
                        ? "text-emerald-600"
                        : "text-red-500"
                    }`}
                  >
                    {trx.status}
                  </td>
                  <td className="py-4 text-center px-1 font-semibold text-neutral-900 whitespace-nowrap">
                    {trx.price}
                  </td>
                  <td className="py-4 text-center px-1">
                    {trx.status === "Waiting Payment" ? (
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition-colors cursor-pointer active:scale-95 inline-block whitespace-nowrap"
                      >
                        Upload Proof
                      </button>
                    ) : (
                      <span className="text-neutral-300">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <UploadPaymentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}