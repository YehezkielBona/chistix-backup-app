'use client';

// [LAMA] import React, { useState } from 'react';
import React, { useState, useEffect } from 'react'; // [BARU] + useEffect
import Image from 'next/image';
import { Star, ChevronRight, ChevronLeft } from 'lucide-react';
import { apiFetch } from '@/lib/api'; // [BARU]
import type { ApiReview, Paged } from '@/types/api'; // [BARU]

// [LAMA] review dummy, diganti review asli dari backend
// const DUMMY_REVIEWS = [
//   {
//     id: 1,
//     name: 'John Wokowow',
//     avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
//     rating: 5,
//     comment: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus dui convallis.',
//   },
//   {
//     id: 2,
//     name: 'Sarah Connor',
//     avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
//     rating: 5,
//     comment: 'Acara sangat luar biasa dan sangat teratur! Sound system dan pencahayaannya spektakuler. Pengalaman konser terbaik!',
//   },
//   {
//     id: 3,
//     name: 'Michael Chen',
//     avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
//     rating: 4,
//     comment: 'Penukaran tiket cepat dan tidak mengantre lama. Tempatnya nyaman dan pertunjukannya memuaskan.',
//   },
// ];

// [BARU] bintang terisi sesuai rating, sisanya kosong (selalu 5 bintang)
function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5 text-amber-400">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} fill={i < Math.round(rating) ? 'currentColor' : 'none'} />
      ))}
    </div>
  );
}

// [BARU] foto profil, atau inisial nama kalau user belum punya foto
function Avatar({ name, image }: { name: string; image: string | null }) {
  return (
    <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-amber-100 flex items-center justify-center">
      {image ? (
        // unoptimized: foto bisa dari Google/Cloudinary tanpa harus didaftarkan di next.config
        <Image src={image} alt={name} fill className="object-cover" unoptimized />
      ) : (
        <span className="text-sm font-bold text-amber-700">{name.charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
}

// [LAMA] export default function EventReviews() {
export default function EventReviews({ eventId }: { eventId: string }) {
  const [currentIdx, setCurrentIdx] = useState(0);

  // [BARU] data review dari backend
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [average, setAverage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false); // tombol "See More Reviews"

  useEffect(() => {
    setLoading(true);
    apiFetch<Paged<ApiReview> & { averageRating: number }>(`/api/events/${eventId}/reviews?limit=20`)
      .then((r) => {
        setReviews(r.data);
        setAverage(r.averageRating);
        setTotal(r.total);
        setCurrentIdx(0);
      })
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [eventId]);

  const nextReview = () => {
    // [LAMA] setCurrentIdx((prev) => (prev + 1) % DUMMY_REVIEWS.length);
    setCurrentIdx((prev) => (prev + 1) % reviews.length);
  };

  const prevReview = () => {
    // [LAMA] setCurrentIdx((prev) => (prev === 0 ? DUMMY_REVIEWS.length - 1 : prev - 1));
    setCurrentIdx((prev) => (prev === 0 ? reviews.length - 1 : prev - 1));
  };

  // [LAMA] const review = DUMMY_REVIEWS[currentIdx];
  const review = reviews[currentIdx];

  return (
    <div className="bg-[#F8F9FA] rounded-2xl p-5 border border-gray-200/80 shadow-sm space-y-4 max-w-[738px]">
      {/* [LAMA] <h3 className="text-sm font-bold text-gray-900">Reviews</h3> */}
      {/* [BARU] judul + rata-rata rating */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">Reviews</h3>
        {total > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Stars rating={average} />
            <span className="font-bold text-gray-800">{average.toFixed(1)}</span>
            <span>({total} review)</span>
          </div>
        )}
      </div>

      {/* [BARU] loading & empty state */}
      {loading && <div className="h-20 rounded-xl bg-white animate-pulse" />}
      {!loading && reviews.length === 0 && (
        <p className="bg-white p-4 rounded-xl border border-gray-100 text-xs text-gray-500">
          Belum ada review untuk event ini. Review bisa ditulis oleh pembeli setelah check-in di lokasi.
        </p>
      )}

      {/* Slider (satu review per tampilan) */}
      {!loading && review && !showAll && (
        <div className="relative bg-white p-4 rounded-xl border border-gray-100 flex items-start gap-4">
          {/* User Avatar */}
          {/* [LAMA]
          <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-200">
            <Image
              src={review.avatar}
              alt={review.name}
              fill
              className="object-cover"
            />
          </div>
          */}
          <Avatar name={review.user.name} image={review.user.image} />

          {/* Content Review */}
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              {/* [LAMA] {review.name} */}
              <h4 className="text-xs font-bold text-gray-900">{review.user.name}</h4>
              {/* [LAMA]
              <div className="flex items-center gap-0.5 text-amber-400">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <Star key={i} size={12} fill="currentColor" />
                ))}
              </div>
              */}
              <Stars rating={review.ratingScore} />
            </div>
            <p className="text-xs text-gray-600 leading-relaxed pt-1 pr-6">
              {/* [LAMA] {review.comment} */}
              {review.reviewDesc || 'Tidak ada ulasan tertulis.'}
            </p>
          </div>

          {/* Navigation Arrows (< >) */}
          {reviews.length > 1 && (
            <div className="flex items-center gap-1 self-center pl-1">
              <button
                type="button"
                onClick={prevReview}
                className="p-1 text-gray-400 hover:text-amber-600 transition cursor-pointer"
                aria-label="Previous Review"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={nextReview}
                className="p-1 text-gray-400 hover:text-amber-600 transition cursor-pointer"
                aria-label="Next Review"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* [BARU] mode "See More": semua review ditampilkan sebagai daftar */}
      {!loading && showAll && (
        <div className="space-y-2">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-start gap-4">
              <Avatar name={r.user.name} image={r.user.image} />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-900">{r.user.name}</h4>
                  <Stars rating={r.ratingScore} />
                </div>
                <p className="text-xs text-gray-600 leading-relaxed pt-1">{r.reviewDesc || 'Tidak ada ulasan tertulis.'}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {reviews.length > 1 && (
        <div className="text-right pt-1">
          {/* [LAMA] <button className="..."> See More Reviews ➔ </button> */}
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="text-[11px] font-bold text-gray-800 hover:text-amber-600 transition cursor-pointer"
          >
            {showAll ? 'Show Less ➔' : 'See More Reviews ➔'}
          </button>
        </div>
      )}
    </div>
  );
}