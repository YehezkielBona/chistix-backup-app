import React, { useState } from "react";
import { ReviewItem } from "@/types/review";
import { StarIcon, UserCircleIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/solid";

interface ReviewCardProps {
  review: ReviewItem;
  onAddReply: (reviewId: string, replyText: string) => void;
}

export default function ReviewCard({ review, onAddReply }: ReviewCardProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onAddReply(review.id, replyText);
    setIsReplying(false);
    setReplyText("");
  };

  return (
    <div className="bg-white border border-neutral-100 rounded-2xl p-5 md:p-6 shadow-2xs hover:border-neutral-200 transition-all space-y-3.5">
      
      <div className="flex items-start justify-between gap-3">

        <div className="flex items-start gap-3">
          <UserCircleIcon className="w-10 h-10 text-neutral-300 shrink-0 mt-0.5" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-neutral-900 text-sm md:text-base">
                {review.customerName}
              </h3>
              {/* Badge Tiket Tier */}
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                {review.ticketTier}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5 font-medium">
              {review.eventName}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end shrink-0">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <StarIcon
                key={s}
                className={`w-4 h-4 ${
                  s <= review.rating ? "text-amber-400" : "text-neutral-200"
                }`}
              />
            ))}
          </div>
          <span className="text-[11px] text-neutral-400 mt-1">
            {review.createdAt}
          </span>
        </div>

      </div>

      <p className="text-xs md:text-sm text-neutral-700 leading-relaxed italic bg-neutral-50/60 p-3 rounded-xl border border-neutral-100">
        &ldquo;{review.comment}&rdquo;
      </p>

      {review.organizerReply && (
        <div className="ml-4 pl-4 border-l-2 border-[#BB4D00] bg-orange-50/40 p-3 rounded-r-xl text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#BB4D00]">Response from Organizer</span>
            <span className="text-[10px] text-neutral-400">{review.repliedAt}</span>
          </div>
          <p className="text-neutral-700">{review.organizerReply}</p>
        </div>
      )}

      {!review.organizerReply && !isReplying && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={() => setIsReplying(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-[#BB4D00] transition-colors cursor-pointer"
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4" />
            <span>Reply as Organizer</span>
          </button>
        </div>
      )}

      {isReplying && (
        <form onSubmit={handleSendReply} className="pt-2 space-y-2 animate-in fade-in duration-150">
          <textarea
            rows={2}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`Reply to ${review.customerName}...`}
            className="w-full text-xs md:text-sm p-3 border border-neutral-200 rounded-xl bg-white focus:outline-none focus:border-[#BB4D00] resize-none"
            required
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsReplying(false)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold text-neutral-500 hover:bg-neutral-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-full text-xs font-semibold text-white bg-[#EA580C] hover:bg-[#BB4D00] shadow-xs"
            >
              Send Reply
            </button>
          </div>
        </form>
      )}

    </div>
  );
}