import { Router, type Request, type Response, type NextFunction } from "express";
import * as c from "../controllers/transaction.controller.js";
import {
  createTransactionController,
  getTransactionByIdController,
  getOrganizerTransactionsController,
  acceptTransactionController,
  rejectTransactionController
} from "../controllers/transaction.controller.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { uploadPaymentProof } from "../middlewares/upload.middleware.js";
import { sendResult } from "../lib/sendResult.js";
import { prisma } from "../lib/prisma.js";

// ================= CUSTOMER TRANSACTIONS & CHECKOUT =================
export const customerTransactionRouter = Router();

// 1. GET /api/transactions -> Riwayat transaksi customer (Customer Dashboard)
customerTransactionRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.id) {
    return c.myTransactionsController(req, res, next);
  }
  // Fallback ke user customer yang pertama jika testing lokal
  const defaultCustomer = await prisma.user.findFirst({ where: { role: "CUSTOMER" } });
  if (defaultCustomer) {
    req.user = {
      id: defaultCustomer.id,
      email: defaultCustomer.email,
      name: defaultCustomer.name,
      role: "CUSTOMER",
    };
  }
  return c.myTransactionsController(req, res, next);
});

// 2. POST /api/transactions -> Checkout tiket (Kiel)
customerTransactionRouter.post("/", async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const result = await createTransactionController({
    ...req.body,
    userId: userId || req.body.userId,
  });
  sendResult(res, result);
});

// 3. Konfirmasi customer sudah bayar (Yes I already paid)
customerTransactionRouter.patch("/:id/paid", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        status: "WAITING_CONFIRM",
        ConfirmDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
    });
    sendResult(res, { success: true, statusCode: 200, message: "Status updated to WAITING_CONFIRM", data: updated });
  } catch (err: any) {
    sendResult(res, { success: false, statusCode: 400, message: err.message });
  }
});

// 4. Batalkan transaksi
customerTransactionRouter.patch("/:id/cancel", c.cancelController);

// 4. Upload bukti pembayaran
customerTransactionRouter.post("/:id/payment-proof", uploadPaymentProof, c.uploadProofController);

// 5. GET /api/transactions/:id -> Ambil detail pembayaran & batas countdown (Kiel)
customerTransactionRouter.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await getTransactionByIdController(String(id));
  sendResult(res, result);
});

// Alias untuk kompatibilitas
export const transactionRouter = customerTransactionRouter;


// ================= ORGANIZER TRANSACTIONS =================
export const organizerTransactionRouter = Router();

organizerTransactionRouter.get("/", async (req: Request, res: Response) => {
  const organizerId = (req as any).user?.id;
  const result = await getOrganizerTransactionsController(organizerId);
  sendResult(res, result);
});

const handleAccept = async (req: Request, res: Response) => {
  const organizerId = (req as any).user?.id;
  const { id } = req.params;
  const result = await acceptTransactionController(String(id), organizerId);
  sendResult(res, result);
};

const handleReject = async (req: Request, res: Response) => {
  const organizerId = (req as any).user?.id;
  const { id } = req.params;
  const result = await rejectTransactionController(String(id), organizerId);
  sendResult(res, result);
};

// Dukung method PATCH maupun PUT
organizerTransactionRouter.patch("/:id/accept", handleAccept);
organizerTransactionRouter.put("/:id/accept", handleAccept);

organizerTransactionRouter.patch("/:id/reject", handleReject);
organizerTransactionRouter.put("/:id/reject", handleReject);


// ================= CRON =================
export const cronRouter = Router();
cronRouter.get("/transactions", c.cronSweepController);
