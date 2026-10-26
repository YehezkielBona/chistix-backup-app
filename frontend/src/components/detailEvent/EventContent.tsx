'use client';

// [LAMA] import React, { useState } from 'react';
import React, { useState, useEffect } from 'react'; // [BARU] + useEffect
import EventHeaderInfo from './EventHeaderInfo';
import EventOrderSidebar from './EventOrderSidebar';
import EventReviews from './EventReviews';
import EventCard from '@/components/EventCard';
// [LAMA] import { EventItem, DUMMY_EVENTS } from '@/data/events';
import type { EventItem } from '@/data/events'; // [BARU]
import type { ApiEvent, Paged } from '@/types/api'; // [BARU]
import { apiFetch, buildQuery } from '@/lib/api'; // [BARU]
import { toEventCard } from '@/lib/eventMapper'; // [BARU]

interface EventContentProps {
  event: EventItem; // bentuk lama, dipakai tampilan (judul, gambar, dll.)
  apiEvent: ApiEvent; // [BARU] data lengkap dari backend (tier tiket, organizer, rating)
}

// [LAMA] export default function EventContent({ event }: EventContentProps) {
export default function EventContent({ event, apiEvent }: EventContentProps) {
  const [isReadMore, setIsReadMore] = useState(false);
  // [LAMA]
  // const similarEvents = DUMMY_EVENTS.filter((e) => String(e.id) !== String(event.id)).slice(0, 4);

  // [BARU] Similar events: event lain dengan kategori yang sama, diambil dari backend
  const [similarEvents, setSimilarEvents] = useState<EventItem[]>([]);
  useEffect(() => {
    const query = buildQuery({ category: apiEvent.category, limit: 5 });
    apiFetch<Paged<ApiEvent>>(`/api/events${query}`)
      .then((r) =>
        setSimilarEvents(
          r.data
            .filter((e) => e.id !== apiEvent.id) // buang event yang sedang dibuka
            .slice(0, 4)
            .map(toEventCard),
        ),
      )
      .catch(() => setSimilarEvents([]));
  }, [apiEvent.id, apiEvent.category]);

  return (
    <div className="max-w-[1025px] mx-auto px-4 py-8 w-full space-y-8">
      
      {/* Grid Utama (Kiri: Info, Deskripsi, Review | Kanan: Order Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Kolom Kiri */}
        <div className="lg:col-span-8 space-y-6">
          {/* [LAMA] <EventHeaderInfo event={event} /> */}
          <EventHeaderInfo event={event} apiEvent={apiEvent} />

          {/* Description & Terms Box */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm space-y-3 max-w-[738px]">
            <h3 className="text-sm font-bold text-gray-900">Description</h3>
            {/* [BARU] whitespace-pre-line: enter di deskripsi organizer tetap tampil */}
            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
              {event.description ||
                'A grand blend of classical orchestral grandeur and energetic rock hits from the 90s and 2000s, conducted by renowned maestros.'}
            </p>

            <h4 className="text-xs font-bold text-gray-900 pt-2">Terms & Conditions</h4>
            <div className={`text-xs text-gray-600 leading-relaxed transition-all ${!isReadMore ? 'line-clamp-2' : ''}`}>
              <p>1. Tiket yang sudah dibeli tidak dapat ditukarkan atau dikembalikan.</p>
              <p>2. Pengunjung wajib menunjukkan e-voucher resmi Chistix beserta kartu identitas berlaku.</p>
              <p>3. Dilarang membawa senjata tajam, obat-obatan terlarang, dan makanan dari luar.</p>
            </div>

            {/* Read More / Read Less diletakkan tepat di tengah (text-center) */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsReadMore(!isReadMore)}
                className="text-[11px] font-bold text-gray-400 hover:text-amber-600 transition cursor-pointer"
              >
                {isReadMore ? 'Read less' : 'Read more'}
              </button>
            </div>
          </div>

          {/* Section Reviews Slider */}
          {/* [LAMA] <EventReviews /> */}
          <EventReviews eventId={apiEvent.id} />
        </div>

        {/* Kolom Kanan */}
        <div className="lg:col-span-4 top-20 mt-12">
          {/* [LAMA] <EventOrderSidebar event={event} /> */}
          {/* [BARU] sidebar butuh data tier tiket dari backend */}
          <EventOrderSidebar event={apiEvent} />
        </div>

      </div>

      {/* Section Similar Event For You */}
      <div className="space-y-4 pt-4 border-t border-gray-200/60">
        <h3 className="text-sm font-bold text-gray-900">Similar Event For You</h3>
        {/* [BARU] empty state */}
        {similarEvents.length === 0 ? (
          <p className="text-xs text-gray-500">Belum ada event lain di kategori ini.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 justify-items-center">
            {similarEvents.map((simEvent) => (
              <EventCard key={simEvent.id} variant="standard" event={simEvent} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}