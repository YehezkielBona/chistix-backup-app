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

// Kembalikan poin & voucher yang dipakai transaksi.
// Kursi tidak perlu dikembalikan manual: transaksi gagal tidak dihitung sebagai kursi terjual.
async function restoreResources(tx: Db, trx: Transaction) {
  if (trx.pointUsed > 0) {
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
  // TODO schema v2: kembalikan kupon (couponUsedAt = null) kalau trx.couponDiscount > 0
}

// Ubah ke status gagal + rollback dalam SATU SQL transaction.
// Kalau status sudah bukan `from` (diubah proses lain), return null -> rollback tidak jalan dua kali.
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
      qrToken: crypto.randomUUID(), // isi QR, dipakai scanner
    })),
  });
}

// Data yang ikut diambil untuk daftar & detail transaksi
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

// ================= B. CUSTOMER =================

// TODO schema v2: previewCheckoutService & checkoutService

// GET /api/transactions
export async function getMyTransactionsService(userId: string, q: ListQuery) {
  await sweepOverdueTransactions(); // pastikan status deadline sudah terbaru
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

// GET /api/transactions/:id
export async function getMyTransactionDetailService(userId: string, trxId: string) {
  const current = await prisma.transaction.findFirst({
    where: { id: trxId, userId, deletedAt: null },
    select: { status: true, paymentDeadline: true, ConfirmDeadline: true },
  });
  if (!current) throw new AppError(404, "Transaksi tidak ditemukan");

  // Cek deadline transaksi ini saat dibuka, tanpa menunggu cron
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
  return { ...trx, serverTime: now.toISOString() }; // serverTime untuk countdown di frontend
}

// POST /api/transactions/:id/payment-proof
export async function uploadPaymentProofService(userId: string, trxId: string, file: Express.Multer.File) {
  const trx = await prisma.transaction.findFirst({ where: { id: trxId, userId, deletedAt: null } });
  if (!trx) throw new AppError(404, "Transaksi tidak ditemukan");

  const now = new Date();
  if (trx.status === "WAITING_PAYMENT" && trx.paymentDeadline < now) {
    await moveToFailedStatus(trx.id, ["WAITING_PAYMENT"], "EXPIRED");
    throw new AppError(400, "Batas waktu 2 jam sudah lewat, transaksi otomatis expired");
  }
  if (trx.status !== "WAITING_PAYMENT" && trx.status !== "WAITING_CONFIRM") {
    throw new AppError(400, `Transaksi berstatus ${trx.status}, bukti bayar tidak bisa diunggah`);
  }

  // 1. Upload ke Cloudinary dulu
  const uploaded = await uploadImageBuffer(file.buffer, "chistix/payment-proofs");

  // 2. Simpan URL + ubah status (hanya kalau status belum berubah)
  const updated = await prisma.transaction.updateMany({
    where: { id: trx.id, status: { in: ["WAITING_PAYMENT", "WAITING_CONFIRM"] } },
    data: {
      paymentProof: uploaded.url,
      status: "WAITING_CONFIRM",
      // batas 3 hari dihitung dari upload PERTAMA, upload ulang tidak memperpanjang
      ConfirmDeadline: trx.ConfirmDeadline ?? new Date(now.getTime() + CONFIRM_WINDOW_MS),
    },
  });
  if (updated.count === 0) {
    await deleteImage(uploaded.publicId); // jangan tinggalkan file yatim di Cloudinary
    throw new AppError(409, "Status transaksi sudah berubah, silakan muat ulang halaman");
  }

  // 3. Hapus file lama dari Cloudinary (syarat requirement)
  const oldId = trx.paymentProof ? publicIdFromUrl(trx.paymentProof) : null;
  if (oldId) runInBackground(deleteImage(oldId));

  return prisma.transaction.findUniqueOrThrow({ where: { id: trx.id } });
}

// PATCH /api/transactions/:id/cancel
export async function cancelByCustomerService(userId: string, trxId: string) {
  const owned = await prisma.transaction.findFirst({ where: { id: trxId, userId }, select: { id: true } });
  if (!owned) throw new AppError(404, "Transaksi tidak ditemukan");

  const result = await moveToFailedStatus(trxId, ["WAITING_PAYMENT"], "CANCELED");
  if (!result) throw new AppError(400, "Hanya transaksi Waiting for Payment yang bisa dibatalkan");
  return result;
}

// ================= C. ORGANIZER =================

// GET /api/organizer/transactions
export async function getOrganizerTransactionsService(organizerId: string, q: ListQuery) {
  await sweepOverdueTransactions();
  const where: Prisma.TransactionWhereInput = {
    deletedAt: null,
    event: { organizerId }, // hanya transaksi event miliknya
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

async function findOrganizerTransaction(organizerId: string, trxId: string) {
  const trx = await prisma.transaction.findFirst({
    where: { id: trxId, deletedAt: null, event: { organizerId } },
    include: {
      user: { select: { email: true, name: true } },
      event: { select: { title: true } },
    },
  });
  if (!trx) throw new AppError(404, "Transaksi tidak ditemukan");
  return trx;
}

// PATCH /api/organizer/transactions/:id/accept
export async function acceptTransactionService(organizerId: string, trxId: string) {
  const trx = await findOrganizerTransaction(organizerId, trxId);

  if (trx.status === "WAITING_CONFIRM" && trx.ConfirmDeadline && trx.ConfirmDeadline < new Date()) {
    await moveToFailedStatus(trxId, ["WAITING_CONFIRM"], "CANCELED");
    throw new AppError(400, "Sudah lewat 3 hari, transaksi otomatis dibatalkan");
  }

  // Status DONE dan e-ticket dibuat dalam satu SQL transaction
  await prisma.$transaction(async (tx) => {
    const changed = await tx.transaction.updateMany({
      where: { id: trxId, status: "WAITING_CONFIRM" },
      data: { status: "DONE" },
    });
    if (changed.count === 0) throw new AppError(409, "Transaksi tidak sedang menunggu konfirmasi");
    await createETickets(tx, trx);
  }, TX_OPTIONS);

  // Email dikirim di background, tidak menahan response
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

// PATCH /api/organizer/transactions/:id/reject
export async function rejectTransactionService(organizerId: string, trxId: string, reason?: string) {
  const trx = await findOrganizerTransaction(organizerId, trxId);

  const result = await moveToFailedStatus(trxId, ["WAITING_CONFIRM"], "REJECTED");
  if (!result) throw new AppError(409, "Transaksi tidak sedang menunggu konfirmasi");

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

// ================= D. OTOMATIS =================
// Dipanggil oleh: endpoint daftar transaksi, interval lokal, dan Vercel Cron
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