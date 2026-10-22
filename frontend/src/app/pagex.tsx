"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma"; //cara ketika butuh query ke database (di Server Components atau API Routes) cukup impor ini
import Navbar from "@/components/menubar/navbar";
import Footer from "@/components/menubar/footer";
import EventSectionSlider from "@/components/home/EventSectionSlider";
import { DUMMY_EVENTS as events } from "@/data/events";

const heroSlides = [
  { id: 1, title: "RESONANCE", image: "/images/img-event-5-ls.jpg", href:"#" },
  {
    id: 2,
    title: "ELECTRONIC DANCE NIGHT",
    image: "/images/img-event-6-ls.jpg", href:"#"
  },
  { id: 3, title: "CLASSIC & ROCK", image: "/images/img-event-7-ls.jpg", href:"#" },
  { id: 4, title: "JAZZ EVENING", image: "/images/img-event-8-ls.jpg", href:"#" }
];

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showPopup, setShowPopup] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      setShowPopup(true);
      router.replace("/", { scroll: false });
    }
  }, [searchParams, router]);

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
     if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [isPaused]);

  // Filter Data Event
  const presaleEvents = events.slice(0, 4);
  const hotEvents = events.slice(0, 6);
  const popularEvents = events.slice(2, 8);

  return (
    <div className="min-h-screen text-neutral-900">
      <Navbar />
      <main className="container mx-auto max-w-8xl px-4 py-8 md:px-8">
        {/* 2. Hero Banner Carousel */}
        <section
          className="relative mb-10 overflow-hidden rounded-xl bg-slate-900 shadow-xl"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocus={() => setIsPaused(true)}
          onBlur={() => setIsPaused(false)}
        >
          <div className="relative h-65 w-full bg-cover sm:h-60 md:h-180">
            {heroSlides.map((slide, index) => (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  index === currentSlide ? "z-10 opacity-100" : "z-0 opacity-0"
                }`}
              >
                <Link href={slide.href} aria-label={`view ${slide.title}`} className="relative block h-full w-full" >
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  className="object-fill"
                  priority={index === 0}
                />
                </Link>
              </div>
            ))}

            {/* Indikator Carousel Dot */}
            <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
              {heroSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentSlide
                      ? "w-6 bg-amber-400"
                      : "w-2 bg-white/50"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* 3. Section Presale Event (Khusus tampilan dengan Tag Presale, Timer Ends At, & Progress Bar) */}
        <EventSectionSlider
          title="Presale Event"
          events={presaleEvents}
          isPresale={true}
        />

        {/* 4. Section Hot Event This Week (Tampilan Card Polos Sesuai Desain Acuan) */}
        <EventSectionSlider title="Hot Event This Week" events={hotEvents} />

        {/* 5. Section Popular Event (Tampilan Card Polos Sesuai Desain Acuan) */}
        <EventSectionSlider title="Popular Event" events={popularEvents} />

        {/* 6. Tombol "Lihat Lainnya" - Lonjong Sesuai Desain */}
        <div className="mt-12 flex justify-center">
          <button className="w-full max-w-xs sm:max-w-md rounded-full border-2 border-amber-400/80 bg-amber-50/20 py-3 text-center text-sm font-bold text-amber-500 transition hover:bg-amber-400 hover:text-white shadow-xs">
            Lihat Lainnya
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
