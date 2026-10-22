"use client";

import React, { useState } from "react";
import Sidebar from "@/components/sidebar/SidebarDashboard";
import ReviewSummaryCard from "@/components/dashboard/reviews/ReviewSummaryCard";
import ReviewFilters from "@/components/dashboard/reviews/ReviewFilters";
import ReviewCard from "@/components/dashboard/reviews/ReviewCard";
import { ReviewItem } from "@/types/review";
import Footer from "@/components/menubar/footer";
import NavbarOrganizer from "@/components/menubar/navbarOrganizer";

const INITIAL_REVIEWS: ReviewItem[] = [
  {
    id: "REV-001",
    eventId: "EVT-001",
    eventName: "Resonance Soundfest 2026: Intimate Live Performance",
    customerName: "Rian Pratama",
    customerEmail: "rian@email.com",
    ticketTier: "Presale Regular",
    rating: 5,
    comment:
      "The best intimate concert this year! Being able to hear my favorite musicians up close made the atmosphere feel so magical. Crystal clear sound and not overly noisy.",
    createdAt: "26 Dec 2026",
    organizerReply:
      "Thank you so much Rian! We are thrilled you enjoyed the intimate acoustic setup. See you at our next fest!",
    repliedAt: "27 Dec 2026",
  },
  {
    id: "REV-002",
    eventId: "EVT-001",
    eventName: "Resonance Soundfest 2026: Intimate Live Performance",
    customerName: "Dewi Lestari",
    customerEmail: "dewi@email.com",
    ticketTier: "Presale VIP",
    rating: 4,
    comment:
      "Great event concept with a warm atmosphere. The queue to enter at gate opening was a bit slow, but overall the artists' performances were phenomenal!",
    createdAt: "25 Dec 2026",
  },
  {
    id: "REV-003",
    eventId: "EVT-001",
    eventName: "Resonance Soundfest 2026: Intimate Live Performance",
    customerName: "Fajar Sidik",
    customerEmail: "fajar@email.com",
    ticketTier: "Normal Regular",
    rating: 5,
    comment:
      "Super satisfied! The venue was comfortable, and the audience capacity was capped so it didn't feel crowded at all. Will definitely buy tickets again next time.",
    createdAt: "24 Dec 2026",
  },
  {
    id: "REV-004",
    eventId: "EVT-002",
    eventName: "Night Symphony: Classic Meets Rock",
    customerName: "Budi Santoso",
    customerEmail: "budi@email.com",
    ticketTier: "VIP Gold",
    rating: 5,
    comment:
      "The orchestral arrangements mixed with electric rock guitars were completely unexpected. Getting goosebumps hearing classic tracks reimagined like that!",
    createdAt: "22 Dec 2026",
  },
  {
    id: "REV-005",
    eventId: "EVT-002",
    eventName: "Night Symphony: Classic Meets Rock",
    customerName: "Siti Rahma",
    customerEmail: "siti@email.com",
    ticketTier: "Regular Bronze",
    rating: 4,
    comment:
      "A unique musical experience. The blend of string instruments and rock drums meshed together brilliantly. The concert duration was just right, too.",
    createdAt: "21 Dec 2026",
  },
  {
    id: "REV-006",
    eventId: "EVT-002",
    eventName: "Night Symphony: Classic Meets Rock",
    customerName: "Michael Tan",
    customerEmail: "michael@email.com",
    ticketTier: "Platinum VIP Pass",
    rating: 5,
    comment:
      "Salute to the conductor and musicians! The sound was grandiose, even though I was initially skeptical that these genres could mix. Awesome!",
    createdAt: "20 Dec 2026",
  },
  {
    id: "REV-007",
    eventId: "EVT-003",
    eventName: "Indie Wave Fest: Sunset Beach Session",
    customerName: "Nadia Putri",
    customerEmail: "nadia@email.com",
    ticketTier: "General Admission",
    rating: 5,
    comment:
      "Beach vibes at sunset while listening to local indie bands play acoustic music... no words needed. Absolutely perfect for healing!",
    createdAt: "18 Jan 2027",
  },
  {
    id: "REV-008",
    eventId: "EVT-003",
    eventName: "Indie Wave Fest: Sunset Beach Session",
    customerName: "Dimas Anggara",
    customerEmail: "dimas@email.com",
    ticketTier: "VIP Sunset Lounge",
    rating: 3,
    comment:
      "The atmosphere and scenery were top-notch. It was just a bit disrupted by the strong beach winds, making the vocals hard to hear at times.",
    createdAt: "17 Jan 2027",
  },
];

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>(INITIAL_REVIEWS);
  const [selectedEvent, setSelectedEvent] = useState<string>("ALL");
  const [activeStarFilter, setActiveStarFilter] = useState<number | null>(null);

  const eventList = Array.from(new Set(reviews.map((r) => r.eventName)));

  const eventFilteredReviews = reviews.filter((r) =>
    selectedEvent === "ALL" ? true : r.eventName === selectedEvent
  );


  const totalReviews = eventFilteredReviews.length;
  const averageRating =
    totalReviews > 0
      ? eventFilteredReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

  const distribution = [5, 4, 3, 2, 1].map((star) => {
    const count = eventFilteredReviews.filter((r) => r.rating === star).length;
    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
    return { star, count, percentage };
  });


  const displayedReviews = eventFilteredReviews.filter((r) =>
    activeStarFilter === null ? true : r.rating === activeStarFilter
  );

  const handleAddReply = (reviewId: string, replyText: string) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? {
              ...r,
              organizerReply: replyText,
              repliedAt: "Just now",
            }
          : r
      )
    );
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-neutral-800 font-sans flex-col justify-between">
      <NavbarOrganizer />
      <div className="flex-1 w-full p-4 md:p-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 items-start">
        
        <Sidebar />

        <main className="flex-1 w-full bg-white rounded-2xl p-6 md:p-8 shadow-xs border border-neutral-100">
          
          <div className="mb-6">
            <h1 className="text-xl md:text-2xl font-bold text-neutral-900">
              Customer Reviews
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              Insights and feedback from attendees who joined your events
            </p>
          </div>

          <ReviewSummaryCard
            totalReviews={totalReviews}
            averageRating={averageRating}
            distribution={distribution}
          />

          <ReviewFilters
            selectedEvent={selectedEvent}
            onEventChange={(evt) => {
              setSelectedEvent(evt);
              setActiveStarFilter(null); // Reset filter bintang saat ganti event
            }}
            eventList={eventList}
            activeStarFilter={activeStarFilter}
            onStarFilterChange={setActiveStarFilter}
          />

          <div className="space-y-4">
            {displayedReviews.length === 0 ? (
              <div className="text-center py-14 text-neutral-400 text-sm bg-neutral-50 rounded-2xl border border-neutral-100">
                Belum ada review untuk kategori bintang ini.
              </div>
            ) : (
              displayedReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onAddReply={handleAddReply}
                />
              ))
            )}
          </div>

          <div className="pt-6 text-xs text-neutral-400">
            Showing {displayedReviews.length} of {totalReviews} reviews
          </div>

        </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}