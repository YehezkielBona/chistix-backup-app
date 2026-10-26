import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";
import type { CreateReviewInput, UpdateReviewInput, ReviewPageQuery } from "../middlewares/review.middleware.js";

// ================= CUSTOMER REVIEWS (MUTI) =================

// Syarat boleh review: punya e-ticket yang sudah check-in (isAttended = true)
// dari transaksi DONE miliknya sendiri.
function attendedTicketWhere(userId: string, eventId?: string): Prisma.ETicketWhereInput {
    return {
        isAttended: true,
        deletedAt: null,
        transaction: { userId, status: "DONE", deletedAt: null, ...(eventId ? { eventId } : {}) },
    };
}

const myReviewInclude = {
    event: { select: { id: true, title: true, thumbnailImage: true } },
} satisfies Prisma.ReviewInclude;

function hideFakeReplyAt<T extends { orgReply: string | null; orgReplyAt: Date | null }>(r: T) {
    return { ...r, orgReplyAt: r.orgReply ? r.orgReplyAt : null };
}

// GET /api/reviews/pending : event yang sudah dihadiri tapi belum direview
export async function getPendingReviewsService(userId: string) {
    const [tickets, reviewed] = await Promise.all([
        prisma.eTicket.findMany({
            where: attendedTicketWhere(userId),
            orderBy: { updatedAt: "desc" },
            select: {
                attendedAt: true,
                transaction: {
                    select: { event: { select: { id: true, title: true, thumbnailImage: true, startDate: true } } },
                },
            },
        }),
        prisma.review.findMany({ where: { userId, deletedAt: null }, select: { eventId: true } }),
    ]);

    const reviewedIds = new Set(reviewed.map((r) => r.eventId));
    const byEvent = new Map<string, {
        eventId: string; title: string; thumbnailImage: string; startDate: Date;
        attendedAt: Date | null; ticketCount: number;
    }>();

    for (const t of tickets) {
        const ev = t.transaction.event;
        if (reviewedIds.has(ev.id)) continue;
        const current = byEvent.get(ev.id);
        if (current) current.ticketCount += 1;
        else byEvent.set(ev.id, {
            eventId: ev.id, title: ev.title, thumbnailImage: ev.thumbnailImage, startDate: ev.startDate,
            attendedAt: t.attendedAt, ticketCount: 1,
        });
    }
    return [...byEvent.values()];
}

// GET /api/reviews/me
export async function getMyReviewsService(userId: string, q: ReviewPageQuery) {
    const where: Prisma.ReviewWhereInput = { userId, deletedAt: null };
    const [rows, total] = await Promise.all([
        prisma.review.findMany({
            where, orderBy: { reviewCustomerAt: "desc" },
            skip: (q.page - 1) * q.limit, take: q.limit,
            include: myReviewInclude,
        }),
        prisma.review.count({ where }),
    ]);
    return {
        data: rows.map(hideFakeReplyAt),
        total, page: q.page, limit: q.limit,
        totalPages: Math.max(1, Math.ceil(total / q.limit)),
    };
}

// POST /api/reviews
export async function createReviewService(userId: string, input: CreateReviewInput) {
    const created = await prisma.$transaction(async (tx) => {
        const ticket = await tx.eTicket.findFirst({
            where: attendedTicketWhere(userId, input.eventId),
            select: { id: true },
        });
        if (!ticket) {
            throw new AppError(403, "Review hanya bisa diberikan untuk event yang sudah kamu hadiri");
        }

        const existing = await tx.review.findFirst({
            where: { userId, eventId: input.eventId, deletedAt: null },
            select: { id: true },
        });
        if (existing) throw new AppError(409, "Kamu sudah memberi review untuk event ini");

        const now = new Date();
        return tx.review.create({
            data: {
                eventId: input.eventId,
                userId,
                eTicketId: ticket.id,
                ratingScore: input.ratingScore,
                reviewDesc: input.reviewDesc || null,
                reviewCustomerAt: now,
                orgReplyAt: now,
            },
            include: myReviewInclude,
        });
    });
    return hideFakeReplyAt(created);
}

// PATCH /api/reviews/:id
export async function updateReviewService(userId: string, reviewId: string, input: UpdateReviewInput) {
    const owned = await prisma.review.findFirst({
        where: { id: reviewId, userId, deletedAt: null },
        select: { id: true },
    });
    if (!owned) throw new AppError(404, "Review tidak ditemukan");

    const updated = await prisma.review.update({
        where: { id: reviewId },
        data: {
            ...(input.ratingScore !== undefined ? { ratingScore: input.ratingScore } : {}),
            ...(input.reviewDesc !== undefined ? { reviewDesc: input.reviewDesc || null } : {}),
        },
        include: myReviewInclude,
    });
    return hideFakeReplyAt(updated);
}

// DELETE /api/reviews/:id
export async function deleteReviewService(userId: string, reviewId: string) {
    const result = await prisma.review.updateMany({
        where: { id: reviewId, userId, deletedAt: null },
        data: { deletedAt: new Date() },
    });
    if (result.count === 0) throw new AppError(404, "Review tidak ditemukan");
    return { id: reviewId };
}

// GET /api/events/:id/reviews (publik)
export async function getEventReviewsService(eventId: string, q: ReviewPageQuery) {
    const where: Prisma.ReviewWhereInput = { eventId, deletedAt: null };
    const [rows, total, agg] = await Promise.all([
        prisma.review.findMany({
            where, orderBy: { reviewCustomerAt: "desc" },
            skip: (q.page - 1) * q.limit, take: q.limit,
            select: {
                id: true, ratingScore: true, reviewDesc: true, reviewCustomerAt: true,
                orgReply: true, orgReplyAt: true,
                user: { select: { name: true, image: true } },
            },
        }),
        prisma.review.count({ where }),
        prisma.review.aggregate({ where, _avg: { ratingScore: true } }),
    ]);
    return {
        data: rows.map(hideFakeReplyAt),
        total, page: q.page, limit: q.limit,
        totalPages: Math.max(1, Math.ceil(total / q.limit)),
        averageRating: Math.round((agg._avg.ratingScore ?? 0) * 10) / 10,
    };
}


// ================= ORGANIZER REVIEWS (KIEL) =================

export async function getOrganizerReviewService(organizerId?: string) {
  const reviews = await prisma.review.findMany({
    where: {
      deletedAt: null,
      ...(organizerId
        ? {
            event: {
              organizerId: organizerId,
              deletedAt: null,
            },
          }
        : {}),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      event: {
        select: {
          id: true,
          title: true,
        },
      },
      eTicket: {
        include: {
          transaction: {
            select: {
              ticketType: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return reviews.map((rev) => ({
    id: rev.id,
    eventId: rev.eventId,
    eventName: rev.event?.title || "Untitled Event",
    customerName: rev.user?.name || "Customer",
    customerEmail: rev.user?.email || "-",
    customerAvatar: rev.user?.image || null,
    ticketTier: rev.eTicket?.transaction?.ticketType || "Regular",
    rating: rev.ratingScore,
    comment: rev.reviewDesc || "",
    createdAt: rev.reviewCustomerAt ? rev.reviewCustomerAt.toISOString() : rev.createdAt.toISOString(),
    organizerReply: rev.orgReply || null,
    repliedAt: rev.orgReplyAt ? rev.orgReplyAt.toISOString() : null,
  }));
}

export async function replyOrganierReviewService(
    reviewId: string,
    replyText: string,
    organizerId?: string
) {
    const cleanReply = replyText.trim();
    if (!cleanReply) {
        throw new Error("Reply text cannot empty");
    }

    const review = await prisma.review.findUnique({
        where: { id: reviewId },
        include: { event: true }
    });
    if (!review) {
        throw new Error("Reviews cannot found");
    }

    if (organizerId && review.event.organizerId !== organizerId) {
        throw new Error("You dont have access to reply this reviews for this event!");
    }

    const updatedReview = await prisma.review.update({
        where: { id: reviewId },
        data: {
            orgReply: cleanReply,
            orgReplyAt: new Date()
        }
    });
    return updatedReview;
}