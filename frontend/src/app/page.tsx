'use client';

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from 'next/link';
// import styles from "./page.module.css";

// PERINGATAN: Jangan import Prisma di komponen 'use client'. 
// Pindahkan query database ke Server Component atau ambil datanya via API/Server Action.
// import { prisma } from '@/lib/prisma'; 

import Navbar from "@/components/menubar/navbar";
import Footer from "@/components/menubar/footer";
import EventCard from '@/components/EventCard';
import { DUMMY_EVENTS } from '@/data/events';
import { ChevronRight, ChevronLeft } from 'lucide-react';

// Komponen utama dipisahkan agar useSearchParams bisa dibungkus dengan Suspense (Praktik terbaik Next.js)
function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showPopup, setShowPopup] = useState(false);
  const [currentBanner, setCurrentBanner] = useState(0);

  const presaleRef = useRef<HTMLDivElement>(null);
  const hotRef = useRef<HTMLDivElement>(null);
  const popularRef = useRef<HTMLDivElement>(null);

  const bannerImages = [
    {
      id: 1,
      url: '/images/img-event-2-ls.jpg',
      title: 'Electronic Dance Night: Neon Odyssey',
    },
    {
      id: 2,
      url: '/images/img-event-1-ls.jpg',
      title: 'Night Symphony: Classic Meets Rock',
    },
    {
      id: 3,
      url: '/images/img-event-3-ls.jpg',
      title: 'Jazz Evening at the Park',
    },
    {
      id: 4,
      url: '/images/img-event-4-ls.jpg',
      title: 'Indie Music Summit & Showcase',
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % bannerImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [bannerImages.length]);

  const presaleEvents = DUMMY_EVENTS.filter((item) => item.isPresale);
  const hotEvents = DUMMY_EVENTS.filter((item) => item.isHot);
  const popularEvents = DUMMY_EVENTS.filter((item) => item.isPopular);

  const handleScroll = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      setShowPopup(true);
      router.replace("/", { scroll: false });
    }
  }, [searchParams, router]);

  return (
    <div className="w-full space-y-10">
      {/* Jika showPopup true, Anda bisa memunculkan popup modal di sini */}
      {/* {showPopup && <YourPopupComponent />} */}

      {/* 1. Hero Banner Carousel */}
      <section className="relative w-full h-[380px] sm:h-[480px] md:h-[572px] rounded-[12px] overflow-hidden shadow-lg bg-gray-900">
        <div className="relative w-full h-full">
          <Image 
            src={bannerImages[currentBanner].url} 
            alt={bannerImages[currentBanner].title} 
            fill 
            className="object-cover transition-all duration-500" 
            priority 
          />
        </div>

        {/* Dots Indicator Carousel */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
          {bannerImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentBanner(index)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                currentBanner === index ? 'w-6 bg-amber-500' : 'w-2 bg-white/60'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* 2. Presale Event Section */}
      <section className="bg-gradient-to-r from-[#FF8A00] via-[#FFD085] to-[#FAF8F5] p-6 rounded-tl-[40px] rounded-tr-2xl rounded-bl-2xl rounded-br-2xl shadow-sm w-full">
        <h2 className="text-xl font-extrabold text-gray-900 mb-4">Presale Event</h2>
        <div className="relative overflow-hidden group">
          <div 
            ref={presaleRef}
            className="flex gap-4 overflow-x-auto w-full scroll-smooth flex-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-2"
          >
            {presaleEvents.map((event) => (
              <div key={event.id} className="flex-shrink-0">
                <EventCard variant="presale" event={event} />
              </div>
            ))}
          </div>

          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#FFE8C8] to-transparent pointer-events-none z-10" />

          <button 
            onClick={() => handleScroll(presaleRef, 'left')}
            className="absolute left-1 top-1/2 -translate-y-1/2 bg-white/90 shadow-md p-2 rounded-full border border-gray-200 text-gray-700 hover:bg-white z-20 cursor-pointer opacity-90 hover:opacity-100 transition"
            aria-label="Scroll left"
          >
            <ChevronLeft size={20} />
          </button>

          <button 
            onClick={() => handleScroll(presaleRef, 'right')}
            className="absolute right-1 top-1/2 -translate-y-1/2 bg-white/90 shadow-md p-2 rounded-full border border-gray-200 text-gray-700 hover:bg-white z-20 cursor-pointer opacity-90 hover:opacity-100 transition"
            aria-label="Scroll right"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </section>

      {/* 3. Hot Event This Week */}
      <section className="w-full">
        <h2 className="text-lg font-extrabold text-gray-900 mb-4">Hot Event This Week</h2>
        <div className="relative overflow-hidden group">
          <div 
            ref={hotRef}
            className="flex gap-4 overflow-x-auto w-full scroll-smooth flex-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-2"
          >
            {hotEvents.map((event) => (
              <div key={event.id} className="flex-shrink-0">
                <EventCard variant="standard" event={event} />
              </div>
            ))}
          </div>

          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#FAF8F5] to-transparent pointer-events-none z-10" />

          <button 
            onClick={() => handleScroll(hotRef, 'left')}
            className="absolute left-1 top-1/2 -translate-y-1/2 bg-white shadow-md p-2 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 z-20 cursor-pointer opacity-90 hover:opacity-100 transition"
            aria-label="Scroll left"
          >
            <ChevronLeft size={20} />
          </button>

          <button 
            onClick={() => handleScroll(hotRef, 'right')}
            className="absolute right-1 top-1/2 -translate-y-1/2 bg-white shadow-md p-2 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 z-20 cursor-pointer opacity-90 hover:opacity-100 transition"
            aria-label="Scroll right"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </section>

      {/* 4. Popular Event */}
      <section className="w-full">
        <h2 className="text-lg font-extrabold text-gray-900 mb-4">Popular Event</h2>
        <div className="relative overflow-hidden group">
          <div 
            ref={popularRef}
            className="flex gap-4 overflow-x-auto w-full scroll-smooth flex-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-2"
          >
            {popularEvents.map((event) => (
              <div key={event.id} className="flex-shrink-0">
                <EventCard variant="standard" event={event} />
              </div>
            ))}
          </div>

          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#FAF8F5] to-transparent pointer-events-none z-10" />

          <button 
            onClick={() => handleScroll(popularRef, 'left')}
            className="absolute left-1 top-1/2 -translate-y-1/2 bg-white shadow-md p-2 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 z-20 cursor-pointer opacity-90 hover:opacity-100 transition"
            aria-label="Scroll left"
          >
            <ChevronLeft size={20} />
          </button>

          <button 
            onClick={() => handleScroll(popularRef, 'right')}
            className="absolute right-1 top-1/2 -translate-y-1/2 bg-white shadow-md p-2 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 z-20 cursor-pointer opacity-90 hover:opacity-100 transition"
            aria-label="Scroll right"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </section>

      {/* 5. Tombol Lihat Lainnya */}
      <div className="flex justify-center pt-2">
        <Link 
          href="/events"
          className="w-full max-w-md py-3.5 border-2 border-amber-500 text-amber-600 font-bold rounded-full text-sm hover:bg-amber-50 transition shadow-sm text-center block cursor-pointer"
        >
          Lihat Lainnya
        </Link>
      </div>
    </div>
  );
}

// Wrapper komponen utama (Memperbaiki struktur Return dan menambahkan Suspense)
export default function Home() {
  return (
    <div>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {/* Next.js mewajibkan useSearchParams dibungkus dengan Suspense */}
        <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}>
          <HomeContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}