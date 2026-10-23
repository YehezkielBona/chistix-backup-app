// ============================================================
// Event Service: Pusat seluruh logika bisnis & query database Event.
// Disesuaikan dengan schema.prisma terbaru (flat tier columns).
// ============================================================
import { prisma } from "../lib/prisma.js";
import { calculateEventStatus, calculateTicketSalesPhase } from "../utils/status.js";
import type { CreateEventInput } from "../middlewares/event.middleware.js";

/**
 * Mengubah baris Event dari Prisma menjadi objek yang siap dipakai Frontend.
 * Menghitung status event (DRAFT, UPCOMING, ON_STAGE, ENDED) sekaligus
 * fase penjualan tiket (PRESALE_ACTIVE, GENERAL_SALES, SALES_CLOSED).
 */
export function formatEventForClient(event: any) {
  const liveStatus = calculateEventStatus(
    event.eventStatus,
    new Date(event.startDate),
    new Date(event.endDate),
  );

  // Kalkulasi fase penjualan tiket secara dinamis
  const salesInfo = calculateTicketSalesPhase({
    startDate: new Date(event.startDate),
    isPresale: Boolean(event.isPresale || event.presaleQuota > 0),
    presaleStart: event.scheduledPublishStart ? new Date(event.scheduledPublishStart) : null,
    presaleEnd: event.scheduledPublishEnd ? new Date(event.scheduledPublishEnd) : null,
  });

  // Hitung tiket terjual dari transaksi yang tidak dibatalkan/ditolak (jika relasi di-include)
  const soldCount = Array.isArray(event.transactions)
    ? event.transactions
        .filter((t: any) => t.status !== "REJECTED" && t.status !== "CANCELED" && t.status !== "EXPIRED")
        .reduce((sum: number, t: any) => sum + (t.quantity || 0), 0)
    : 0;

  // Fungsi penentu ketersediaan & label status tiket yang ramah user
  const getTierInfo = (tierName: "VIP" | "Regular" | "Presale", quota: number, sold: number) => {
    if (salesInfo.phase === "SALES_CLOSED") {
      return { isAvailable: false, statusLabel: "Penjualan Ditutup (H-1)" };
    }
    if (quota > 0 && sold >= quota) {
      return { isAvailable: false, statusLabel: "Habis Terjual (Sold Out)" };
    }

    if (tierName === "Presale") {
      if (salesInfo.phase === "PRESALE_UPCOMING") {
        return { isAvailable: false, statusLabel: "Segera Hadir" };
      }
      if (salesInfo.phase === "PRESALE_ACTIVE") {
        return { isAvailable: true, statusLabel: "Tersedia" };
      }
      return { isAvailable: false, statusLabel: "Periode Presale Selesai" };
    }

    // Untuk VIP & Regular:
    if (salesInfo.phase === "PRESALE_ACTIVE" || salesInfo.phase === "PRESALE_UPCOMING") {
      const openDate = salesInfo.vipRegularStartDate
        ? `Dibuka ${new Date(salesInfo.vipRegularStartDate).toLocaleDateString("id-ID")}`
        : "Belum Dibuka";
      return { isAvailable: false, statusLabel: openDate };
    }

    return { isAvailable: true, statusLabel: "Tersedia" };
  };

  const vipInfo = getTierInfo("VIP", event.vipQuota, 0);
  const regInfo = getTierInfo("Regular", event.regularQuota, soldCount);

  // Susun array ticketTiers virtual dari kolom flat agar UI tabel Event tetap jalan
  const ticketTiers: any[] = [
    {
      id: `${event.id}-vip`,
      name: "VIP",
      price: event.vipPriceNormal,
      finalPrice: event.vipPriceFinal,
      quota: event.vipQuota,
      sold: 0,
      isAvailable: vipInfo.isAvailable,
      statusLabel: vipInfo.statusLabel,
    },
    {
      id: `${event.id}-reg`,
      name: "Regular",
      price: event.regularPriceNormal,
      finalPrice: event.regularPriceFinal,
      quota: event.regularQuota,
      sold: soldCount,
      isAvailable: regInfo.isAvailable,
      statusLabel: regInfo.statusLabel,
    },
  ];

  if (event.isPresale || event.presaleQuota > 0) {
    const preInfo = getTierInfo("Presale", event.presaleQuota, 0);
    ticketTiers.push({
      id: `${event.id}-pre`,
      name: "Presale",
      price: event.presalePriceNormal,
      finalPrice: event.presalePriceFinal,
      quota: event.presaleQuota,
      sold: 0,
      isAvailable: preInfo.isAvailable,
      statusLabel: preInfo.statusLabel,
    });
  }

  return {
    ...event,
    eventStatus: liveStatus,
    // Alias untuk kompatibilitas UI Frontend:
    status: liveStatus,
    salesPhase: salesInfo.phase,
    salesCloseDate: salesInfo.salesCloseDate.toISOString(),
    vipRegularStartDate: salesInfo.vipRegularStartDate ? salesInfo.vipRegularStartDate.toISOString() : null,
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
