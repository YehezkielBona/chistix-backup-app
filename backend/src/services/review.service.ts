import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";
import type { CreateReviewInput, UpdateReviewInput, ReviewPageQuery } from "../middlewares/review.middleware.js";

// Syarat boleh review: punya e-ticket yang sudah check-in (isAttended = true)
// dari transaksi DONE miliknya sendiri.
// isAttended nanti diisi scanner organizer; untuk testing diubah manual di Prisma Studio.
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

// TODO schema v2: orgReplyAt jadi opsional. Sekarang kolomnya wajib, jadi saat review dibuat
// diisi sementara dengan waktu yang sama. Status "sudah dibalas" dilihat dari orgReply.
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

    // satu baris per event (beli 2 tiket tetap 1 review)
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
                orgReplyAt: now, // TODO schema v2: hapus baris ini setelah orgReplyAt jadi DateTime?
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

// DELETE /api/reviews/:id (soft delete: event kembali ke daftar "perlu direview")
export async function deleteReviewService(userId: string, reviewId: string) {
    const result = await prisma.review.updateMany({
        where: { id: reviewId, userId, deletedAt: null },
        data: { deletedAt: new Date() },
    });
    if (result.count === 0) throw new AppError(404, "Review tidak ditemukan");
    return { id: reviewId };
}

// GET /api/events/:id/reviews (publik, halaman detail event)
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
        averageRating: Math.round((agg._avg.ratingScore ?? 0) * 10) / 10, // 1 angka di belakang koma
    };
}