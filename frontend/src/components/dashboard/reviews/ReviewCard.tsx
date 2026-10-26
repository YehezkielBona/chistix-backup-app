import React, { useState } from "react";
import { ReviewItem } from "@/types/review";
import { StarIcon, UserCircleIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/solid";

interface ReviewCardProps {
  review: ReviewItem;
  onAddReply: (reviewId: string, replyText: string) => Promise<void>;
}

export default function ReviewCard({ review, onAddReply }: ReviewCardProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExpanded, setIsExpanded]= useState(false)

  const getInitials = (name: string) => {
    return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    if(!isNaN(d.getTime())) return dateStr
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(d)
  }

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || isSubmitting) return;
    try {
      setIsSubmitting(true)
      await onAddReply(review.id, replyText);
      setIsReplying(false);
      setReplyText("");
    } catch (err: any) {
      alert(err.message || "Failed to send reply")
    } finally {
      setIsSubmitting(false)
    }
  };

  const isLongComment = review.comment.length > 180
  const displayedComment = isLongComment && !isExpanded ? 
    `${review.comment.slice(0, 180)}...` : review.comment

  return (
    <div className="bg-white border border-neutral-100 rounded-2xl p-5 md:p-6 shadow-2xs hover:border-neutral-200 transition-all space-y-3.5">
      {/* Header Kartu: Avatar, Nama, Tier Tiket, Event, & Bintang */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {/* Avatar Customer: Foto Profil atau Inisial Huruf */}
          {review.customerAvatar ? (
            <img
              src={review.customerAvatar}
              alt={review.customerName}
              className="w-10 h-10 rounded-full object-cover border border-neutral-200 shrink-0 mt-0.5"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#FFF5ED] border border-[#BB4D00]/20 text-[#BB4D00] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              {getInitials(review.customerName)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-neutral-900 text-sm md:text-base">
                {review.customerName}
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 uppercase">
                {review.ticketTier}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5 font-medium">
              {review.eventName}
            </p>
          </div>
        </div>
        {/* Rating Bintang & Tanggal Ulasan */}
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
            {formatDate(review.createdAt)}
          </span>
        </div>
      </div>
      {/* Isi Teks Ulasan dengan Fitur "Read More" */}
      <div className="bg-neutral-50/70 p-3.5 rounded-xl border border-neutral-100 text-xs md:text-sm text-neutral-700 leading-relaxed italic">
        <p>&ldquo;{displayedComment}&rdquo;</p>
        {isLongComment && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-semibold text-[#BB4D00] hover:underline not-italic mt-1.5 cursor-pointer block"
          >
            {isExpanded ? "Show less" : "Read more"}
          </button>
        )}
      </div>
      {/* Bagian Balasan Organizer Jika Sudah Ada */}
      {review.organizerReply && (
        <div className="ml-4 pl-4 border-l-2 border-[#BB4D00] bg-[#FFF5ED]/50 p-3 rounded-r-xl text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#BB4D00]">Response from Organizer</span>
            <span className="text-[10px] text-neutral-400">
              {review.repliedAt ? formatDate(review.repliedAt) : "Just now"}
            </span>
          </div>
          <p className="text-neutral-700 leading-normal">{review.organizerReply}</p>
        </div>
      )}
      {/* Tombol Buka Form Balasan Jika Belum Dibalas */}
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
      {/* Form Input Balasan Organizer */}
      {isReplying && (
        <form onSubmit={handleSendReply} className="pt-2 space-y-2">
          <textarea
            rows={2}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`Reply to ${review.customerName}...`}
            disabled={isSubmitting}
            className="w-full text-xs md:text-sm p-3 border border-neutral-200 rounded-xl bg-white focus:outline-none focus:border-[#BB4D00] resize-none"
            required
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setIsReplying(false);
                setReplyText("");
              }}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-neutral-500 hover:bg-neutral-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-full text-xs font-semibold text-white bg-[#EA580C] hover:bg-[#BB4D00] transition cursor-pointer shadow-2xs disabled:opacity-50"
            >
              {isSubmitting ? "Sending..." : "Send Reply"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}