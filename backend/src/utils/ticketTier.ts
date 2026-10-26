import type { Prisma, TicketType, TransactionStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

// Transaksi yang dianggap "memakai kursi". EXPIRED, CANCELED, REJECTED tidak dihitung,
// jadi kursi otomatis kembali tanpa perlu mengubah kuota di tabel Event.
export const ACTIVE_STATUSES: TransactionStatus[] = ["WAITING_PAYMENT", "WAITING_CONFIRM", "DONE"];

export const LOW_STOCK_THRESHOLD = 5;   // tampilkan "X tiket tersisa" kalau sisa <= 5
export const MAX_TICKETS_PER_ORDER = 10; // batas beli per transaksi (boleh diubah tim)

// Nama tier dari formatEventForClient -> enum TicketType di database
export const TIER_NAME_TO_TYPE: Record<string, TicketType> = {
    VIP: "VIP",
    Regular: "REGULAR",
    Presale: "PRESALE",
};

// Jumlah tiket terjual per kategori untuk 1 event (1 query, dikelompokkan per ticketType)
export async function soldPerTier(
    eventId: string,
    db: Prisma.TransactionClient = prisma, // nanti bisa dipakai di dalam $transaction saat checkout
): Promise<Record<TicketType, number>> {
    const rows = await db.transaction.groupBy({
        by: ["ticketType"],
        where: { eventId, status: { in: ACTIVE_STATUSES }, deletedAt: null },
        _sum: { quantity: true },
    });
    const sold: Record<TicketType, number> = { VIP: 0, REGULAR: 0, PRESALE: 0 };
    for (const r of rows) sold[r.ticketType] = r._sum.quantity ?? 0;
    return sold;
}