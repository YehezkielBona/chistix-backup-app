import React from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

export interface EventOption {
  id: string
  title: string
}

interface TransactionFiltersProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  selectedEvent: string;
  onEventChange: (event: string) => void;
  selectedDateRange: string;
  onDateRangeChange: (range: string) => void;
  eventsList: EventOption[]
}

export default function TransactionFilters({ activeTab, onTabChange, selectedEvent, onEventChange, selectedDateRange, onDateRangeChange, eventsList }: TransactionFiltersProps) {
  const tabs = [
    { id: "ALL", label: "All" },
    { id: "WATING_PAYMENT", label: "Waiting Payment" },
    { id: "WAITING_CONFIRM", label: "Waiting Confirm" },
    { id: "DONE", label: "Done" },
    { id: "REJECTED", label: "Rejected" },
    { id: "EXPIRED", label: "Expired" },
    { id: "CANCELED", label: "Canceled" },
  ];
  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-xl md:text-2xl font-bold text-neutral-900">Transactions</h1>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <select
              value={selectedEvent}
              onChange={(e) => onEventChange(e.target.value)}
              className="appearance-none bg-neutral-50 border border-neutral-200 text-neutral-700 text-xs md:text-sm font-medium py-2 pl-3 pr-9 rounded-full focus:outline-none focus:border-[#BB4D00] cursor-pointer"
            >
              <option value="ALL">All Event</option>
              {eventsList.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </select>
            <ChevronDownIcon className="w-4 h-4 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={selectedDateRange}
              onChange={(e) => onDateRangeChange(e.target.value)}
              className="appearance-none bg-neutral-50 border border-neutral-200 text-neutral-700 text-xs md:text-sm font-medium py-2 pl-3 pr-8 rounded-full focus:outline-none focus:border-[#BB4D00] cursor-pointer"
            >
              <option value="Last 30 Days">This Week</option>
              <option value="This Month">This Month</option>
              <option value="This Year">This Year</option>
            </select>
            <ChevronDownIcon className="w-4 h-4 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1 border-b border-neutral-100 pb-3">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all duration-150 cursor-pointer
                    ${isActive ? "bg-[#FFF5ED] text-[#BB4D00] border border-[#BB4D00]/40 font-semibold shadow-2xs" : "bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"}`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
