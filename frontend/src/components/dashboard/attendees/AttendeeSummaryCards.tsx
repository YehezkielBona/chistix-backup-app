import React from "react";
import { UsersIcon, CheckBadgeIcon, ClockIcon } from "@heroicons/react/24/outline";

interface AttendeeSummaryCardsProps {
  totalRegistered: number;
  totalAttended: number;
  notYetArrived: number;
  totalRevenue?: number;
}

export default function AttendeeSummaryCards({
  totalRegistered,
  totalAttended,
  notYetArrived,
  totalRevenue = 0,
}: AttendeeSummaryCardsProps) {
  // Hitung persentase kehadiran secara aman (hindari pembagian dengan 0 jika belum ada peserta)
  const attendancePercentage =
    totalRegistered > 0 ? Math.round((totalAttended / totalRegistered) * 100) : 0;

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
      {/* PANEL UTAMA KIRI (7 Kolom): Ringkasan Total Peserta & Progres Kehadiran */}
      <div className="lg:col-span-7 bg-[#FAF8F4] border border-[#E6DED0] rounded-2xl p-5 md:p-6 flex flex-col justify-between">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#BB4D00]">
              <UsersIcon className="w-4 h-4 stroke-[2.2]" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Total Issued Tickets
              </span>
            </div>
            <div className="flex items-baseline gap-2.5 pt-1">
              <span className="text-3xl md:text-4xl font-extrabold text-neutral-900 tracking-tight">
                {totalRegistered}
              </span>
              <span className="text-xs md:text-sm font-medium text-neutral-500">
                registered tickets
              </span>
            </div>
          </div>

          <div className="bg-white border border-neutral-200/80 rounded-xl px-3.5 py-2 text-right">
            <span className="block text-[11px] font-medium text-neutral-400">
              Verified Ticket Value
            </span>
            <span className="text-sm md:text-base font-bold text-neutral-800">
              {formatRupiah(totalRevenue)}
            </span>
          </div>
        </div>

        {/* Bar Indikator Rasio Kehadiran (Check-in Progress) */}
        <div className="mt-5 pt-4 border-t border-[#E6DED0]/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-neutral-600">
              Gate Check-In Progress
            </span>
            <span className="font-bold text-[#BB4D00]">
              {attendancePercentage}% Checked In ({totalAttended} of {totalRegistered})
            </span>
          </div>
          <div className="w-full h-2.5 bg-neutral-200/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#EA580C] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, attendancePercentage))}%` }}
            />
          </div>
        </div>
      </div>

      {/* PANEL KANAN (5 Kolom): 2 Kartu Status Berdampingan (Attended vs Not Arrived) */}
      <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Kartu 1: Peserta Sudah Check-In (Attended) */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Attended
            </span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckBadgeIcon className="w-4 h-4" />
            </span>
          </div>

          <div className="my-3">
            <p className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight">
              {totalAttended}
            </p>
            <p className="text-xs text-neutral-500 mt-0.5 font-medium">
              Scanned at venue gate
            </p>
          </div>

          <div className="pt-2.5 border-t border-neutral-100 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-semibold text-emerald-700">
              Verified entry
            </span>
          </div>
        </div>

        {/* Kartu 2: Peserta Belum Datang (Not Yet Arrived) */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">
              Not Arrived
            </span>
            <span className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-[#BB4D00]">
              <ClockIcon className="w-4 h-4" />
            </span>
          </div>

          <div className="my-3">
            <p className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight">
              {notYetArrived}
            </p>
            <p className="text-xs text-neutral-500 mt-0.5 font-medium">
              Awaiting gate scan
            </p>
          </div>

          <div className="pt-2.5 border-t border-neutral-100 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-[11px] font-semibold text-neutral-600">
              Registered status
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
