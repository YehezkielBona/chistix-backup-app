"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/sidebar/SidebarDashboard";
import ReviewSummaryCard from "@/components/dashboard/reviews/ReviewSummaryCard";
import ReviewFilters, {EventFilterOption} from "@/components/dashboard/reviews/ReviewFilters";
import ReviewCard from "@/components/dashboard/reviews/ReviewCard";
import { ReviewItem } from "@/types/review";
import Footer from "@/components/menubar/footer";
import NavbarOrganizer from "@/components/menubar/navbarOrganizer";
import Pagination from "@/components/dashboard/transactions/Pagination";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [eventsList, setEventsList] = useState<EventFilterOption[]>([]) 
  const [loading, setLoading] = useState<boolean>(true)

  const [selectedEvent, setSelectedEvent] = useState<string>("ALL");
  const [activeStarFilter, setActiveStarFilter] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1)
  const itemsPerPage = 5

  const fetchReviewsAndEvents = async () => {
    try {
      setLoading(true)
      const [resReviews, resEvents] = await Promise.all([
        fetch("/api/organizer/reviews"),
        fetch("/api/organizer/events")
      ])

      const jsonReviews = await resReviews.json()
      if (jsonReviews.success && Array.isArray(jsonReviews.data)) {
        setReviews(jsonReviews.data)
      }
      const jsonEvents = await resEvents.json()
      if (jsonEvents.success && Array.isArray(jsonEvents.data)) {
        setEventsList(
          jsonEvents.data.map((e: any) => ({
            id: String(e.id),
            title: String(e.title),
          }))
        )
      }

    } catch (err) {
      console.error("Failed load reviews:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviewsAndEvents()
  }, [])

  const eventFilteredReviews = reviews.filter((r) =>
    selectedEvent === "ALL" ? true : r.eventId === selectedEvent
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

  const starFilteredReviews = eventFilteredReviews.filter((r) =>
    activeStarFilter === null ? true : r.rating === activeStarFilter
  )

  const totalItems = starFilteredReviews.length
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1
  const paginatedReviews = starFilteredReviews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleAddReply = async (reviewId: string, replyText: string) => {
    const res = await fetch(`/api/organizer/reviews/${reviewId}/reply`, {
      method: "PATCH",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({replyText})
    })
    const json = await res.json()
    if(!res.ok) {
      throw new Error(json.message || "Failed to send reply.")
    }

    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? {
              ...r,
              organizerReply: replyText,
              repliedAt: new Date().toISOString(),
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
            onEventChange={(evtId) => {
              setSelectedEvent(evtId);
              setActiveStarFilter(null); // Reset filter bintang saat ganti event
              setCurrentPage(1)
            }}
            eventList={eventsList}
            activeStarFilter={activeStarFilter}
            onStarFilterChange={(star) => {
              setActiveStarFilter(star)
              setCurrentPage(1)
            }}
          />

          {loading ? (
            <div className="py-16 text-center text-neutral-400 text-sm">
              Loading reviews from Customer ...
            </div>
          ): (
            <div className="space-y-4">
              {paginatedReviews.length === 0 ? (
                <div className="text-center py-14 text-neutral-400 text-sm bg-neutral-50 rounded-2xl border border-neutral-100">
                  No Reviews yet for the selected category.
                </div>
              ): (
                paginatedReviews.map((review) => (
                  <ReviewCard 
                  key={review.id}
                  review={review}
                  onAddReply={handleAddReply}
                  />
                ))
              )}
            </div>
          )}

          <div className="mt-6">
            <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => setCurrentPage(page)}
            />
          </div>

        </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}