import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";
import { formatEventForClient } from "./event.service.js";
import type { EventQuery } from "../middlewares/eventQuery.middleware.js";

const ACTIVE = ["WAITING_PAYMENT", "WAITING_CONFIRM", "DONE"] as const;

// Data tambahan per event: organizer + transaksi aktif
const eventInclude = {
  organizer: { select: { id: true, name: true, image: true } },
  transactions: {
    where: { status: { in: [...ACTIVE] }, deletedAt: null },
    // TODO schema v2: tambahkan ticketType: true
    select: { quantity: true, status: true },
  },
} satisfies Prisma.EventInclude;

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
    data: rows.map(formatEventForClient),
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
    presale: presale.map(formatEventForClient),
    upcoming: upcoming.map(formatEventForClient),
    popular: popular.map(formatEventForClient),
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
    ...formatEventForClient(event),
    organizerRating: {
      average: rating._avg.ratingScore ?? 0,
      count: rating._count,
    },
  };
}