import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";
import { parse } from "../utils/validate.js";
import { listQuerySchema, rejectSchema } from "../middlewares/transaction.middleware.js";
import * as svc from "../services/transaction.service.js";
import { 
    getOrganizerTransactionService,
    acceptTransactionService,
    rejectTransactionService,
    createTransactionService,
    getTransactionByIdService,
    type CreateTransactionInput
} from "../services/transaction.service.js";

const uid = (req: Request) => req.user!.id; // aman: requireRole sudah memastikan login
const trxId = (req: Request) => String(req.params.id);

// ---------- Customer (Muti) ----------
export async function myTransactionsController(req: Request, res: Response, next: NextFunction) {
  try {
    const query = parse(listQuerySchema, req.query);
    res.status(200).json({ success: true, ...(await svc.getMyTransactionsService(uid(req), query)) });
  } catch (err) { next(err); }
}

export async function myTransactionDetailController(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(200).json({ success: true, data: await svc.getMyTransactionDetailService(uid(req), trxId(req)) });
  } catch (err) { next(err); }
}

export async function uploadProofController(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new AppError(400, "File bukti bayar wajib diunggah (field: paymentProof)");
    const trx = await svc.uploadPaymentProofService(uid(req), trxId(req), req.file);
    res.status(200).json({ success: true, message: "Bukti bayar terkirim, menunggu konfirmasi organizer", data: trx });
  } catch (err) { next(err); }
}

export async function cancelController(req: Request, res: Response, next: NextFunction) {
  try {
    const trx = await svc.cancelByCustomerService(uid(req), trxId(req));
    res.status(200).json({ success: true, message: "Transaksi dibatalkan", data: trx });
  } catch (err) { next(err); }
}

// ---------- Organizer (Muti) ----------
export async function organizerTransactionsController(req: Request, res: Response, next: NextFunction) {
  try {
    const query = parse(listQuerySchema, req.query);
    res.status(200).json({ success: true, ...(await svc.getOrganizerTransactionsService(uid(req), query)) });
  } catch (err) { next(err); }
}

export async function acceptController(req: Request, res: Response, next: NextFunction) {
  try {
    const trx = await svc.acceptTransactionService(uid(req), trxId(req));
    res.status(200).json({ success: true, message: "Transaksi diterima, e-ticket dibuat", data: trx });
  } catch (err) { next(err); }
}

export async function rejectController(req: Request, res: Response, next: NextFunction) {
  try {
    const { reason } = parse(rejectSchema, req.body ?? {});
    const trx = await svc.rejectTransactionService(uid(req), trxId(req), reason);
    res.status(200).json({ success: true, message: "Transaksi ditolak, poin & voucher dikembalikan", data: trx });
  } catch (err) { next(err); }
}

// ---------- Cron (Muti) ----------
export async function cronSweepController(req: Request, res: Response, next: NextFunction) {
  try {
    const secret = process.env.CRON_SECRET;
    if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
      throw new AppError(401, "Unauthorized");
    }
    res.status(200).json({ success: true, data: await svc.sweepOverdueTransactions() });
  } catch (err) { next(err); }
}

// ---------- Customer Checkout & Payment (Kiel) ----------
export async function createTransactionController(input: CreateTransactionInput) {
  try {
    const data = await createTransactionService(input);
    return {
      success: true,
      statusCode: 201,
      message: "Transaction created successfuly",
      data,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: error.statusCode || 400,
      message: error.message || "Failed to create transaction",
    };
  }
}

export async function getTransactionByIdController(transactionId: string) {
  try {
    const data = await getTransactionByIdService(transactionId);
    return {
      success: true,
      statusCode: 200,
      message: "Transaction loaded successfully",
      data,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: error.statusCode || 404,
      message: error.message || "Transaction not found"
    };
  }
}

// ---------- Organizer Transactions & Actions (Kiel) ----------
export async function getOrganizerTransactionsController(organizerId?: string) {
  try {
    const defaultOrganizerId = organizerId || "organizer-1";
    const data = await getOrganizerTransactionService(defaultOrganizerId);
    return {
      success: true,
      statusCode: 200,
      message: "Success load transaction list",
      data,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: error.statusCode || 500,
      message: error.message || "Failed load transactions!",
    };
  }
}

export async function acceptTransactionController(transactionId: string, organizerId?: string) {
  try {
    const defaultOrganizerId = organizerId || "organizer-1";
    const data = await acceptTransactionService(transactionId, defaultOrganizerId);
    return {
      success: true,
      statusCode: 200,
      message: "Transaction Approved!",
      data,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: error.statusCode || 400,
      message: error.message || "Failed load transactions!",
    };
  }
}

export async function rejectTransactionController(transactionId: string, organizerId?: string) {
  try {
    const defaultOrganizerId = organizerId || "organizer-1";
    const data = await rejectTransactionService(transactionId, defaultOrganizerId);
    return {
      success: true,
      statusCode: 200,
      message: "Transaction Rejected! returned quota ticket",
      data,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: error.statusCode || 400,
      message: error.message || "Failed load transactions!"
    };
  }
}