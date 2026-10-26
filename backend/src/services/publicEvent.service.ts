import type { Prisma, TicketType } from "@prisma/client"; // [BARU] + TicketType
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";
import { formatEventForClient } from "./event.service.js";
import type { EventQuery } from "../middlewares/eventQuery.middleware.js";
// [LAMA] import { LOW_STOCK_THRESHOLD, TIER_NAME_TO_TYPE, soldPerTier } from "../utils/ticketTier.js"; // [BARU]
// [BARU] soldPerTier tidak dipakai di sini (dipakai nanti saat checkout), sisa kursi dihitung dari eventInclude
import { LOW_STOCK_THRESHOLD, TIER_NAME_TO_TYPE } from "../utils/ticketTier.js";

const ACTIVE = ["WAITING_PAYMENT", "WAITING_CONFIRM", "DONE"] as const;

// Data tambahan per event: organizer + transaksi aktif
const eventInclude = {
  organizer: { select: { id: true, name: true, image: true } },
  transactions: {
    where: { status: { in: [...ACTIVE] }, deletedAt: null },
    // [LAMA] // TODO schema v2: tambahkan ticketType: true
    // [LAMA] select: { quantity: true, status: true },
    select: { quantity: true, status: true, ticketType: true }, // [BARU] ticketType sudah ada di schema
  },
} satisfies Prisma.EventInclude;

// [BARU] ---------- Sisa kursi per kategori ----------
// formatEventForClient (milik teman) tidak diubah. Hasilnya diproses lagi di sini supaya
// setiap tier punya ticketType, sold, remaining, lowStock, isAvailable, dan statusLabel yang pasti terisi.
type ClientTier = { name: string; quota: number; sold?: number; isAvailable?: boolean; statusLabel?: string };
type IncludedTrx = { quantity: number; ticketType: TicketType };

// Jumlah tiket terjual per kategori, dari transaksi aktif yang sudah ikut terambil lewat eventInclude
function soldFromTransactions(trxs: IncludedTrx[] = []): Record<TicketType, number> {
  const sold: Record<TicketType, number> = { VIP: 0, REGULAR: 0, PRESALE: 0 };
  for (const t of trxs) sold[t.ticketType] += t.quantity;
  return sold;
}

function withTierStock<
  T extends {
    startDate: Date | string;
    salesPhase?: string;
    ticketTiers: ClientTier[];
    transactions?: IncludedTrx[];
  },
>(event: T) {
  const sold = soldFromTransactions(event.transactions);
  // penjualan ditutup kalau formatter bilang SALES_CLOSED, atau event sudah dimulai
  const closed = event.salesPhase === "SALES_CLOSED" || new Date(event.startDate) <= new Date();

  const ticketTiers = event.ticketTiers
    .filter((t) => t.quota > 0) // kategori dengan kuota 0 berarti tidak dijual
    .map((t) => {
      const type = TIER_NAME_TO_TYPE[t.name];
      const soldCount = type ? sold[type] : (t.sold ?? 0);
      const remaining = Math.max(0, t.quota - soldCount);
      const soldOut = remaining === 0;
      const baseAvailable = closed ? false : (t.isAvailable ?? true);
      return {
        ...t,
        ticketType: type,
        sold: soldCount,
        remaining,
        isAvailable: baseAvailable && !soldOut,
        statusLabel: soldOut
          ? "Habis Terjual"
          : closed
            ? "Penjualan Ditutup"
            : (t.statusLabel ?? (baseAvailable ? "Tersedia" : "Belum Dibuka")),
        lowStock: !soldOut && remaining <= LOW_STOCK_THRESHOLD,
      };
    });

  return { ...event, salesPhase: closed ? "SALES_CLOSED" : event.salesPhase, ticketTiers };
}

// [BARU] satu pintu: format milik teman + sisa kursi per kategori
// Parameter "event: any" mengikuti formatEventForClient milik teman
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toClientEvent = (event: any) => withTierStock(formatEventForClient(event));
// [BARU] ---------- akhir sisa kursi ----------

// Event yang boleh dilihat publik
function publicWhere(now: Date): Prisma.EventWhereInput {
  return {
    deletedAt: null,
    eventStatus: { notIn: ["DRAFT", "ENDED"] },
    endDate: { gte: now },
  };
}

// Cocok kalau salah satu tier harganya masuk rentang
function priceWhere(min?: number, max?: number): Prisma.EventWhereInput | null {
  if (min === undefined && max === undefined) return null;
  const range = {
    ...(min !== undefined ? { gte: min } : {}),
    ...(max !== undefined ? { lte: max } : {}),
  };
  return {
    OR: [
      { regularQuota: { gt: 0 }, regularPriceFinal: range },
      { vipQuota: { gt: 0 }, vipPriceFinal: range },
      { presaleQuota: { gt: 0 }, presalePriceFinal: range },
    ],
  };
}

// Pilihan urutan. Harga memakai harga Regular.
const ORDER: Record<EventQuery["sort"], Prisma.EventOrderByWithRelationInput> = {
  soonest: { startDate: "asc" },
  newest: { createdAt: "desc" },
  popular: { transactions: { _count: "desc" } },
  price_asc: { regularPriceFinal: "asc" },
  price_desc: { regularPriceFinal: "desc" },
};

// GET /api/events : search + filter + sort + pagination
export async function listPublicEventsService(q: EventQuery) {
  const now = new Date();
  const and: Prisma.EventWhereInput[] = [];

  if (q.search) {
    and.push({
      OR: [
        { title: { contains: q.search, mode: "insensitive" } },
        { cityName: { contains: q.search, mode: "insensitive" } },
        { venueDetail: { contains: q.search, mode: "insensitive" } },
      ],
    });
  }
   // Lokasi bisa berupa nama kota ("Jakarta") atau provinsi dari Emsifa ("DKI Jakarta")
  if (q.city) {
    and.push({
      OR: [
        { cityName: { contains: q.city, mode: "insensitive" } },
        { provinceName: { contains: q.city, mode: "insensitive" } },
      ],
    });
  }
  const price = priceWhere(q.minPrice, q.maxPrice);
  if (price) and.push(price);

  const where: Prisma.EventWhereInput = {
    ...publicWhere(now),
    ...(q.category ? { category: q.category } : {}),
    // ...(q.city ? { cityName: { contains: q.city, mode: "insensitive" } } : {}),
    ...(and.length ? { AND: and } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: ORDER[q.sort],
      skip: (q.page - 1) * q.limit, // OFFSET
      take: q.limit, // LIMIT
      include: eventInclude,
    }),
    prisma.event.count({ where }),
  ]);

  return {
    // [LAMA] data: rows.map(formatEventForClient),
    data: rows.map(toClientEvent), // [BARU] + sisa kursi per kategori
    total,
    page: q.page,
    limit: q.limit,
    totalPages: Math.max(1, Math.ceil(total / q.limit)),
  };
}

// GET /api/events/home : tiga baris di homepage
export async function homeEventsService() {
  const now = new Date();
  const base = publicWhere(now);

  const [presale, upcoming, popular] = await Promise.all([
    prisma.event.findMany({
      where: {
        ...base,
        isPresale: true,
        scheduledPublishStart: { lte: now },
        scheduledPublishEnd: { gte: now },
      },
      orderBy: { scheduledPublishEnd: "asc" },
      take: 8,
      include: eventInclude,
    }),
    prisma.event.findMany({
      where: base,
      orderBy: { startDate: "asc" },
      take: 8,
      include: eventInclude,
    }),
    prisma.event.findMany({
      where: base,
      orderBy: { transactions: { _count: "desc" } },
      take: 8,
      include: eventInclude,
    }),
  ]);

  return {
    // [LAMA] presale: presale.map(formatEventForClient),
    // [LAMA] upcoming: upcoming.map(formatEventForClient),
    // [LAMA] popular: popular.map(formatEventForClient),
    presale: presale.map(toClientEvent), // [BARU]
    upcoming: upcoming.map(toClientEvent), // [BARU]
    popular: popular.map(toClientEvent), // [BARU]
  };
}

// GET /api/events/:id : detail publik + rating organizer
export async function publicEventDetailService(eventId: string) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, deletedAt: null, eventStatus: { not: "DRAFT" } },
    include: eventInclude,
  });
  if (!event) throw new AppError(404, "Event tidak ditemukan");

  const rating = await prisma.review.aggregate({
    where: { deletedAt: null, event: { organizerId: event.organizerId } },
    _avg: { ratingScore: true },
    _count: true,
  });

  return {
    // [LAMA] ...formatEventForClient(event),
    ...toClientEvent(event), // [BARU] + sisa kursi per kategori
    organizerRating: {
      average: rating._avg.ratingScore ?? 0,
      count: rating._count,
    },
  };
}