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
export async function createVoucherService(data: CreateVoucherInput) {
  const { code, eventId, discountType, discount, validStart, validEnd, maxUsage } = data;

  // Cek apakah kode sudah pernah dipakai
  const existing = await prisma.voucher.findUnique({ where: { code } });
  if (existing && !existing.deletedAt) {
    return { duplicate: true as const };
  }

  // Jika organizer memilih "All Events"
  if (eventId === "ALL") {
    const allEvents = await prisma.event.findMany({
      where: { deletedAt: null },
    });

    // Saring event yang status dinamisnya DRAFT atau UPCOMING
    const eligibleEvents = allEvents.filter((evt) => {
      const st = calculateEventStatus(
        evt.eventStatus,
        new Date(evt.startDate),
        new Date(evt.endDate),
      );
      return st !== "ENDED";
    });

    if (eligibleEvents.length === 0) {
      return { noEligibleEvents: true as const };
    }

    const created = await prisma.$transaction(
      eligibleEvents.map((evt, index) =>
        prisma.voucher.create({
          data: {
            code: `${code}_${index}`,
            eventId: evt.id,
            discountType,
            discount,
            validStart: new Date(validStart),
            validEnd: new Date(validEnd),
            maxUsage,
          },
        }),
      ),
    );

    return { createdAll: true as const, data: created };
  }

  const targetEvent = await prisma.event.findUnique({
    where: { id:eventId},
  })

  if(!targetEvent || targetEvent.deletedAt) {
    return {eventNotFound: true as const}
  }

  const eventEnd = new Date(targetEvent.endDate)
  if(new Date(validStart) >= eventEnd) {
    throw new Error ("Voucher sudah tidak dapat digunakan karena tanggal mulai voucher sudah melewati tanggal event berakhir")
  }
  if(new Date(validEnd) > eventEnd) {
    throw new Error("Tanggal kadaluarsa voucher tidak boleh melebihi tanggal event berakhir")
  }

  // Untuk 1 event spesifik
  const voucher = await prisma.voucher.create({
    data: {
      code,
      eventId,
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

  // Cari voucher dengan kode persis ATAU kode "All Event" (prefix CODE_0, CODE_1) untuk event ini
  let voucher = await prisma.voucher.findFirst({
    where: {
      deletedAt: null,
      OR: [
        { code: normalizedCode },
        {
          eventId,
          code: { startsWith: `${normalizedCode}_` },
        },
      ],
    },
  });

  // Jika eventId di URL cart masih memakai ID pendek ("1", "2") dari data dummy,
  // tetap izinkan pencocokan berdasarkan kode langsung agar mudah dites
  if (!voucher) {
    return { error: "Kode voucher tidak ditemukan" };
  }

  // Jika eventId berupa UUID valid dan berbeda dengan event milik voucher
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(eventId);
  if (isUuid && voucher.eventId !== eventId) {
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
