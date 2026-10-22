// ============================================================
// Event Service: Pusat seluruh logika bisnis & query database Event.
// Disesuaikan dengan schema.prisma terbaru (flat tier columns).
// ============================================================
import { prisma } from "../lib/prisma.js";
import { calculateEventStatus } from "../utils/status.js";
import type { CreateEventInput } from "../middlewares/event.middleware.js";

/**
 * Mengubah baris Event dari Prisma menjadi objek yang siap dipakai Frontend.
 * Kita sertakan field schema baru SEKALIGUS field alias (status, totalTicket,
 * province, city, ticketTiers) agar semua komponen tabel & halaman di Frontend
 * tetap kompatibel 100% tanpa ada yang error!
 */
export function formatEventForClient(event: any) {
  const liveStatus = calculateEventStatus(
    event.eventStatus,
    new Date(event.startDate),
    new Date(event.endDate),
  );

  // Hitung tiket terjual dari transaksi yang tidak dibatalkan/ditolak (jika relasi di-include)
  const soldCount = Array.isArray(event.transactions)
    ? event.transactions
        .filter((t: any) => t.status !== "REJECTED" && t.status !== "CANCELED" && t.status !== "EXPIRED")
        .reduce((sum: number, t: any) => sum + (t.quantity || 0), 0)
    : 0;

  // Susun array ticketTiers virtual dari kolom flat agar UI tabel Event tetap jalan
  const ticketTiers = [
    {
      id: `${event.id}-vip`,
      name: "VIP",
      price: event.vipPriceNormal,
      finalPrice: event.vipPriceFinal,
      quota: event.vipQuota,
      sold: 0,
    },
    {
      id: `${event.id}-reg`,
      name: "Regular",
      price: event.regularPriceNormal,
      finalPrice: event.regularPriceFinal,
      quota: event.regularQuota,
      sold: soldCount,
    },
  ];

  if (event.isPresale || event.presaleQuota > 0) {
    ticketTiers.push({
      id: `${event.id}-pre`,
      name: "Presale",
      price: event.presalePriceNormal,
      finalPrice: event.presalePriceFinal,
      quota: event.presaleQuota,
      sold: 0,
    });
  }

  return {
    ...event,
    eventStatus: liveStatus,
    // Alias untuk kompatibilitas UI Frontend:
    status: liveStatus,
    totalTicket: event.totalQuotaTiket,
    province: event.provinceName,
    city: event.cityName,
    ticketTiers,
    presale: {
      enabled: Boolean(event.isPresale || event.presaleQuota > 0),
      amount: event.presaleQuota ?? 0,
      startDate: event.scheduledPublishStart
        ? new Date(event.scheduledPublishStart).toISOString().slice(0, 10)
        : "",
      endDate: event.scheduledPublishEnd
        ? new Date(event.scheduledPublishEnd).toISOString().slice(0, 10)
        : "",
    },
  };
}

// Pastikan ada akun Organizer di DB (dipakai jika user belum login saat testing)
async function getOrCreateOrganizerId(preferredUserId?: string): Promise<string> {
  if (preferredUserId) {
    const found = await prisma.user.findUnique({ where: { id: preferredUserId } });
    if (found) return found.id;
  }

  let organizer = await prisma.user.findFirst({
    where: { role: "ORGANIZER" },
  });

  if (!organizer) {
    organizer = await prisma.user.create({
      data: {
        id: "org-default-01",
        name: "Soundwave Organizer",
        email: "organizer@chistix.id",
        emailVerified: true,
        role: "ORGANIZER",
      },
    });
  }

  return organizer.id;
}

// 1. Ambil semua event aktif (belum di-soft-delete)
export async function getAllEventsService() {
  const events = await prisma.event.findMany({
    where: { deletedAt: null },
    include: {
      organizer: {
        select: { id: true, name: true, email: true },
      },
      transactions: {
        select: { quantity: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return events.map(formatEventForClient);
}

// 2. Ambil detail 1 event berdasarkan ID
export async function getEventByIdService(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      organizer: {
        select: { id: true, name: true, email: true },
      },
      transactions: {
        select: { quantity: true, status: true },
      },
    },
  });

  if (!event || event.deletedAt) {
    return null;
  }

  return formatEventForClient(event);
}

// 3. Buat event baru
export async function createEventService(data: CreateEventInput, organizerUserId?: string) {
  const organizerId = await getOrCreateOrganizerId(organizerUserId);

  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  const initialStatus = data.isDraft
    ? "DRAFT"
    : calculateEventStatus("UPCOMING", start, end);

  const created = await prisma.event.create({
    data: {
      organizerId,
      title: data.title,
      category: data.category,
      startDate: start,
      endDate: end,
      description: data.description,
      provinceId: data.provinceId,
      provinceName: data.provinceName,
      cityId: data.cityId,
      cityName: data.cityName,
      venueDetail: data.venueDetail,
      venueMaps: data.venueMaps || null,
      totalQuotaTiket: data.totalQuotaTiket,
      ticketType: data.ticketType,
      vipQuota: data.vipQuota,
      vipPriceNormal: data.vipPriceNormal,
      vipPriceFinal: data.vipPriceFinal,
      regularQuota: data.regularQuota,
      regularPriceNormal: data.regularPriceNormal,
      regularPriceFinal: data.regularPriceFinal,
      presaleQuota: data.presaleQuota,
      presalePriceNormal: data.presalePriceNormal,
      presalePriceFinal: data.presalePriceFinal,
      thumbnailImage: data.thumbnailImage,
      coverImages: data.coverImages ?? [],
      videoUrl: data.videoUrl || null,
      eventStatus: initialStatus,
      scheduledPublishStart: data.scheduledPublishStart
        ? new Date(data.scheduledPublishStart)
        : null,
      scheduledPublishEnd: data.scheduledPublishEnd
        ? new Date(data.scheduledPublishEnd)
        : null,
      isVip: data.vipQuota > 0,
      isRegular: data.regularQuota > 0,
      isPresale: data.presaleQuota > 0,
    },
  });

  return formatEventForClient(created);
}

// 4. Update event berdasarkan ID
export async function updateEventService(eventId: string, data: CreateEventInput) {
  const existing = await prisma.event.findUnique({ where: { id: eventId } });
  if (!existing || existing.deletedAt) {
    return null;
  }

  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  const nextStatus = data.isDraft
    ? "DRAFT"
    : calculateEventStatus("UPCOMING", start, end);

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: {
      title: data.title,
      category: data.category,
      startDate: start,
      endDate: end,
      description: data.description,
      provinceId: data.provinceId,
      provinceName: data.provinceName,
      cityId: data.cityId,
      cityName: data.cityName,
      venueDetail: data.venueDetail,
      venueMaps: data.venueMaps || null,
      totalQuotaTiket: data.totalQuotaTiket,
      ticketType: data.ticketType,
      vipQuota: data.vipQuota,
      vipPriceNormal: data.vipPriceNormal,
      vipPriceFinal: data.vipPriceFinal,
      regularQuota: data.regularQuota,
      regularPriceNormal: data.regularPriceNormal,
      regularPriceFinal: data.regularPriceFinal,
      presaleQuota: data.presaleQuota,
      presalePriceNormal: data.presalePriceNormal,
      presalePriceFinal: data.presalePriceFinal,
      thumbnailImage: data.thumbnailImage,
      coverImages: data.coverImages ?? existing.coverImages,
      videoUrl: data.videoUrl || null,
      eventStatus: nextStatus,
      scheduledPublishStart: data.scheduledPublishStart
        ? new Date(data.scheduledPublishStart)
        : null,
      scheduledPublishEnd: data.scheduledPublishEnd
        ? new Date(data.scheduledPublishEnd)
        : null,
      isVip: data.vipQuota > 0,
      isRegular: data.regularQuota > 0,
      isPresale: data.presaleQuota > 0,
    },
  });

  return formatEventForClient(updated);
}

// 5. Soft delete event (hanya boleh jika DRAFT atau UPCOMING)
export async function softDeleteEventService(eventId: string) {
  const existing = await prisma.event.findUnique({ where: { id: eventId } });
  if (!existing || existing.deletedAt) {
    return { notFound: true as const };
  }

  const liveStatus = calculateEventStatus(
    existing.eventStatus,
    new Date(existing.startDate),
    new Date(existing.endDate),
  );

  if (liveStatus !== "DRAFT" && liveStatus !== "UPCOMING") {
    return {
      forbiddenStatus: true as const,
      currentStatus: liveStatus,
    };
  }

  await prisma.event.update({
    where: { id: eventId },
    data: { deletedAt: new Date() },
  });

  return { deleted: true as const, title: existing.title };
}

// 6. Search suggest untuk navbar SearchForm (/api/events/suggest?q=...)
export async function suggestEventsService(query: string) {
  const q = query.trim();
  if (q.length < 2) return [];

  const events = await prisma.event.findMany({
    where: {
      deletedAt: null,
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { cityName: { contains: q, mode: "insensitive" } },
        { provinceName: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      title: true,
      cityName: true,
    },
    take: 6,
    orderBy: { startDate: "asc" },
  });

  return events.map((e) => ({
    id: e.id,
    title: e.title,
    slug: e.id, // halaman detail event memakai /events/[id]
    city: e.cityName,
  }));
}
