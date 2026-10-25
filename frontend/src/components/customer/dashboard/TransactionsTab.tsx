"use client";

// [LAMA] import React, { useState } from "react";
import React, { useState, useEffect, useCallback } from "react"; // [BARU] + useEffect, useCallback
import { useRouter } from "next/navigation"; // [BARU] pindah ke tab Events
import UploadPaymentModal from "./UploadPaymentModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog"; // [BARU]
import { apiFetch } from "@/lib/api"; // [BARU]
import { STATUS_LABEL, type ApiTransaction, type Paged, type TrxStatus } from "@/types/api"; // [BARU]

// [LAMA] bentuk data dummy
// interface TransactionItem {
//   id: string | number;
//   title: string;
//   ticketType: string;
//   qty: number;
//   status: "Waiting Payment" | "Waiting Approval" | "Done" | "Canceled";
//   price: string;
// }

interface TransactionsTabProps {
  // [LAMA] transactions?: TransactionItem[];
  // [BARU] prop lama tetap diterima supaya page.tsx belum perlu diubah, tapi TIDAK dipakai
  transactions?: unknown[];
}

const LIMIT = 10; // [BARU] jumlah transaksi per halaman

// [BARU] warna teks per status
const STATUS_COLOR: Record<TrxStatus, string> = {
  WAITING_PAYMENT: "text-amber-500",
  WAITING_CONFIRM: "text-sky-600",
  DONE: "text-emerald-600",
  REJECTED: "text-red-500",
  EXPIRED: "text-red-500",
  CANCELED: "text-red-500",
};

const formatRupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");
const formatDeadline = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta",
  });

// [LAMA] export default function TransactionsTab({ transactions: initialTransactions = [] }: TransactionsTabProps) {
export default function TransactionsTab(_props: TransactionsTabProps) {
  const router = useRouter(); // [BARU]
  const [isModalOpen, setIsModalOpen] = useState(false);
  // [LAMA] const [selectedTrxId, setSelectedTrxId] = useState<string | number | null>(null);
  const [selectedTrx, setSelectedTrx] = useState<ApiTransaction | null>(null); // [BARU] seluruh data transaksi untuk modal

  // [LAMA] state lokal berisi data dummy
  // const [transactions, setTransactions] = useState<TransactionItem[]>(() => {
  //   if (initialTransactions.length > 0) return initialTransactions;
  //   return [
  //     { id: 1, title: "Resonance Soundfest 2026: Intimate Live Performance", ticketType: "VIP", qty: 1, status: "Waiting Payment", price: "Rp. 550.000" },
  //     { id: 2, title: "Jazz evening at the Park", ticketType: "Regular", qty: 2, status: "Done", price: "Rp. 300.000" },
  //     { id: 3, title: "Indie Wave Fest: Sunset Beach Session", ticketType: "Presale", qty: 1, status: "Canceled", price: "Rp. 550.000" },
  //   ];
  // });

  // [BARU] data asli dari backend + pagination
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // [BARU] state dialog batal
  const [cancelTarget, setCancelTarget] = useState<ApiTransaction | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // [BARU] ambil daftar transaksi dari backend
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await apiFetch<Paged<ApiTransaction>>(`/api/transactions?page=${page}&limit=${LIMIT}`);
      setTransactions(r.data);
      setTotalPages(r.totalPages);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  // Fungsi yang dipanggil otomatis setelah berhasil klik "Send Proof" di modal
  const handleUploadSuccess = () => {
    // [LAMA] status diubah di browser saja
    // if (selectedTrxId !== null) {
    //   setTransactions((prev) =>
    //     prev.map((trx) =>
    //       trx.id === selectedTrxId ? { ...trx, status: "Waiting Approval" } : trx
    //     )
    //   );
    // }
    // [BARU] status sudah diubah backend, cukup ambil ulang datanya
    void load();
    setIsModalOpen(false);
    // [LAMA] setSelectedTrxId(null);
    setSelectedTrx(null);
  };

  // [BARU] batalkan transaksi setelah konfirmasi
  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await apiFetch(`/api/transactions/${cancelTarget.id}/cancel`, { method: "PATCH" });
      setCancelTarget(null);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCancelling(false);
    }
  };

  const openUpload = (trx: ApiTransaction) => {
    setSelectedTrx(trx);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Transactions</h1>
        <p className="mt-0.5 text-xs text-neutral-500">Manage and view your order history</p>
      </div>

      {/* [BARU] pesan error */}
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

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
            {/* [BARU] loading state */}
            {loading ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-neutral-400">Memuat transaksi...</td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-neutral-400">
                  Belum ada riwayat transaksi.
                </td>
              </tr>
            ) : (
              transactions.map((trx) => (
                <tr key={trx.id}>
                  <td className="py-4 font-semibold text-neutral-900 pr-2 break-words text-left">
                    {/* [LAMA] {trx.title} */}
                    {trx.event.title}
                  </td>
                  {/* [LAMA] {trx.ticketType} */}
                  {/* TODO schema v2: tampilkan trx.ticketType */}
                  <td className="py-4 text-center px-1 truncate">{trx.ticketType ?? "-"}</td>
                  {/* [LAMA] {trx.qty} */}
                  <td className="py-4 text-center px-1">{trx.quantity}</td>
                  <td
                    // [LAMA] warna berdasarkan teks status dummy
                    className={`py-4 text-center px-1 font-semibold whitespace-nowrap ${STATUS_COLOR[trx.status]}`}
                  >
                    {/* [LAMA] {trx.status} */}
                    {STATUS_LABEL[trx.status]}
                    {/* [BARU] batas waktu bayar */}
                    {trx.status === "WAITING_PAYMENT" && (
                      <span className="block text-[10px] font-normal text-neutral-400">
                        Bayar sebelum {formatDeadline(trx.paymentDeadline)}
                      </span>
                    )}
                  </td>
                  <td className="py-4 text-center px-1 font-semibold text-neutral-900 whitespace-nowrap">
                    {/* [LAMA] {trx.price?.replace(",00", "")} */}
                    {formatRupiah(trx.totalPrice)}
                  </td>
                  <td className="py-4 text-center px-1">
                    {/* [LAMA] hanya tombol Upload Proof untuk "Waiting Payment" */}
                    {trx.status === "WAITING_PAYMENT" ? (
                      <div className="flex flex-col items-center gap-1">
                        <button
                          type="button"
                          // [LAMA] onClick={() => { setSelectedTrxId(trx.id); setIsModalOpen(true); }}
                          onClick={() => openUpload(trx)}
                          className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition-colors cursor-pointer active:scale-95 inline-block whitespace-nowrap"
                        >
                          Upload Proof
                        </button>
                        {/* [BARU] batalkan pesanan */}
                        <button
                          type="button"
                          onClick={() => setCancelTarget(trx)}
                          className="text-[11px] font-semibold text-red-500 hover:underline cursor-pointer"
                        >
                          Batalkan
                        </button>
                      </div>
                    ) : trx.status === "WAITING_CONFIRM" ? (
                      // [BARU] upload ulang diizinkan, file lama dihapus otomatis di backend
                      <button
                        type="button"
                        onClick={() => openUpload(trx)}
                        className="rounded-lg border border-amber-500 px-3 py-1.5 text-xs font-semibold text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Ganti Bukti
                      </button>
                    ) : trx.status === "DONE" ? (
                      // [BARU] lihat dan cetak e-ticket
                      <button
                        type="button"
                        onClick={() => router.push("/customer/dashboard?tab=events")}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Lihat Tiket
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

      {/* [BARU] pagination dari backend */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 text-xs">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 rounded border border-neutral-200 disabled:opacity-40 cursor-pointer"
          >
            Previous
          </button>
          <span className="text-neutral-600">
            Halaman {page} dari {totalPages}
          </span>
          <button
            type="button"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 rounded border border-neutral-200 disabled:opacity-40 cursor-pointer"
          >
            Next
          </button>
        </div>
      )}

      {/* Sambungkan modal dengan fungsi handleUploadSuccess */}
      <UploadPaymentModal
        isOpen={isModalOpen}
        transaction={selectedTrx} // [BARU] data transaksi yang dipilih
        onClose={() => {
          setIsModalOpen(false);
          // [LAMA] setSelectedTrxId(null);
          setSelectedTrx(null);
        }}
        onSuccess={handleUploadSuccess}
      />

      {/* [BARU] popup konfirmasi sebelum membatalkan */}
      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Batalkan pesanan?"
        message="Poin dan voucher yang dipakai akan dikembalikan. Pesanan yang sudah dibatalkan tidak bisa dipulihkan."
        confirmLabel="Ya, batalkan"
        loading={cancelling}
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
}