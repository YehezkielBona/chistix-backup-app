// ============================================================
// Event Controller: Menerima input dari Route, melakukan validasi Zod
// (termasuk normalisasi payload lama/baru), lalu memanggil Event Service.
// ============================================================
import { createEventSchema } from "../middlewares/event.middleware.js";
import {
  getAllEventsService,
  getEventByIdService,
  createEventService,
  updateEventService,
  softDeleteEventService,
  suggestEventsService,
} from "../services/event.service.js";

/**
 * Normalisasi input dari Frontend agar mendukung payload format baru
 * (vipQuota, regularQuota, totalQuotaTiket, provinceId, cityId)
 * MAUPUN payload format lama (ticketTiers[], totalTicket, province, city).
 */
function normalizeEventPayload(raw: any) {
  if (!raw || typeof raw !== "object") return raw;

  const vipFromTier = Array.isArray(raw.ticketTiers)
    ? raw.ticketTiers.find((t: any) => String(t.name).toUpperCase().includes("VIP"))
    : undefined;
  const regFromTier = Array.isArray(raw.ticketTiers)
    ? raw.ticketTiers.find(
        (t: any) =>
          String(t.name).toUpperCase().includes("REGULAR") ||
          String(t.name).toUpperCase().includes("REGULER"),
      )
    : undefined;

  const vipQuota = Number(raw.vipQuota ?? vipFromTier?.quota ?? 0);
  const vipPriceNormal = Number(raw.vipPriceNormal ?? vipFromTier?.price ?? 0);
  const vipPriceFinal = Number(raw.vipPriceFinal ?? vipFromTier?.finalPrice ?? vipPriceNormal);

  const regularQuota = Number(raw.regularQuota ?? regFromTier?.quota ?? 0);
  const regularPriceNormal = Number(raw.regularPriceNormal ?? regFromTier?.price ?? 0);
  const regularPriceFinal = Number(
    raw.regularPriceFinal ?? regFromTier?.finalPrice ?? regularPriceNormal,
  );

  const presaleEnabled = Boolean(raw.presale?.enabled) || Number(raw.presaleQuota) > 0;
  const presaleQuota = Number(
    raw.presaleQuota ?? (raw.presale?.enabled ? raw.presale?.amount : 0) ?? 0,
  );
  const presalePriceNormal = Number(raw.presalePriceNormal ?? regularPriceNormal ?? 0);
  const presalePriceFinal = Number(
    raw.presalePriceFinal ?? regularPriceFinal ?? presalePriceNormal,
  );

  const totalQuotaTiket = Number(
    raw.totalQuotaTiket ??
      raw.totalQuotaTicket ??
      raw.totalTicket ??
      vipQuota + regularQuota + presaleQuota,
  );

  const ticketType =
    raw.ticketType ?? (presaleEnabled && presaleQuota > 0 ? "PRESALE" : "REGULAR");

  return {
    title: raw.title,
    category: String(raw.category || "MUSIC").toUpperCase(),
    startDate: raw.startDate,
    endDate: raw.endDate,
    description: raw.description,

    provinceId: String(raw.provinceId || "31"),
    provinceName: String(raw.provinceName || raw.province || ""),
    cityId: String(raw.cityId || "3171"),
    cityName: String(raw.cityName || raw.city || ""),

    venueDetail: raw.venueDetail,
    venueMaps: raw.venueMaps || "",
    totalQuotaTiket,
    ticketType,

    vipQuota,
    vipPriceNormal,
    vipPriceFinal,
    regularQuota,
    regularPriceNormal,
    regularPriceFinal,
    presaleQuota,
    presalePriceNormal,
    presalePriceFinal,

    thumbnailImage: String(raw.thumbnailImage || ""),
    coverImages: Array.isArray(raw.coverImages) ? raw.coverImages : [],
    videoUrl: raw.videoUrl || "",

    scheduledPublishStart:
      raw.scheduledPublishStart ?? raw.presale?.startDate ?? "",
    scheduledPublishEnd:
      raw.scheduledPublishEnd ?? raw.presale?.endDate ?? "",

    isDraft: Boolean(raw.isDraft),
  };
}

// 1. GET /api/organizer/events
export async function getAllEventController() {
  const events = await getAllEventsService();
  return {
    success: true,
    statusCode: 200,
    data: events,
  };
}

// 2. GET /api/organizer/events/:id
export async function getEventDetailController(eventId: string) {
  const event = await getEventByIdService(eventId);
  if (!event) {
    return {
      success: false,
      statusCode: 404,
      message: "Event tidak ditemukan",
    };
  }
  return {
    success: true,
    statusCode: 200,
    data: event,
  };
}

// 3. POST /api/organizer/events
export async function createEventController(inputData: unknown, organizerUserId?: string) {
  const normalized = normalizeEventPayload(inputData);
  const validation = createEventSchema.safeParse(normalized);

  if (!validation.success) {
    const firstIssue = validation.error.issues[0]?.message || "Validasi gagal";
    return {
      success: false,
      statusCode: 400,
      message: firstIssue,
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const created = await createEventService(validation.data, organizerUserId);
  return {
    success: true,
    statusCode: 201,
    message: `Event berhasil dibuat dengan status: ${created.eventStatus}`,
    data: created,
  };
}

// 4. PUT /api/organizer/events/:id
export async function updateEventController(eventId: string, inputData: unknown) {
  const normalized = normalizeEventPayload(inputData);
  const validation = createEventSchema.safeParse(normalized);

  if (!validation.success) {
    const firstIssue = validation.error.issues[0]?.message || "Validasi update gagal";
    return {
      success: false,
      statusCode: 400,
      message: firstIssue,
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const updated = await updateEventService(eventId, validation.data);
  if (!updated) {
    return {
      success: false,
      statusCode: 404,
      message: "Event tidak ditemukan",
    };
  }

  return {
    success: true,
    statusCode: 200,
    message: "Event berhasil diperbarui",
    data: updated,
  };
}

// 5. DELETE /api/organizer/events/:id (Soft Delete)
export async function softDeleteEventController(eventId: string) {
  const result = await softDeleteEventService(eventId);

  if ("notFound" in result) {
    return {
      success: false,
      statusCode: 404,
      message: "Event tidak ditemukan",
    };
  }

  if ("forbiddenStatus" in result) {
    return {
      success: false,
      statusCode: 400,
      message: `Hanya event berstatus DRAFT atau UPCOMING yang dapat dihapus! (Status saat ini: ${result.currentStatus})`,
    };
  }

  return {
    success: true,
    statusCode: 200,
    message: `Event "${result.title}" berhasil dihapus (Soft Delete)!`,
  };
}

// 6. GET /api/events/suggest?q=...
export async function suggestEventController(query: string) {
  const suggestions = await suggestEventsService(query);
  return {
    success: true,
    statusCode: 200,
    suggestions,
  };
}
