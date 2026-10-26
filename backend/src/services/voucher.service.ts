// ============================================================
// Voucher Service: Logika bisnis & query database untuk Voucher.
// Mendukung pembuatan voucher spesifik 1 event maupun "ALL" (Semua Event),
// perhitungan status otomatis (SCHEDULED / ACTIVE / EXPIRED),
// serta validasi + penambahan usedCount saat customer memakai voucher di Cart.
// ============================================================
import { prisma } from "../lib/prisma.js";
import { calculateEventStatus, calculateVoucherStatus } from "../utils/status.js";
import type { CreateVoucherInput } from "../middlewares/voucher.middleware.js";

// 1. Ambil semua voucher yang belum dihapus (soft-delete)
export async function getAllVouchersService() {
  const vouchers = await prisma.voucher.findMany({
    where: { deletedAt: null },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          eventStatus: true,
          startDate: true,
          endDate: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return vouchers.map((v) => ({
    ...v,
    event: v.event
      ? {
          id: v.event.id,
          title: v.event.title,
          status: calculateEventStatus(
            v.event.eventStatus,
            new Date(v.event.startDate),
            new Date(v.event.endDate),
          ),
        }
      : null,
    computedStatus: calculateVoucherStatus(v.validStart, v.validEnd),
  }));
}

// 2. Ambil detail 1 voucher berdasarkan ID
export async function getVoucherByIdService(voucherId: string) {
  const voucher = await prisma.voucher.findUnique({
    where: { id: voucherId },
    include: { event: true },
  });

  if (!voucher || voucher.deletedAt) {
    return null;
  }

  return {
    ...voucher,
    computedStatus: calculateVoucherStatus(voucher.validStart, voucher.validEnd),
  };
}

// 3. Buat voucher baru (1 event atau "ALL" untuk seluruh event DRAFT & UPCOMING)
export async function createVoucherService(data: CreateVoucherInput, organizerId?: string) {
  const { code, eventId, discountType, discount, validStart, validEnd, maxUsage } = data;

  // Cek apakah kode sudah pernah dipakai
  const existing = await prisma.voucher.findUnique({ where: { code } });
  if (existing && !existing.deletedAt) {
    return { duplicate: true as const };
  }

  // Jika organizer memilih "All Events"
  if (eventId === "ALL") {
    // Cukup buat 1 baris voucher saja dengan eventId bernilai null!
    const voucher = await prisma.voucher.create({
      data: {
        code, // Kodenya murni "MASBAHLIL" tanpa tambahan _0 atau _1!
        organizerId: organizerId || null,
        eventId: null, // Kosongkan eventId karena berlaku untuk semua event
        discountType,
        discount,
        validStart: new Date(validStart),
        validEnd: new Date(validEnd),
        maxUsage,
      },
    });
    return { createdAll: true as const, data: voucher };
  }
  // JIKA VOUCHER KHUSUS 1 EVENT TERTENTU:
  const targetEvent = await prisma.event.findUnique({
    where: { id: eventId },
  });
  if (!targetEvent || targetEvent.deletedAt) {
    return { eventNotFound: true as const };
  }
  const voucher = await prisma.voucher.create({
    data: {
      code,
      organizerId: targetEvent.organizerId,
      eventId: targetEvent.id,
      discountType,
      discount,
      validStart: new Date(validStart),
      validEnd: new Date(validEnd),
      maxUsage,
    },
  });
  return { createdOne: true as const, data: voucher };
}

// 4. Update voucher
export async function updateVoucherService(voucherId: string, data: CreateVoucherInput) {
  const existing = await prisma.voucher.findUnique({ where: { id: voucherId } });
  if (!existing || existing.deletedAt) {
    return null;
  }

  return prisma.voucher.update({
    where: { id: voucherId },
    data: {
      code: data.code,
      eventId: data.eventId,
      discountType: data.discountType,
      discount: data.discount,
      validStart: new Date(data.validStart),
      validEnd: new Date(data.validEnd),
      maxUsage: data.maxUsage,
    },
  });
}

// 5. Soft delete voucher
export async function softDeleteVoucherService(voucherId: string) {
  const existing = await prisma.voucher.findUnique({ where: { id: voucherId } });
  if (!existing || existing.deletedAt) {
    return false;
  }

  await prisma.voucher.update({
    where: { id: voucherId },
    data: { deletedAt: new Date() },
  });

  return true;
}

// 6. Validasi & gunakan kode voucher saat Customer menekan "Apply" di halaman Cart
export async function validateAndUseVoucherService(rawCode: string, eventId: string) {
  const now = new Date();
  const normalizedCode = rawCode.trim().toUpperCase();

  // Cari voucher dengan kode
  const voucher = await prisma.voucher.findFirst({
    where: {
      code: normalizedCode,
      deletedAt: null,
    },
    include: {
      event: true
    }
  });
  if (!voucher) {
    return { error: "Kode voucher tidak ditemukan" };
  }
  
  const currentEvent = await prisma.event.findUnique({
    where: {id: eventId}
  })
  if(!currentEvent) {
    return {error: "Event tidak valid!"}
  }

  //  LOGIKA PENCOCOKAN EVENT:
  // - Kasus A: Voucher khusus 1 event -> eventId harus sama persis
  // - Kasus B: Voucher All Events (eventId == null) -> organizerId harus sama dengan pembuat event ini

  const isSpecificEventMatch = voucher.eventId === currentEvent.id;
  const isGlobalOrganizerMatch =
    voucher.eventId === null &&
    voucher.organizerId &&
    voucher.organizerId === currentEvent.organizerId;

  if (!isSpecificEventMatch && !isGlobalOrganizerMatch) {
    return { error: "Voucher ini tidak berlaku untuk event ini" };
  }

  if (now < voucher.validStart) {
    return { error: "Voucher ini belum memasuki periode aktif (Scheduled)" };
  }

  if (now > voucher.validEnd) {
    return { error: "Voucher ini sudah kadaluarsa (Expired)" };
  }

  if (voucher.usedCount >= voucher.maxUsage) {
    return { error: "Kuota penggunaan voucher ini sudah habis" };
  }

  // Tambah jumlah terpakai (usedCount + 1) agar tabel Used di dashboard Organizer ikut bertambah!
  const updated = await prisma.voucher.update({
    where: { id: voucher.id },
    data: { usedCount: { increment: 1 } },
  });

  return {
    voucher: {
      voucherId: updated.id,
      code: updated.code,
      discountType: updated.discountType,
      discount: updated.discount,
      usedCount: updated.usedCount,
      maxUsage: updated.maxUsage,
    },
  };
}
