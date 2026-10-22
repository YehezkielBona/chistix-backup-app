"use client";

import React, { useState } from "react";
import { Star, CheckCircle2, Pencil, Trash2, X, Check, AlertTriangle } from "lucide-react";
import { AttendedEvent, ReviewItem } from "@/app/customer/dashboard/page";

export interface ReviewsTabProps {
  attendedEvents: AttendedEvent[];
  setAttendedEvents: React.Dispatch<React.SetStateAction<AttendedEvent[]>>;
  myReviews: ReviewItem[];
  setMyReviews: React.Dispatch<React.SetStateAction<ReviewItem[]>>;
}

export default function ReviewsTab({
  attendedEvents,
  setAttendedEvents,
  myReviews,
  setMyReviews,
}: ReviewsTabProps) {
  const [activeTab, setActiveTab] = useState<"need" | "my">("need");

  // State Form Review Baru
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // State Edit Review
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState<number>(0);
  const [editFeedback, setEditFeedback] = useState<string>("");

  // State Modal Konfirmasi Hapus Kustom
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<ReviewItem | null>(null);

  // Submit Review Baru
  const handleSubmit = (e: React.FormEvent, event: AttendedEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setSubmitted(true);

    const newReview: ReviewItem = {
      id: `rev-${Date.now()}`,
      eventId: event.id,
      title: event.title,
      ticketType: event.ticketType,
      rating: rating,
      feedback: reviewText,
      date: new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      imageUrl: event.imageUrl,
    };

    setTimeout(() => {
      setMyReviews((prev) => [newReview, ...prev]);
      setAttendedEvents((prev) => prev.filter((item) => item.id !== event.id));

      setSubmitted(false);
      setRating(0);
      setReviewText("");
      setSelectedEventId(null);

      setActiveTab("my");
    }, 1200);
  };

  // Mulai Edit Review
  const handleStartEdit = (review: ReviewItem) => {
    setEditingReviewId(review.id);
    setEditRating(review.rating);
    setEditFeedback(review.feedback);
  };

  // Simpan Edit
  const handleSaveEdit = (reviewId: string) => {
    setMyReviews((prev) =>
      prev.map((item) =>
        item.id === reviewId
          ? { ...item, rating: editRating, feedback: editFeedback }
          : item
      )
    );
    setEditingReviewId(null);
  };

  // Trigger Munculnya Modal Kustom saat tombol hapus diklik
  const promptDeleteReview = (review: ReviewItem) => {
    setReviewToDelete(review);
    setShowDeleteModal(true);
  };

  // Konfirmasi Penghapusan (Eksekusi setelah klik tombol "Hapus" di modal kustom)
  const confirmDeleteReview = () => {
    if (!reviewToDelete) return;

    const restoredEvent: AttendedEvent = {
      id: reviewToDelete.eventId,
      title: reviewToDelete.title,
      ticketType: reviewToDelete.ticketType || "Ticket Regular x1",
      attendedDate: reviewToDelete.date,
      imageUrl: reviewToDelete.imageUrl,
    };

    setAttendedEvents((prev) => [restoredEvent, ...prev]);
    setMyReviews((prev) => prev.filter((item) => item.id !== reviewToDelete.id));

    // Tutup modal
    setShowDeleteModal(false);
    setReviewToDelete(null);
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 relative">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Review</h1>
        <p className="mt-0.5 text-xs text-neutral-500">
          Share how your feelings at the experience
        </p>
      </div>

      {/* Buttons Navigation */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("need")}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
            activeTab === "need"
              ? "bg-amber-100 text-amber-600"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          }`}
        >
          Review Event
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("my")}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
            activeTab === "my"
              ? "bg-amber-100 text-amber-600"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          }`}
        >
          My Review
        </button>
      </div>

      {/* Tab 1: Review Event */}
      {activeTab === "need" ? (
        <div className="space-y-4">
          {attendedEvents.length === 0 ? (
            <div className="rounded-2xl border border-neutral-100 bg-white p-8 text-center text-xs text-neutral-500 shadow-xs">
              Tidak ada event yang perlu di-review saat ini.
            </div>
          ) : (
            attendedEvents.map((event) => (
              <div
                key={event.id}
                className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-xs"
              >
                {submitted && selectedEventId === event.id ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-3" />
                    <h3 className="text-sm font-bold text-neutral-900">Review Submitted!</h3>
                    <p className="text-xs text-neutral-500 mt-1">
                      Thank you for sharing your feedback.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-4 border-b border-neutral-100 pb-4">
                      <div className="h-14 w-14 overflow-hidden rounded-xl bg-neutral-100 flex-shrink-0">
                        <img
                          src={event.imageUrl}
                          alt={event.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-neutral-900">{event.title}</h3>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          {event.ticketType}
                        </p>
                        <p className="text-[10px] text-neutral-400 mt-0.5">
                          Attended at {event.attendedDate}
                        </p>
                      </div>
                    </div>

                    <form
                      onSubmit={(e) => {
                        setSelectedEventId(event.id);
                        handleSubmit(e, event);
                      }}
                      className="mt-5 space-y-5"
                    >
                      <div>
                        <label className="text-xs font-bold text-neutral-800">
                          How was it? <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-2 flex items-center gap-1.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => {
                                setSelectedEventId(event.id);
                                setRating(star);
                              }}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              className="p-1 focus:outline-none transition-transform hover:scale-110"
                            >
                              <Star
                                className={`h-6 w-6 ${
                                  star <=
                                  (selectedEventId === event.id ? hoverRating || rating : 0)
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-neutral-300"
                                }`}
                              />
                            </button>
                          ))}
                          <span className="ml-2 text-xs font-semibold text-neutral-600">
                            {selectedEventId === event.id && rating > 0 ? `${rating} / 5` : ""}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-neutral-800 block mb-1.5">
                          Feedback (Optional)
                        </label>
                        <textarea
                          rows={4}
                          maxLength={200}
                          value={selectedEventId === event.id ? reviewText : ""}
                          onChange={(e) => {
                            setSelectedEventId(event.id);
                            setReviewText(e.target.value);
                          }}
                          placeholder="Tell others what you liked or what could be better"
                          className="w-full rounded-xl border border-neutral-200 bg-white p-3 text-xs text-neutral-800 placeholder-neutral-400 focus:border-amber-500 focus:outline-none"
                        />
                        <div className="mt-1 text-right text-[10px] text-neutral-400">
                          {selectedEventId === event.id ? reviewText.length : 0}/200
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          disabled={selectedEventId !== event.id || rating === 0}
                          className="rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Submit Review
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        /* Tab 2: My Review */
        <div className="space-y-4">
          {myReviews.length === 0 ? (
            <div className="rounded-2xl border border-neutral-100 bg-white p-8 text-center text-xs text-neutral-500 shadow-xs">
              Belum ada review yang diberikan.
            </div>
          ) : (
            myReviews.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-xs space-y-4"
              >
                <div className="flex items-start justify-between border-b border-neutral-100 pb-4">
                  <div className="flex gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded-lg bg-neutral-100 flex-shrink-0">
                      <img
                        src={item.imageUrl}
                        alt="Event"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900">{item.title}</h4>

                      {editingReviewId === item.id ? (
                        <div className="flex items-center gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setEditRating(s)}
                              className="focus:outline-none"
                            >
                              <Star
                                className={`h-4 w-4 ${
                                  s <= editRating
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-neutral-200"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`h-3.5 w-3.5 ${
                                s <= item.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-neutral-200"
                              }`}
                            />
                          ))}
                          <span className="text-[10px] text-neutral-400 ml-1">
                            {item.rating}.0
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Icons */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-neutral-400 mr-1">{item.date}</span>
                    {editingReviewId === item.id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(item.id)}
                          title="Save Changes"
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingReviewId(null)}
                          title="Cancel"
                          className="p-1.5 text-neutral-400 hover:bg-neutral-100 rounded-lg transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(item)}
                          title="Edit Review"
                          className="p-1.5 text-neutral-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => promptDeleteReview(item)}
                          title="Delete Review"
                          className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {editingReviewId === item.id ? (
                  <div className="space-y-2">
                    <textarea
                      rows={3}
                      maxLength={200}
                      value={editFeedback}
                      onChange={(e) => setEditFeedback(e.target.value)}
                      className="w-full rounded-xl border border-neutral-200 bg-white p-2.5 text-xs text-neutral-800 focus:border-amber-500 focus:outline-none"
                    />
                    <div className="text-right text-[10px] text-neutral-400">
                      {editFeedback.length}/200
                    </div>
                  </div>
                ) : (
                  item.feedback && (
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      &ldquo;{item.feedback}&rdquo;
                    </p>
                  )
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal Kustom Konfirmasi Hapus */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-neutral-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Delete Review</h3>
              </div>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Are you sure you want to delete this review? The event will go back to the Event Review list.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteReview}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-red-700 transition-colors"
              >
                Yes, Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}