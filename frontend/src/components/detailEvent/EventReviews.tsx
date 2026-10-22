'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Star, ChevronRight, ChevronLeft } from 'lucide-react';

const DUMMY_REVIEWS = [
  {
    id: 1,
    name: 'John Wokowow',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    rating: 5,
    comment: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus dui convallis.',
  },
  {
    id: 2,
    name: 'Sarah Connor',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    rating: 5,
    comment: 'Acara sangat luar biasa dan sangat teratur! Sound system dan pencahayaannya spektakuler. Pengalaman konser terbaik!',
  },
  {
    id: 3,
    name: 'Michael Chen',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    rating: 4,
    comment: 'Penukaran tiket cepat dan tidak mengantre lama. Tempatnya nyaman dan pertunjukannya memuaskan.',
  },
];

export default function EventReviews() {
  const [currentIdx, setCurrentIdx] = useState(0);

  const nextReview = () => {
    setCurrentIdx((prev) => (prev + 1) % DUMMY_REVIEWS.length);
  };

  const prevReview = () => {
    setCurrentIdx((prev) => (prev === 0 ? DUMMY_REVIEWS.length - 1 : prev - 1));
  };

  const review = DUMMY_REVIEWS[currentIdx];

  return (
    <div className="bg-[#F8F9FA] rounded-2xl p-5 border border-gray-200/80 shadow-sm space-y-4 max-w-[738px]">
      <h3 className="text-sm font-bold text-gray-900">Reviews</h3>

      <div className="relative bg-white p-4 rounded-xl border border-gray-100 flex items-start gap-4">
        {/* User Avatar */}
        <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-200">
          <Image
            src={review.avatar}
            alt={review.name}
            fill
            className="object-cover"
          />
        </div>

        {/* Content Review */}
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-900">{review.name}</h4>
            <div className="flex items-center gap-0.5 text-amber-400">
              {Array.from({ length: review.rating }).map((_, i) => (
                <Star key={i} size={12} fill="currentColor" />
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed pt-1 pr-6">
            {review.comment}
          </p>
        </div>

        {/* Navigation Arrows (< >) */}
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
      </div>

      <div className="text-right pt-1">
        <button className="text-[11px] font-bold text-gray-800 hover:text-amber-600 transition cursor-pointer">
          See More Reviews ➔
        </button>
      </div>
    </div>
  );
}