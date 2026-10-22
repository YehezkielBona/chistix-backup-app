import React from "react";
import { AttendeeItem } from "@/types/attendee";

interface AttendeeTableProps {
  attendees: AttendeeItem[];
}

export default function AttendeeTable({ attendees }: AttendeeTableProps) {
  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (attendees.length === 0) {
    return <div className="text-center py-14 text-neutral-400 text-sm">Cannot found any customers match.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs md:text-sm">
        <thead>
          <tr className="text-neutral-900 font-semibold border-b border-neutral-100">
            <td className="pb-3.5 pl-1">Customer</td>
            <td className="pb-3.5">Ticket</td>
            <td className="pb-3.5 px-6 text-center">Qty</td>
            <td className="pb-3.5 px-6 text-center">Total Paid</td>
            <td className="pb-3.5 text-center pr-2">Attendance</td>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {attendees.map((item) => (
            <tr key={item.id} className="hover:bg-neutral-50 transition-colors">
              <td className="py-4 pl-1 align-middle">
                <p className="font-semibold text-neutral-900">{item.customerName}</p>
                <p className="text-neutral-400 text-xs mt-0.5">{item.email}</p>
              </td>
              <td className="py-4 align-middle text-neutral-700 font-medium">{item.ticketTier}</td>
              <td className="py-4 px-6 align-middle text-center text-neutral-600 font-semibold">x{item.quantity}</td>
              <td className="py-4 px-6 align-middle font-semibold text-center text-neutral-900 whitespace-nowrap">{formatRupiah(item.totalPaid)}</td>
              <td className="py-4 pr-2 align-middle text-center">
                <div className="flex flex-col items-center justify-center">
                  {item.status === "ATTENDED" ? (
                    <>
                      <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-[#22C55E] text-white shadow-xs">Attended</span>
                      {item.checkInTime && <span className="text-[10px] text-blue-800 mt-1 font-medium">{item.checkInTime}</span>}
                    </>
                  ) : (
                    <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-[#71717A] text-white shadow-xs">Registered</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
