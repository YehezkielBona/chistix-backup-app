import { prisma } from "../lib/prisma.js";
import { generateReferralCode } from "./referral.service.js";

const userSelect = { name: true, referralCode: true, points: true } as const;

// GET /api/customer/overview : semua data untuk tab Overview
export async function customerOverviewService(userId: string) {
    const now = new Date();

    let user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: userSelect });

    // User lama (dibuat sebelum hook referral ada) belum punya kode: buatkan sekali
    if (!user.referralCode) {
        user = await prisma.user.update({
            where: { id: userId },
            data: { referralCode: await generateReferralCode() },
            select: userSelect,
        });
    }

    const [upcomingTickets, nextTicket, attended, reviewed, pendingPayment, recentTransactions] =
        await Promise.all([
            // Tiket yang sudah DONE, belum dipakai, event-nya belum selesai
            prisma.eTicket.count({
                where: {
                    deletedAt: null,
                    isAttended: false,
                    transaction: { userId, status: "DONE", event: { endDate: { gte: now } } },
                },
            }),
            // Event terdekat yang tiketnya sudah dimiliki
            prisma.transaction.findFirst({
                where: { userId, status: "DONE", event: { startDate: { gte: now } } },
                orderBy: { event: { startDate: "asc" } },
                select: { event: { select: { startDate: true } } },
            }),
            // Event yang sudah dihadiri (minimal 1 tiket check-in)
            prisma.transaction.findMany({
                where: { userId, status: "DONE", eTickets: { some: { isAttended: true } } },
                distinct: ["eventId"],
                select: { eventId: true },
            }),
            // Event yang sudah direview
            prisma.review.findMany({ where: { userId, deletedAt: null }, select: { eventId: true } }),
            // Transaksi yang menunggu pembayaran dengan deadline terdekat (untuk banner)
            prisma.transaction.findFirst({
                where: { userId, deletedAt: null, status: "WAITING_PAYMENT", paymentDeadline: { gt: now } },
                orderBy: { paymentDeadline: "asc" },
                select: {
                    id: true,
                    quantity: true,
                    totalPrice: true,
                    paymentDeadline: true,
                    event: { select: { title: true } },
                },
            }),
            // 3 transaksi terbaru (untuk tabel Recent Transactions)
            prisma.transaction.findMany({
                where: { userId, deletedAt: null },
                orderBy: { createdAt: "desc" },
                take: 3,
                select: {
                    id: true,
                    quantity: true,
                    totalPrice: true,
                    status: true,
                    event: { select: { title: true } },
                    // TODO schema v2: ticketType: true,
                },
            }),
        ]);

    const reviewedIds = new Set(reviewed.map((r) => r.eventId));

    return {
        name: user.name,
        referralCode: user.referralCode,
        referredCount: 0, // TODO schema v2: hitung user dengan referredBy = kode ini
        points: user.points ?? 0,
        pointsExpiresAt: null, // TODO schema v2: user.pointsExpiresAt
        coupon: null, // TODO schema v2: activeCoupon(user)
        upcomingTickets,
        nextTicketDate: nextTicket?.event.startDate ?? null,
        eventsAttended: attended.length,
        pendingReviews: attended.filter((a) => !reviewedIds.has(a.eventId)).length,
        pendingPayment, // null kalau tidak ada yang perlu dibayar
        recentTransactions,
        serverTime: now.toISOString(), // untuk countdown di banner
    };
}