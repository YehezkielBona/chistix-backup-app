"use client";

// [LAMA] import React, { useState } from "react";
import React, { useState, useEffect } from "react"; // [BARU] + useEffect
import { AlertCircle, Copy, Check } from "lucide-react";
import { TabType, AttendedEvent, TransactionItem } from "@/app/customer/dashboard/page";
// [LAMA] modal upload dibuka dari sini. Sekarang tombol "Upload Proof" pindah ke tab Transactions,
// karena modal butuh id transaksi (dikerjakan di tahap upload bukti bayar)
// import UploadPaymentModal from "./UploadPaymentModal";
import { apiFetch } from "@/lib/api"; // [BARU]
import { STATUS_LABEL, type TrxStatus } from "@/types/api"; // [BARU]

interface OverviewTabProps {
  setActiveTab: (tab: TabType) => void;
  // [LAMA] props di bawah dulu diisi data hardcode dari page.tsx. Sekarang TIDAK dipakai,
  // tetap dibiarkan supaya page.tsx belum perlu diubah.
  points?: number;
  attendedEvents?: AttendedEvent[];
  upcomingTicketsCount?: number;
  transactions?: TransactionItem[];
}

// [BARU] bentuk data dari GET /api/customer/overview (versi schema saat ini)
interface OverviewData {
  name: string;
  referralCode: string;
  referredCount: number;
  points: number;
  pointsExpiresAt: string | null;
  coupon: { discount: number; expiresAt: string } | null;
  upcomingTickets: number;
  nextTicketDate: string | null;
  eventsAttended: number;
  pendingReviews: number;
  pendingPayment: {
    id: string;
    quantity: number;
    totalPrice: number;
    paymentDeadline: string;
    event: { title: string };
  } | null;
  recentTransactions: {
    id: string;
    quantity: number;
    totalPrice: number;
    status: TrxStatus;
    event: { title: string };
  }[];
  serverTime: string;
}

// [BARU] helper format
const formatRupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");
const formatDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" })
    : "-";

// [BARU] countdown sisa waktu bayar, dikoreksi dengan jam server
function PaymentCountdown({ deadline, serverTime }: { deadline: string; serverTime: string }) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    const offset = Date.parse(serverTime) - Date.now();
    const tick = () => setLeft(Math.max(0, Math.floor((Date.parse(deadline) - (Date.now() + offset)) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [deadline, serverTime]);
  const hh = String(Math.floor(left / 3600)).padStart(2, "0");
  const mm = String(Math.floor((left % 3600) / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  return <span className="ml-2 font-bold text-red-500">{`${hh}:${mm}:${ss}`}</span>;
}

export default function OverviewTab({
  setActiveTab,
  // [LAMA] points = 0,
  // [LAMA] attendedEvents = [],
  // [LAMA] upcomingTicketsCount = 1,
  // [LAMA] transactions = [],
}: OverviewTabProps) {
  // [LAMA] const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // [BARU] data asli dari backend
  const [ov, setOv] = useState<OverviewData | null>(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    apiFetch<{ data: OverviewData }>("/api/customer/overview")
      .then((r) => setOv(r.data))
      .catch((e: Error) => setLoadError(e.message));
  }, []);

  // [LAMA]
  // const eventsAttendedCount = attendedEvents.length;
  // const pendingReviewsCount = attendedEvents.length;
  const points = ov?.points ?? 0; // [BARU]
  const eventsAttendedCount = ov?.eventsAttended ?? 0; // [BARU]
  const pendingReviewsCount = ov?.pendingReviews ?? 0; // [BARU]

  const handleCopy = () => {
    // [LAMA] navigator.clipboard.writeText("CHX-7K2P9");
    if (!ov?.referralCode) return;
    navigator.clipboard.writeText(ov.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // [BARU] loading & error state
  if (loadError) {
    return <p className="text-sm text-red-600">Gagal memuat dashboard: {loadError}</p>;
  }
  if (!ov) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 rounded bg-neutral-200 animate-pulse" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-neutral-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Greeting */}
      <div>
        {/* [LAMA] <h1 className="text-2xl font-bold text-neutral-900">Hi User!</h1> */}
        <h1 className="text-2xl font-bold text-neutral-900">Hi {ov.name}!</h1>
        <p className="text-xs text-neutral-500 mt-1">Here is your ticket rewards and orders</p>
      </div>

      {/* Banner Alert Payment Needed */}
      {/* [BARU] hanya tampil kalau ada transaksi yang menunggu pembayaran */}
      {ov.pendingPayment && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100">
              <AlertCircle className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-900">
                {/* [LAMA] Payment Needed for Resonance Soundfest 2026: Live Performance */}
                Payment Needed for {ov.pendingPayment.event.title}
              </p>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                {/* [LAMA] Presale VIP x1, Rp. 430.000{" "}
                <span className="ml-2 font-bold text-red-500">1: 59: 59</span> */}
                {ov.pendingPayment.quantity} tiket, {formatRupiah(ov.pendingPayment.totalPrice)}
                <PaymentCountdown deadline={ov.pendingPayment.paymentDeadline} serverTime={ov.serverTime} />
              </p>
            </div>
          </div>
          <button
            // [LAMA] onClick={() => setIsModalOpen(true)}
            onClick={() => setActiveTab("transactions")}
            className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-600 transition-colors"
          >
            Upload Proof
          </button>
        </div>
      )}

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-[#38383A] p-4 text-white">
          <p className="text-[11px] text-neutral-300">Points Balance</p>
          <p className="mt-1 text-xl font-bold">{points.toLocaleString("id-ID")} P</p>
          <p className="mt-2 text-[10px] text-neutral-400">
            {/* [LAMA] {points > 0 ? "Expires at 28 Dec 2026" : "No points yet"} */}
            {/* TODO schema v2: tampilkan formatDate(ov.pointsExpiresAt) */}
            {points > 0
              ? ov.pointsExpiresAt
                ? `Expires at ${formatDate(ov.pointsExpiresAt)}`
                : "Berlaku 3 bulan sejak diterima"
              : "No points yet"}
          </p>
        </div>

        <div className="rounded-xl bg-[#38383A] p-4 text-white">
          <p className="text-[11px] text-neutral-300">Coupons</p>
          {/* [LAMA] <p className="mt-1 text-xl font-bold">1</p> */}
          {/* [LAMA] <p className="mt-2 text-[10px] text-neutral-400">Valid until 28 Dec 2026</p> */}
          {/* TODO schema v2: ov.coupon terisi setelah kolom kupon ada */}
          <p className="mt-1 text-xl font-bold">{ov.coupon ? 1 : 0}</p>
          <p className="mt-2 text-[10px] text-neutral-400">
            {ov.coupon ? `Valid until ${formatDate(ov.coupon.expiresAt)}` : "No coupon yet"}
          </p>
        </div>

        <div className="rounded-xl bg-[#38383A] p-4 text-white">
          <p className="text-[11px] text-neutral-300">Upcoming Tickets</p>
          {/* [LAMA] {upcomingTicketsCount} */}
          <p className="mt-1 text-xl font-bold">{ov.upcomingTickets}</p>
          <p className="mt-2 text-[10px] text-neutral-400">
            {/* [LAMA] Next ticket 2 Nov 2026 */}
            {ov.nextTicketDate ? `Next ticket ${formatDate(ov.nextTicketDate)}` : "No upcoming event"}
          </p>
        </div>

        <div className="rounded-xl bg-[#38383A] p-4 text-white">
          <p className="text-[11px] text-neutral-300">Events attended</p>
          <p className="mt-1 text-xl font-bold">{eventsAttendedCount}</p>
          <p className="mt-2 text-[10px] text-amber-400">
            {pendingReviewsCount > 0
              ? `${pendingReviewsCount} event${pendingReviewsCount > 1 ? "s" : ""} need to review`
              : "All events already reviewed"}
          </p>
        </div>
      </div>

      {/* Recent Transactions & Invite Friends */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 pt-2">
        <div className="lg:col-span-2">
          <h3 className="mb-3 text-xs font-bold text-neutral-900">Recent Transactions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="border-b border-neutral-100 text-neutral-400">
                <tr>
                  <th className="pb-2 font-medium text-left">Event</th>
                  <th className="pb-2 font-medium text-center px-3">Qty</th>
                  <th className="pb-2 font-medium text-center px-3">Ticket</th>
                  <th className="pb-2 font-medium text-center px-3">Status</th>
                  <th className="pb-2 font-medium text-right">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50 text-neutral-600 align-top">
                {/* [BARU] empty state */}
                {ov.recentTransactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-neutral-400">
                      Belum ada transaksi.
                    </td>
                  </tr>
                )}
                {/* [LAMA] {transactions.map((trx) => ( */}
                {ov.recentTransactions.map((trx) => (
                  <tr key={trx.id}>
                    {/* [LAMA] {trx.title} */}
                    <td className="py-3 font-medium text-neutral-800 pr-4">{trx.event.title}</td>
                    {/* [LAMA] {trx.qty} */}
                    <td className="py-3 text-center px-3 whitespace-nowrap">x{trx.quantity}</td>
                    {/* [LAMA] {trx.ticketType} */}
                    {/* TODO schema v2: ganti "-" dengan trx.ticketType */}
                    <td className="py-3 text-center px-3 whitespace-nowrap">-</td>
                    <td
                      className={`py-3 text-center px-3 font-semibold whitespace-nowrap ${
                        // [LAMA] trx.status === "Waiting Payment" ... "Done"
                        trx.status === "WAITING_PAYMENT" || trx.status === "WAITING_CONFIRM"
                          ? "text-amber-500"
                          : trx.status === "DONE"
                          ? "text-emerald-600"
                          : "text-red-500"
                      }`}
                    >
                      {/* [LAMA] {trx.status} */}
                      {STATUS_LABEL[trx.status]}
                    </td>
                    <td className="py-3 text-right font-semibold text-neutral-900 whitespace-nowrap">
                      {/* [LAMA] {trx.price} */}
                      {formatRupiah(trx.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invite Friends */}
        <div className="flex flex-col justify-between rounded-xl border border-neutral-100 bg-neutral-50/50 p-4">
          <div>
            <h3 className="text-xs font-bold text-neutral-900">Invite Friends</h3>
            <p className="mt-1 text-[11px] text-neutral-500 leading-relaxed">
              Invite your friends to join Chistix and you&apos;ll get 10.000 Points
            </p>
            {/* [BARU] TODO schema v2: referredCount terisi setelah kolom referredBy ada */}
            {ov.referredCount > 0 && (
              <p className="mt-1 text-[11px] font-semibold text-emerald-600">
                Sudah dipakai {ov.referredCount} orang
              </p>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-lg border border-sky-200 bg-white p-2.5">
            {/* [LAMA] CHX-7K2P9 */}
            <span className="text-xs font-bold tracking-wider text-sky-500">{ov.referralCode}</span>
            <button
              onClick={handleCopy}
              className="rounded-md p-1 text-sky-500 hover:bg-sky-50 transition-colors"
              aria-label="Copy referral code"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Special events for you */}
      <div className="pt-2">
        <h3 className="mb-3 text-xs font-bold text-neutral-900">Special events for you</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="h-24 rounded-xl bg-neutral-200/80" />
          <div className="h-24 rounded-xl bg-neutral-200/80" />
          <div className="h-24 rounded-xl bg-neutral-200/80" />
        </div>
        <div className="mt-4 text-center">
          <button
            onClick={() => setActiveTab("events")}
            className="text-xs font-bold text-amber-500 hover:underline"
          >
            View All
          </button>
        </div>
      </div>

      {/* [LAMA] <UploadPaymentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} /> */}
    </div>
  );
}