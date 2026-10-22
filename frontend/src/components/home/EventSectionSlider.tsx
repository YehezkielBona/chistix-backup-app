'use client';

import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [showLeftButton, setShowLeftButton] = useState(false);

  const handleScrollCheck = () => {
    if (scrollRef.current) {
      const { scrollLeft } = scrollRef.current;
      setShowLeftButton(scrollLeft > 20);
    }
  };

  useEffect(() => {
    const currentRef = scrollRef.current;
    if (currentRef) {
      currentRef.addEventListener('scroll', handleScrollCheck);
      return () => currentRef.removeEventListener('scroll', handleScrollCheck);
    }
  }, []);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
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
            ? 'relative overflow-hidden rounded-tl-[44px] rounded-bl-[36px] rounded-tr-xl rounded-br-xl bg-gradient-to-r from-[#E67E00] via-[#FF9800]/50 to-transparent p-6 pb-8 shadow-xs'
            : ''
        }
      >
        <h2 className="mb-5 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
          {title}
        </h2>

        {/* SLIDER WRAPPER */}
        <div className="relative group overflow-hidden rounded-2xl">
          <div
            ref={scrollRef}
            className={`grid grid-flow-col gap-4 overflow-x-auto pb-2 scroll-smooth no-scrollbar ${
              isPresale
                /* PERBAIKAN: Lebar card presale dibuat lebih besar/horizontal sesuai desain */
                ? 'auto-cols-[calc(100%-20px)] sm:auto-cols-[calc(50%-12px)] lg:auto-cols-[calc(33.333%-12px)]'
                : 'auto-cols-[calc(100%-20px)] sm:auto-cols-[calc(50%-12px)] md:auto-cols-[calc(33.333%-12px)] lg:auto-cols-[calc(25%-12px)]'
            }`}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {events.map((event) => (
              <EventCard key={event.id} event={event} isPresaleSection={isPresale} />
            ))}
          </div>

          {/* TOMBOL KIRI (<) - Dibuat melayang halus tanpa background gelap pekat */}
          {showLeftButton && (
            <button
              onClick={() => handleScroll('left')}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-slate-800 shadow-md backdrop-blur-md transition hover:bg-white hover:scale-105 active:scale-95"
              aria-label="Scroll Left"
            >
              <ChevronLeft className="h-6 w-6 stroke-[2.5]" />
            </button>
          )}

          {/* TOMBOL KANAN (>) - Dibuat melayang halus di kanan */}
          <button
            onClick={() => handleScroll('right')}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-slate-800 shadow-md backdrop-blur-md transition hover:bg-white hover:scale-105 active:scale-95"
            aria-label="Scroll Right"
          >
            <ChevronRight className="h-6 w-6 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </section>
  );
}