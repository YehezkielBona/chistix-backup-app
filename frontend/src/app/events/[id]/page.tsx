import React from 'react';
import Navbar from '@/components/menubar/navbar';
import Footer from '@/components/menubar/footer';
import EventContent from '@/components/detailEvent/EventContent';
import { DUMMY_EVENTS } from '@/data/events';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EventDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const eventId = resolvedParams.id;
  const event = DUMMY_EVENTS.find((e) => String(e.id) === String(eventId));

  if (!event) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-between">
      <Navbar />
      <main className="flex-1">
        <EventContent event={event} />
      </main>
      <Footer />
    </div>
  );
}