import React from 'react';
import Navbar from '@/components/menubar/navbar';
import Footer from '@/components/menubar/footer';
import EventContent from '@/components/detailEvent/EventContent';
// [LAMA] data dummy
// import { DUMMY_EVENTS } from '@/data/events';
import { notFound } from 'next/navigation';
import type { ApiEvent } from '@/types/api'; // [BARU]
import { toEventCard } from '@/lib/eventMapper'; // [BARU]

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

// [BARU] Ambil detail event dari backend (jalan di server Next.js)
async function getEvent(id: string): Promise<ApiEvent | null> {
  try {
    const res = await fetch(`${process.env.BACKEND_URL}/api/events/${id}`, { cache: 'no-store' });
    if (!res.ok) return null; // 404 dari backend: tidak ada, DRAFT, atau sudah dihapus
    const json = await res.json();
    return json.data as ApiEvent;
  } catch {
    return null; // backend mati -> tampilkan halaman not found
  }
}

export default async function EventDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const eventId = resolvedParams.id;
  // [LAMA]
  // const event = DUMMY_EVENTS.find((e) => String(e.id) === String(eventId));
  const apiEvent = await getEvent(eventId); // [BARU]

  // [LAMA] if (!event) {
  if (!apiEvent) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-between">
      <Navbar />
      <main className="flex-1">
        {/* [LAMA] <EventContent event={event} /> */}
        {/* [BARU] event = bentuk lama untuk tampilan, apiEvent = data lengkap dari backend */}
        <EventContent event={toEventCard(apiEvent)} apiEvent={apiEvent} />
      </main>
      <Footer />
    </div>
  );
}