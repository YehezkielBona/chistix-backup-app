import crypto from "node:crypto";
import type { Prisma, Transaction, TransactionStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";
import { runInBackground } from "../utils/background.js";
import { deleteImage, publicIdFromUrl, uploadImageBuffer } from "./cloudinary.service.js";
import { sendTransactionDecisionEmail } from "./transactionMail.service.js";
import type { ListQuery } from "../middlewares/transaction.middleware.js";

const CONFIRM_WINDOW_MS = 3 * 24 * 60 * 60 * 1000; // 3 hari
const TX_OPTIONS = { timeout: 15_000 }; // default Prisma 5 detik, Neon kadang lambat
type Db = Prisma.TransactionClient;
type FailedStatus = "EXPIRED" | "CANCELED" | "REJECTED";

// ================= A. HELPER INTERNAL =================

// Kembalikan poin & voucher yang dipakai transaksi
async function restoreResources(tx: Db, trx: Transaction) {
  if (trx.pointUsed > 0) {
    await tx.user.updateMany({
      where: { id: trx.userId, points: null },
      data: { points: 0 },
    });
    await tx.user.update({
      where: { id: trx.userId },
      data: { points: { increment: trx.pointUsed } },
    });
  }
  if (trx.voucherId) {
    await tx.voucher.update({
      where: { id: trx.voucherId },
      data: { usedCount: { decrement: 1 } },
    });
  }
}

// Ubah ke status gagal + rollback dalam SATU SQL transaction
async function moveToFailedStatus(trxId: string, from: TransactionStatus[], to: FailedStatus) {
  return prisma.$transaction(async (tx) => {
    const changed = await tx.transaction.updateMany({
      where: { id: trxId, status: { in: from } },
      data: { status: to },
    });
    if (changed.count === 0) return null;

    const trx = await tx.transaction.findUniqueOrThrow({ where: { id: trxId } });
    await restoreResources(tx, trx);
    return trx;
  }, TX_OPTIONS);
}

// Satu e-ticket (satu QR unik) per tiket yang dibeli
async function createETickets(tx: Db, trx: Pick<Transaction, "id" | "quantity">) {
  await tx.eTicket.createMany({
    data: Array.from({ length: trx.quantity }, () => ({
      transactionId: trx.id,
      ticketCode: `CHX-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
      qrToken: crypto.randomUUID(),
    })),
  });
}

const listInclude = {
  event: {
    select: {
      id: true, title: true, thumbnailImage: true, startDate: true,
      cityName: true, provinceName: true, venueDetail: true,
    },
  },
  eTickets: {
    where: { deletedAt: null },
    select: { id: true, ticketCode: true, qrToken: true, isAttended: true },
  },
} satisfies Prisma.TransactionInclude;

// ================= B. CUSTOMER CHECKOUT & PAYMENT (KIEL) =================

export interface CreateTransactionInput {
  userId?: string;
  eventId: string;
  ticketType: "VIP" | "REGULAR" | "PRESALE";
  quantity: number;
  voucherCode?: string;
  pointsUsed?: number;
}

export const createTransactionService = async (input: CreateTransactionInput) => {
  const { eventId, ticketType, quantity, voucherCode, pointsUsed = 0 } = input;
  let customerId = input.userId;
  if (!customerId) {
    const defaultCustomer = await prisma.user.findFirst({
      where: { role: "CUSTOMER" },
    });
    customerId = defaultCustomer?.id || "customer-1";
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });
  if (!event || event.deletedAt) {
    throw new AppError(404, "Cannot find the event or has been deleted");
  }

  let pricePerTicket = 0;
  let currentQuota = 0;
  let quotaField: "vipQuota" | "regularQuota" | "presaleQuota" = "regularQuota";

  if (ticketType === "VIP") {
    quotaField = "vipQuota";
    currentQuota = event.vipQuota;
    pricePerTicket = event.vipPriceFinal || event.vipPriceNormal;
  } else if (ticketType === "PRESALE") {
    quotaField = "presaleQuota";
    currentQuota = event.presaleQuota;
    pricePerTicket = event.presalePriceFinal || event.presalePriceNormal;
  } else {
    quotaField = "regularQuota";
    currentQuota = event.regularQuota;
    pricePerTicket = event.regularPriceFinal || event.regularPriceNormal;
  }

  if (currentQuota < quantity) {
    throw new AppError(400, `Ticket Quota ${ticketType} doesn't enough! ${currentQuota} left`);
  }

  const normalPrice = pricePerTicket * quantity;
  let voucherDiscount = 0;
  let voucherId: string | null = null;

  if (voucherCode) {
    const voucher = await prisma.voucher.findFirst({
      where: {
        code: voucherCode.trim().toUpperCase(),
        deletedAt: null,
      },
    });

    if (voucher) {
      voucherId = voucher.id;
      if (voucher.discountType === "PERCENTAGE") {
        voucherDiscount = Math.round(normalPrice * (voucher.discount / 100));
      } else {
        voucherDiscount = voucher.discount;
      }
    }
  }

  let validPointsUsed = 0;
  if (pointsUsed > 0) {
    const user = await prisma.user.findUnique({
      where: { id: customerId },
    });
    const availablePoints = user?.points || 0;
    validPointsUsed = Math.min(pointsUsed, availablePoints, Math.max(0, normalPrice - voucherDiscount));
  }

  const totalDiscount = voucherDiscount + validPointsUsed;
  const taxFee = Math.round(normalPrice * 0.11); // PPN 11%
  const totalPrice = Math.max(0, normalPrice - totalDiscount + taxFee);
  const paymentDeadline = new Date(Date.now() + 10 * 60 * 1000); // 10 menit

  return await prisma.$transaction(async (tx) => {
    // 1. Potong Kuota Tiket
    await tx.event.update({
      where: { id: eventId },
      data: {
        [quotaField]: { decrement: quantity },
        totalQuotaTiket: { decrement: quantity },
      },
    });

    // 2. Potong Poin jika ada
    if (validPointsUsed > 0) {
      await tx.user.update({
        where: { id: customerId },
        data: {
          points: { decrement: validPointsUsed },
        },
      });
    }

    // 3. Buat Record Transaksi Baru
    const newTransaction = await tx.transaction.create({
      data: {
        userId: customerId!,
        eventId: event.id,
        voucherId,
        ticketType,
        quantity,
        normalPrice,
        discPrice: totalDiscount,
        pointUsed: validPointsUsed,
        totalPrice,
        status: "WAITING_PAYMENT",
        paymentDeadline,
      },
      include: {
        event: {
          select: {
            title: true,
            thumbnailImage: true,
            startDate: true,
            cityName: true,
          },
        },
      },
    });
    return newTransaction;
  });
};

export const getTransactionByIdService = async (transactionId: string) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          startDate: true,
          cityName: true,
          venueDetail: true,
        },
      },
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });
  if (!transaction) {
    throw new AppError(404, "Transaksi tidak ditemukan");
  }
  return transaction;
};

// ================= C. CUSTOMER RIWAYAT & BUKTI BAYAR (MUTI) =================

export async function getMyTransactionsService(userId: string, q: ListQuery) {
  await sweepOverdueTransactions();
  const where: Prisma.TransactionWhereInput = {
    userId,
    deletedAt: null,
    ...(q.status ? { status: q.status } : {}),
  };
  const [data, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
      include: listInclude,
    }),
    prisma.transaction.count({ where }),
  ]);
  return { data, total, page: q.page, limit: q.limit, totalPages: Math.max(1, Math.ceil(total / q.limit)) };
}

export async function getMyTransactionDetailService(userId: string, trxId: string) {
  const current = await prisma.transaction.findFirst({
    where: { id: trxId, userId, deletedAt: null },
    select: { status: true, paymentDeadline: true, ConfirmDeadline: true },
  });
  if (!current) throw new AppError(404, "Transaksi tidak ditemukan");

  const now = new Date();
  if (current.status === "WAITING_PAYMENT" && current.paymentDeadline < now) {
    await moveToFailedStatus(trxId, ["WAITING_PAYMENT"], "EXPIRED");
  }
  if (current.status === "WAITING_CONFIRM" && current.ConfirmDeadline && current.ConfirmDeadline < now) {
    await moveToFailedStatus(trxId, ["WAITING_CONFIRM"], "CANCELED");
  }

  const trx = await prisma.transaction.findUniqueOrThrow({
    where: { id: trxId },
    include: { ...listInclude, voucher: { select: { code: true } } },
  });
  return { ...trx, serverTime: now.toISOString() };
}

export async function uploadPaymentProofService(userId: string, trxId: string, file: Express.Multer.File) {
  const trx = await prisma.transaction.findFirst({ where: { id: trxId, userId, deletedAt: null } });
  if (!trx) throw new AppError(404, "Transaksi tidak ditemukan");

  const now = new Date();
  if (trx.status === "WAITING_PAYMENT" && trx.paymentDeadline < now) {
    await moveToFailedStatus(trx.id, ["WAITING_PAYMENT"], "EXPIRED");
    throw new AppError(400, "Batas waktu sudah lewat, transaksi otomatis expired");
  }
  if (trx.status !== "WAITING_PAYMENT" && trx.status !== "WAITING_CONFIRM") {
    throw new AppError(400, `Transaksi berstatus ${trx.status}, bukti bayar tidak bisa diunggah`);
  }

  const uploaded = await uploadImageBuffer(file.buffer, "chistix/payment-proofs");

  const updated = await prisma.transaction.updateMany({
    where: { id: trx.id, status: { in: ["WAITING_PAYMENT", "WAITING_CONFIRM"] } },
    data: {
      paymentProof: uploaded.url,
      status: "WAITING_CONFIRM",
      ConfirmDeadline: trx.ConfirmDeadline ?? new Date(now.getTime() + CONFIRM_WINDOW_MS),
    },
  });
  if (updated.count === 0) {
    await deleteImage(uploaded.publicId);
    throw new AppError(409, "Status transaksi sudah berubah, silakan muat ulang halaman");
  }

  const oldId = trx.paymentProof ? publicIdFromUrl(trx.paymentProof) : null;
  if (oldId) runInBackground(deleteImage(oldId));

  return prisma.transaction.findUniqueOrThrow({ where: { id: trx.id } });
}

export async function cancelByCustomerService(userId: string, trxId: string) {
  const owned = await prisma.transaction.findFirst({ where: { id: trxId, userId }, select: { id: true } });
  if (!owned) throw new AppError(404, "Transaksi tidak ditemukan");

  const result = await moveToFailedStatus(trxId, ["WAITING_PAYMENT"], "CANCELED");
  if (!result) throw new AppError(400, "Hanya transaksi Waiting for Payment yang bisa dibatalkan");
  return result;
}

// ================= D. ORGANIZER TRANSACTIONS =================

// Format query Kiel (langsung load tanpa pagination rumit)
export const getOrganizerTransactionService = async (organizerId?: string) => {
  return await prisma.transaction.findMany({
    where: {
      // Muat seluruh transaksi agar langsung terdeteksi di dashboard organizer
      deletedAt: null,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      event: { select: { id: true, title: true } },
      voucher: { select: { code: true, discount: true, discountType: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

// Format query Muti (dengan pagination)
export async function getOrganizerTransactionsService(organizerId: string, q: ListQuery) {
  await sweepOverdueTransactions();
  const where: Prisma.TransactionWhereInput = {
    deletedAt: null,
    event: { organizerId },
    ...(q.status ? { status: q.status } : {}),
  };
  const [data, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
      include: {
        user: { select: { name: true, email: true } },
        event: { select: { title: true } },
      },
    }),
    prisma.transaction.count({ where }),
  ]);
  return { data, total, page: q.page, limit: q.limit, totalPages: Math.max(1, Math.ceil(total / q.limit)) };
}

// Smart Accept: Mendukung parameter (organizerId, trxId) maupun (trxId, organizerId)
export async function acceptTransactionService(first: string, second: string) {
  let trx = await prisma.transaction.findFirst({
    where: { id: second, deletedAt: null },
    include: {
      user: { select: { email: true, name: true } },
      event: { select: { title: true } },
    },
  });
  let trxId = second;

  if (!trx) {
    const swapped = await prisma.transaction.findFirst({
      where: { id: first, deletedAt: null },
      include: {
        user: { select: { email: true, name: true } },
        event: { select: { title: true } },
      },
    });
    if (swapped) {
      trx = swapped;
      trxId = first;
    }
  }

  if (!trx) throw new AppError(404, "Transaksi tidak ditemukan");

  if (trx.status === "WAITING_CONFIRM" && trx.ConfirmDeadline && trx.ConfirmDeadline < new Date()) {
    await moveToFailedStatus(trxId, ["WAITING_CONFIRM"], "CANCELED");
    throw new AppError(400, "Sudah lewat 3 hari, transaksi otomatis dibatalkan");
  }

  await prisma.$transaction(async (tx) => {
    const changed = await tx.transaction.updateMany({
      where: { id: trxId, status: { in: ["WAITING_CONFIRM", "WAITING_PAYMENT"] } },
      data: { status: "DONE" },
    });
    if (changed.count === 0) throw new AppError(409, "Transaksi tidak sedang menunggu konfirmasi");
    await createETickets(tx, trx);
  }, TX_OPTIONS);

  runInBackground(
    sendTransactionDecisionEmail({
      to: trx.user.email,
      name: trx.user.name,
      eventTitle: trx.event.title,
      transactionId: trx.id,
      status: "DONE",
    }),
  );

  return prisma.transaction.findUniqueOrThrow({ where: { id: trxId }, include: { eTickets: true } });
}

// Smart Reject: Mengembalikan Poin + Voucher + Kuota Tiket Event + Kirim Email
export async function rejectTransactionService(first: string, second: string, reason?: string) {
  let trx = await prisma.transaction.findFirst({
    where: { id: second, deletedAt: null },
    include: {
      user: { select: { email: true, name: true } },
      event: { select: { title: true } },
    },
  });
  let trxId = second;

  if (!trx) {
    const swapped = await prisma.transaction.findFirst({
      where: { id: first, deletedAt: null },
      include: {
        user: { select: { email: true, name: true } },
        event: { select: { title: true } },
      },
    });
    if (swapped) {
      trx = swapped;
      trxId = first;
    }
  }

  if (!trx) throw new AppError(404, "Transaksi tidak ditemukan");

  const result = await moveToFailedStatus(trxId, ["WAITING_CONFIRM", "WAITING_PAYMENT"], "REJECTED");
  if (!result) throw new AppError(409, "Transaksi tidak sedang menunggu konfirmasi");

  // Kembalikan kuota tiket ke Event (Kiel)
  const quotaField = trx.ticketType === "VIP" ? "vipQuota" :
    trx.ticketType === "PRESALE" ? "presaleQuota" : "regularQuota";

  await prisma.event.update({
    where: { id: trx.eventId },
    data: {
      [quotaField]: { increment: trx.quantity },
      totalQuotaTiket: { increment: trx.quantity },
    },
  });

  runInBackground(
    sendTransactionDecisionEmail({
      to: trx.user.email,
      name: trx.user.name,
      eventTitle: trx.event.title,
      transactionId: trx.id,
      status: "REJECTED",
      reason,
    }),
  );
  return result;
}

// ================= E. CRON SWEEP =================
export async function sweepOverdueTransactions() {
  const now = new Date();
  const [unpaid, unconfirmed] = await Promise.all([
    prisma.transaction.findMany({
      where: { status: "WAITING_PAYMENT", paymentDeadline: { lt: now } },
      select: { id: true },
      take: 100,
    }),
    prisma.transaction.findMany({
      where: { status: "WAITING_CONFIRM", ConfirmDeadline: { lt: now } },
      select: { id: true },
      take: 100,
    }),
  ]);
  for (const t of unpaid) await moveToFailedStatus(t.id, ["WAITING_PAYMENT"], "EXPIRED");
  for (const t of unconfirmed) await moveToFailedStatus(t.id, ["WAITING_CONFIRM"], "CANCELED");
  return { expired: unpaid.length, canceled: unconfirmed.length };
}