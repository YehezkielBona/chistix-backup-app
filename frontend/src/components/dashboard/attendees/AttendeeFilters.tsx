import React, { ReactNode } from "react";
import Link from "next/link";
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  QrCodeIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";

export interface EventFilterOption {
  id: string;
  title: string;
}

interface AttendeeFiltersProps {
  selectedEvent: string;
  onEventChange: (eventId: string) => void;
  eventsList: EventFilterOption[];
  ticketTierFilter: string;
  onTicketTierChange: (tier: string) => void;
  statusTab: string;
  onStatusTabChange: (tab: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onExportCSV: () => void;
  children?: ReactNode;
}

export default function AttendeeFilters({
  selectedEvent,
  onEventChange,
  eventsList,
  ticketTierFilter,
  onTicketTierChange,
  statusTab,
  onStatusTabChange,
  searchQuery,
  onSearchChange,
  onExportCSV,
  children,
}: AttendeeFiltersProps) {
  // Daftar Tab Status Kehadiran
  const tabs = [
    { id: "ALL", label: "All Attendees" },
    { id: "ATTENDED", label: "Attended" },
    { id: "REGISTERED", label: "Registered (Not Arrived)" },
  ];

  // Daftar Kategori Tiket yang disesuaikan 100% dengan Enum TicketType di Prisma Database
  const ticketTierOptions = [
    { value: "ALL", label: "All Ticket Tiers" },
    { value: "PRESALE", label: "Presale" },
    { value: "REGULAR", label: "Regular" },
    { value: "VIP", label: "VIP" },
  ];

  return (
    <div className="space-y-6 mb-6">
      {/* BARIS 1: Judul Halaman & Tombol Aksi Utama (Export CSV + Scan QR) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-neutral-100">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-neutral-900">
            Attendee & Check-In List
          </h1>
          <p className="text-xs md:text-sm text-neutral-500 mt-1">
            Monitor issued e-tickets, customer details, and real-time gate check-in status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onExportCSV}
            className="h-10 flex items-center gap-2 px-4 rounded-xl text-xs md:text-sm font-semibold border border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-300 text-neutral-700 transition-all cursor-pointer shadow-2xs"
            title="Download filtered attendees as CSV"
          >
            <ArrowDownTrayIcon className="w-4 h-4 text-neutral-500 stroke-[2]" />
            <span>Export CSV</span>
          </button>

          <Link
            href={
              selectedEvent && selectedEvent !== "ALL"
                ? `/organizer/dashboard/scanner?eventId=${encodeURIComponent(selectedEvent)}`
                : "/organizer/dashboard/scanner"
            }
            className="h-10 flex items-center gap-2 px-4 rounded-xl text-xs md:text-sm font-semibold bg-[#EA580C] hover:bg-[#BB4D00] text-white shadow-xs transition-all cursor-pointer"
          >
            <QrCodeIcon className="w-4 h-4 stroke-[2]" />
            <span>Open QR Scanner</span>
          </Link>
        </div>
      </div>

      {/* BARIS 2: Pemilih Event (Terkoneksi dengan Event di Database) */}
      <div className="bg-[#FAF8F4]/70 border border-neutral-200/80 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs md:text-sm font-semibold text-neutral-700 pl-1">
          <FunnelIcon className="w-4 h-4 text-[#BB4D00]" />
          <span>Select Active Event:</span>
        </div>

        <div className="relative flex-1 max-w-xl">
          <select
            value={selectedEvent}
            onChange={(e) => onEventChange(e.target.value)}
            className="w-full h-10 appearance-none bg-white border border-neutral-200 text-neutral-800 text-xs md:text-sm font-semibold pl-4 pr-10 rounded-xl focus:outline-none focus:border-[#BB4D00] cursor-pointer shadow-2xs truncate"
          >
            <option value="ALL">All Organizer Events</option>
            {eventsList.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="w-4 h-4 text-neutral-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* SLOT TENGAH: Tempat merender AttendeeSummaryCards */}
      {children}

      {/* BARIS 3: Toolbar Filter Status, Filter Kategori Tiket (Sesuai DB), & Pencarian */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2">
        {/* Pil Filter Status Kehadiran */}
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((tab) => {
            const isActive = statusTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onStatusTabChange(tab.id)}
                className={`h-10 px-4 rounded-xl text-xs md:text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#FFF5ED] text-[#BB4D00] border border-[#BB4D00]/40 font-semibold shadow-2xs"
                    : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Grup Kanan: Dropdown Kategori Tiket & Kotak Pencarian */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 lg:max-w-md justify-end">
          {/* Dropdown Kategori Tiket (ALL, PRESALE, REGULAR, VIP) */}
          <div className="relative shrink-0">
            <select
              value={ticketTierFilter}
              onChange={(e) => onTicketTierChange(e.target.value)}
              className="w-full sm:w-44 h-10 appearance-none bg-white border border-neutral-200 text-neutral-700 text-xs md:text-sm font-semibold pl-3.5 pr-9 rounded-xl focus:outline-none focus:border-[#BB4D00] cursor-pointer shadow-2xs"
            >
              {ticketTierOptions.map((tier) => (
                <option key={tier.value} value={tier.value}>
                  {tier.label}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Input Search (Nama, Email, atau Kode Tiket) */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search name, email, or ticket code..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full h-10 pl-9 pr-4 text-xs md:text-sm text-neutral-900 font-medium border border-neutral-200 rounded-xl bg-white focus:outline-none focus:border-[#BB4D00] placeholder:text-neutral-400 shadow-2xs"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
