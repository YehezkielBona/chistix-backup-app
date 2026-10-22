'use client';

import React, { useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import EventCard from '@/components/EventCard';
import { EventItem } from '@/data/events';

interface EventSectionSliderProps {
  title: string;
  events: EventItem[];
  isPresale?: boolean;
}

export default function EventSectionSlider({
  title,
  events,
  isPresale = false,
}: EventSectionSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScrollRight = () => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      scrollRef.current.scrollTo({
        left: scrollLeft + clientWidth * 0.75,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="relative mb-12">
      {/* Container Presale Event */}
      <div
        className={
          isPresale
            ? 'relative overflow-hidden rounded-tl-[44px] rounded-bl-[36px] rounded-tr-xl rounded-br-xl bg-linear-to-r from-[#E67E00] via-[#FF9800]/50 to-transparent p-6 pb-8 shadow-xs'
            : ''
        }
      >
        {/* PERBAIKAN: Ketebalan font diturunkan dari font-black (900) menjadi font-bold (700) agar sesuai Figma */}
        <h2 className="mb-5 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
          {title}
        </h2>

        {/* SLIDER WRAPPER */}
        <div className="relative group overflow-hidden rounded-2xl">
          <div
            ref={scrollRef}
            className="grid grid-flow-col auto-cols-[calc(100%-20px)] sm:auto-cols-[calc(50%-12px)] md:auto-cols-[calc(33.333%-12px)] lg:auto-cols-[calc(25%-12px)] gap-4 overflow-x-auto pb-2 scroll-smooth no-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* {events.map((event) => (
              <EventCard key={event.id} event={event} isPresaleSection={isPresale} />
            ))} */}
          </div>

          {/* OVERLAY NAVIGATION SLIDER PANAH BAR DI KANAN */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-2 z-20 flex w-16 items-center justify-end bg-linear-to-l from-slate-900/60 via-slate-900/30 to-transparent pr-1">
            <button
              onClick={handleScrollRight}
              className="pointer-events-auto flex h-full w-10 items-center justify-center rounded-r-2xl bg-slate-900/50 text-white backdrop-blur-xs transition hover:bg-slate-900/80 active:scale-95"
              aria-label="Scroll Right"
            >
              <ChevronRight className="h-6 w-6 stroke-3" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}