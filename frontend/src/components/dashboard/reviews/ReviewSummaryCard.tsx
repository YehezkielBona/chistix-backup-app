import React from "react";
import { StarIcon } from "@heroicons/react/24/outline";

interface ReviewSummaryCardProps {
  totalReviews: number;
  averageRating: number;
  distribution: {
    star: number;
    count: number;
    percentage: number;
  }[];
}

export default function ReviewSummaryCard({ totalReviews, averageRating, distribution }: ReviewSummaryCardProps) {
  return (
    <div className="bg-white border border-neutral-100 rounded-2xl p-6 md:p-8 mb-6 shadow-2xs">
      <div className="flex flex-col md:flex-row items-center md:items-stretch gap-8">
        <div className="flex flex-col items-center justify-center md:border-r md:border-neutral-100 md:pr-10 shrink-0">
          <span className="text-5xl md:text-6xl font-black text-neutral-900 tracking-tight">{averageRating.toFixed(1).replace(".", ",")}</span>

          <div className="flex items-center gap-1 my-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <StarIcon key={s} className={`w-5 h-5 ${s <= Math.round(averageRating) ? "text-amber-400" : "text-neutral-200"}`} />
            ))}
          </div>

          <p className="text-xs text-neutral-400 font-medium">Based on {totalReviews} Reviews</p>
        </div>

        <div className="flex-1 w-full space-y-2.5">
          {distribution.map((item) => (
            <div key={item.star} className="flex items-center gap-3 text-xs">
              <span className="w-3 font-bold text-neutral-700 text-right">{item.star}</span>
              <StarIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />

              <div className="flex-1 h-3 bg-neutral-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#ea580c] rounded-full transition-all duration-500" style={{ width: `${item.percentage}%` }} />
              </div>

              <span className="w-10 text-neutral-500 font-medium text-right">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
