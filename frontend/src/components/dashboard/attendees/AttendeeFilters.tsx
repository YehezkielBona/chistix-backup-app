import React, { ReactNode } from "react";
import Link from "next/link";
import { ChevronDownIcon, MagnifyingGlassIcon, ArrowDownTrayIcon, QrCodeIcon } from "@heroicons/react/24/outline";

interface AttendeeFiltersProps {
  selectedEvent: string;
  onEventChange: (eventTitle: string) => void;
  ticketTierFilter: string;
  onTicketTierChange: (tier: string) => void;
  statusTab: string;
  onStatusTabChange: (tab: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onExportCSV: () => void;
  children?: ReactNode;
}

export default function AttendeeFilters({ selectedEvent, onEventChange, ticketTierFilter, onTicketTierChange, statusTab, onStatusTabChange, searchQuery, onSearchChange, onExportCSV, children }: AttendeeFiltersProps) {
  const tabs = [
    { id: "ALL", label: "All" },
    { id: "ATTENDED", label: "Attended" },
    { id: "REGISTERED", label: "Registered" },
  ];

  return (
    <div className="space-y-5 mb-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-neutral-900">Attendee List</h1>
        <p className="text-xs text-neutral-400 mt-0.5">Search your event to know people who bought for this event</p>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xl">
          <select
            value={selectedEvent}
            onChange={(e) => onEventChange(e.target.value)}
            className="w-full appearance-none bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs md:text-sm font-semibold py-2.5 pl-4 pr-10 rounded-full focus:outline-none focus:border-[#BB4D00] cursor-pointer"
          >
            <option value="Resonance Soundfest 2026: Intimate Live Performance">Resonance Soundfest 2026: Intimate Live Performance</option>
            <option value="Night Symphony: Classic Meets Rock">Night Symphony: Classic Meets Rock</option>
            <option value="Jazz Evening at the Park">Jazz Evening at the Park</option>
          </select>
          <ChevronDownIcon className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs md:text-sm font-semibold border border-neutral-200 hover:bg-neutral-50 text-neutral-700 transition-colors cursor-pointer"
            title="Export CSV"
          >
            <ArrowDownTrayIcon className="w-4 h-4 text-neutral-500" />
            <span>Export CSV</span>
          </button>

          <Link href="/organizer/dashboard/scanner" className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs md:text-sm font-semibold bg-[#EA580C] hover:bg-[#BB4D00] text-white shadow-xs transition-colors cursor-pointer">
            <QrCodeIcon className="w-4 h-4" />
            <span>Scan QR</span>
          </Link>
        </div>
      </div>

      {children}

      <div className="space-y-2.5 pt-1">
        <div>
          <div className="relative inline-block">
            <select
              value={ticketTierFilter}
              onChange={(e) => onTicketTierChange(e.target.value)}
              className="appearance-none bg-white border border-neutral-200 text-neutral-700 text-xs font-semibold py-1.5 pl-3.5 pr-8 rounded-full focus:outline-none focus:border-[#BB4D00] cursor-pointer"
            >
              <option value="ALL">All tickets</option>
              <option value="Presale Regular">Presale Regular</option>
              <option value="Normal Regular">Normal Regular</option>
              <option value="Presale VIP">Presale VIP</option>
              <option value="VVIP">VVIP</option>
            </select>
            <ChevronDownIcon className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-1.5 shrink-0">
            {tabs.map((tab) => {
              const isActive = statusTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onStatusTabChange(tab.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    isActive ? "bg-[#FFF5ED] text-[#BB4D00] border border-[#BB4D00]/40 font-semibold shadow-2xs" : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="relative flex-1">
            <MagnifyingGlassIcon className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name or email"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs md:text-sm text-neutral-900 font-medium border border-neutral-200 rounded-full bg-white focus:outline-none focus:border-[#BB4D00] placeholder:text-neutral-400 shadow-2xs"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
