'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { MapPin, ChevronLeft, ChevronRight, Star } from 'lucide-react'; // [BARU] + Star
import { EventItem } from '@/data/events';
import type { ApiEvent } from '@/types/api'; // [BARU]

interface EventHeaderInfoProps {
  event: EventItem;
  apiEvent?: ApiEvent; // [BARU] data lengkap dari backend (venue, organizer, rating)
}

// [BARU] label kategori (enum backend -> teks di UI)
const CATEGORY_LABEL: Record<string, string> = {
  MUSIC: 'Music',
  SEMINAR: 'Seminar',
  TALKSHOW: 'Talkshow',
  SPORTS: 'Sports',
  EXHIBITION: 'Exhibition',
};

// [BARU] format tanggal Indonesia, zona WIB
const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(iso));

const formatTime = (iso: string) =>
  new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).format(new Date(iso));

// [LAMA] export default function EventHeaderInfo({ event }: EventHeaderInfoProps) {
export default function EventHeaderInfo({ event, apiEvent }: EventHeaderInfoProps) {
  // [BARU] lokasi lengkap: nama venue + kota + provinsi
  const fullLocation = apiEvent
    ? `${apiEvent.venueDetail}, ${apiEvent.cityName}, ${apiEvent.provinceName}`
    : event.location;

  // [LAMA]
  // const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  //   event.location
  // )}`;
  // [BARU] pakai link maps dari organizer kalau ada, kalau tidak cari berdasarkan lokasi lengkap
  const googleMapsUrl =
    (apiEvent as (ApiEvent & { venueMaps?: string | null }) | undefined)?.venueMaps ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullLocation)}`;

  // Daftar gambar carousel poster event
  // [LAMA]
  // const posterImages = [
  //   event.landscapeImage || event.image,
  //   event.image,
  // ].filter(Boolean) as string[];
  // [BARU] semua cover image dari organizer + thumbnail, tanpa duplikat
  const posterImages = Array.from(
    new Set([...(apiEvent?.coverImages ?? []), event.landscapeImage, event.image].filter(Boolean) as string[]),
  );

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-slide carousel setiap 4 detik
  useEffect(() => {
    if (posterImages.length <= 1 || isHovered) return;

    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % posterImages.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [posterImages.length, isHovered]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % posterImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? posterImages.length - 1 : prev - 1));
  };

  // [BARU] tanggal: "19 Desember 2026 pukul 19.00 - 23.00"
  const dateLabel = apiEvent
    ? `${formatDateTime(apiEvent.startDate)} - ${formatTime(apiEvent.endDate)} WIB`
    : event.date || '19 Desember 2026';

  return (
    <div className="space-y-4 w-full">
      {/* Judul Utama Event */}
      <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 leading-tight">
        {event.title}
      </h1>

      {/* Banner Main Poster dengan Carousel Otomatis (Dimensi Figma: 738px x 412px, Radius 12px) */}
      <div 
        className="relative w-full max-w-[738px] h-[320px] md:h-[412px] rounded-[12px] overflow-hidden bg-gray-900 shadow-sm border border-gray-100 group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Image
          src={posterImages[currentImageIndex]}
          alt={event.title}
          fill
          className="object-cover transition-all duration-700 ease-in-out"
          priority
        />

        {/* Tombol Panah Navigasi Carousel Poster (Muncul saat hover) */}
        {posterImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevImage}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer z-10"
              aria-label="Previous Image"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={nextImage}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer z-10"
              aria-label="Next Image"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}

        {/* Dots Indicator / Carousel Bulatan di Bawah Tengah Poster */}
        {posterImages.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm z-10">
            {posterImages.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentImageIndex(index)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  currentImageIndex === index ? 'w-5 bg-amber-500' : 'w-1.5 bg-white/60'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Metadata Info Box */}
      <div className="bg-white rounded-xl border border-gray-200/80 p-4 divide-y divide-gray-100 text-xs w-full max-w-[738px]">
        <div className="grid grid-cols-12 py-2">
          <span className="col-span-3 font-semibold text-gray-500">Date</span>
          {/* [LAMA] {event.date || '19 Desember 2026'} */}
          <span className="col-span-9 font-bold text-gray-800">{dateLabel}</span>
        </div>

        <div className="grid grid-cols-12 py-2 items-center">
          <span className="col-span-3 font-semibold text-gray-500">Location</span>
          {/* [BARU] flex-wrap supaya rapi di layar HP */}
          <div className="col-span-9 flex flex-wrap items-center gap-2">
            {/* [LAMA] {event.location} */}
            <span className="font-bold text-amber-700">{fullLocation}</span>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full hover:bg-amber-100 transition cursor-pointer"
            >
              <MapPin size={10} />
              Open in Maps
            </a>
          </div>
        </div>

        <div className="grid grid-cols-12 py-2 items-center">
          <span className="col-span-3 font-semibold text-gray-500">Organizers</span>
          {/* [LAMA] <span className="col-span-9 font-bold text-amber-600">Nusantara Orchestra Productions</span> */}
          {/* [BARU] nama organizer asli + rata-rata rating (requirement: rating di profil organizer) */}
          <div className="col-span-9 flex flex-wrap items-center gap-2">
            <span className="font-bold text-amber-600">
              {apiEvent?.organizer?.name || event.organizer || 'Organizer'}
            </span>
            {apiEvent?.organizerRating && apiEvent.organizerRating.count > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] text-gray-600">
                <Star size={11} className="text-amber-400" fill="currentColor" />
                <span className="font-bold text-gray-800">{apiEvent.organizerRating.average.toFixed(1)}</span>
                ({apiEvent.organizerRating.count} review)
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-12 py-2">
          <span className="col-span-3 font-semibold text-gray-500">Category</span>
          {/* [LAMA] {event.category || 'Concert'} */}
          <span className="col-span-9 font-bold text-amber-600">
            {CATEGORY_LABEL[event.category ?? ''] || event.category || 'Concert'}
          </span>
        </div>
      </div>
    </div>
  );
}