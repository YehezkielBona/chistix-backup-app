import React from "react";
import { AttendeeItem } from "@/types/attendee";
import { TicketIcon } from "@heroicons/react/24/outline";

interface AttendeeTableProps {
  attendees: AttendeeItem[];
}

export default function AttendeeTable({ attendees }: AttendeeTableProps) {
  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Fungsi memformat waktu ISO dari Database menjadi jam lokal yang rapi (contoh: 18:42 WIB, 26 Okt 2026)
  const formatCheckInTime = (timeString?: string | null) => {
    if (!timeString) return null;
    const dateObj = new Date(timeString);
    if (isNaN(dateObj.getTime())) return timeString;

    const timePart = new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })
      .format(dateObj)
      .replace(".", ":");

    const datePart = new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
    }).format(dateObj);

    return `${timePart} WIB (${datePart})`;
  };

  // Fungsi menentukan gaya visual badge berdasarkan tipe tiket dari Database (VIP, PRESALE, REGULAR)
  const getTierBadgeStyle = (tier: string) => {
    const normalized = String(tier).toUpperCase();
    if (normalized === "VIP") {
      return "bg-amber-50 text-[#BB4D00] border border-amber-200/80";
    }
    if (normalized === "PRESALE") {
      return "bg-orange-50/70 text-[#EA580C] border border-orange-200/70";
    }
    return "bg-neutral-100 text-neutral-700 border border-neutral-200";
  };

  if (attendees.length === 0) {
    return (
      <div className="border border-dashed border-neutral-200 rounded-2xl py-16 px-4 text-center bg-[#FAF8F4]/40 my-2">
        <TicketIcon className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
        <p className="text-sm font-semibold text-neutral-700">
          No attendees found matching your current filter
        </p>
        <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
          Attendees will automatically appear here once customer transactions are approved (status Done).
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-neutral-100 rounded-2xl">
      <table className="w-full text-left text-xs md:text-sm">
        <thead>
          <tr className="bg-[#FAF8F4] text-neutral-700 font-semibold border-b border-neutral-200/70">
            <th className="py-3.5 pl-4 pr-3">Ticket Code</th>
            <th className="py-3.5 px-3">Customer</th>
            <th className="py-3.5 px-3">Event & Tier</th>
            <th className="py-3.5 px-3 text-center">Qty</th>
            <th className="py-3.5 px-3 text-right">Amount Paid</th>
            <th className="py-3.5 pl-3 pr-4 text-center">Check-In Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 bg-white">
          {attendees.map((item) => {
            const formattedTime = formatCheckInTime(item.checkInTime);
            return (
              <tr
                key={item.id}
                className="hover:bg-[#FAF8F4]/50 transition-colors"
              >
                {/* Kolom 1: Kode Tiket Unik (Opsi A - Per E-Ticket) */}
                <td className="py-4 pl-4 pr-3 align-middle whitespace-nowrap">
                  <span className="font-mono text-xs font-bold text-neutral-800 bg-neutral-100 border border-neutral-200/80 px-2.5 py-1 rounded-lg">
                    {item.ticketCode}
                  </span>
                </td>

                {/* Kolom 2: Nama & Email Pembeli */}
                <td className="py-4 px-3 align-middle">
                  <p className="font-semibold text-neutral-900">
                    {item.customerName}
                  </p>
                  <p className="text-neutral-400 text-xs mt-0.5">
                    {item.email}
                  </p>
                </td>

                {/* Kolom 3: Judul Event & Kategori Tiket */}
                <td className="py-4 px-3 align-middle max-w-60">
                  <p
                    className="font-medium text-neutral-800 truncate"
                    title={item.eventName}
                  >
                    {item.eventName}
                  </p>
                  <div className="mt-1">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wide ${getTierBadgeStyle(
                        item.ticketTier
                      )}`}
                    >
                      {item.ticketTier}
                    </span>
                  </div>
                </td>

                {/* Kolom 4: Jumlah per Tiket */}
                <td className="py-4 px-3 align-middle text-center font-semibold text-neutral-700">
                  x{item.quantity}
                </td>

                {/* Kolom 5: Harga yang Dibayarkan */}
                <td className="py-4 px-3 align-middle font-bold text-right text-neutral-900 whitespace-nowrap">
                  {formatRupiah(item.totalPaid)}
                </td>

                {/* Kolom 6: Status Kehadiran & Waktu Scan QR */}
                <td className="py-4 pl-3 pr-4 align-middle text-center">
                  <div className="flex flex-col items-center justify-center">
                    {item.status === "ATTENDED" ? (
                      <>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Attended
                        </span>
                        {formattedTime && (
                          <span className="text-[11px] text-neutral-500 mt-1 font-medium whitespace-nowrap">
                            {formattedTime}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200">
                          Registered
                        </span>
                        <span className="text-[10px] text-neutral-400 mt-1">
                          Not yet scanned
                        </span>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
