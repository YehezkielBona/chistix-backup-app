import React from "react";
import { ChevronDownIcon, StarIcon } from "@heroicons/react/24/outline";

export interface EventFilterOption {
  id: string
  title: string
}

interface ReviewFiltersProps {
  selectedEvent: string;
  onEventChange: (event: string) => void;
  eventList: EventFilterOption[]
  activeStarFilter: number | null;
  onStarFilterChange: (star: number | null) => void;
}

export default function ReviewFilters({ 
  selectedEvent, onEventChange, eventList, activeStarFilter, onStarFilterChange }: ReviewFiltersProps) {
  const starTabs = [5, 4, 3, 2, 1];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
      <div className="relative">
        <select
          value={selectedEvent}
          onChange={(e) => onEventChange(e.target.value)}
          className="w-full sm:w-auto appearance-none bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs md:text-sm font-semibold py-2 pl-4 pr-9 rounded-full focus:outline-none focus:border-[#bb4d00] cursor-pointer"
        >
          <option value="ALL">All Events</option>
          {eventList.map((evt) => (
            <option key={evt.id} value={evt.id}>
              {evt.title}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => onStarFilterChange(null)}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            activeStarFilter === null ? "bg-[#fff5ed] text-[#bb4d00] border border-[#bb4d00]/40 shadow-2xs" : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
          }`}
        >
          All
        </button>

        {starTabs.map((star) => {
          const isActive = activeStarFilter === star;
          return (
            <button
              key={star}
              type="button"
              onClick={() => onStarFilterChange(star)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                isActive ? "bg-[#FFF5ED] text-[#BB4D00] border border-[#BB4D00]/40 shadow-2xs" : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
              }`}
            >
              <span>{star}</span>
              <StarIcon className="w-3.5 h-3.5 text-amber-400" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
