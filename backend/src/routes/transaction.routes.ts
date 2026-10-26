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

// ================= CUSTOMER TRANSACTIONS & CHECKOUT =================
// Router gabungan untuk customer (mendukung Checkout Kiel + Riwayat Muti)
export const customerTransactionRouter = Router();

// 1. Checkout tiket (Kiel)
customerTransactionRouter.post("/", async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const result = await createTransactionController({
    ...req.body,
    userId: userId || req.body.userId,
  });
  sendResult(res, result);
});

// 2. Ambil detail pembayaran & batas countdown 10 menit (Kiel)
customerTransactionRouter.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await getTransactionByIdController(String(id));
  sendResult(res, result);
});

// Export juga sebagai transactionRouter agar kompatibel dengan server.ts milik Muti
export const transactionRouter = customerTransactionRouter;

// 3. Fitur riwayat & aksi customer (Muti)
transactionRouter.get("/me/list", requireRole("CUSTOMER"), c.myTransactionsController);
transactionRouter.post("/:id/payment-proof", requireRole("CUSTOMER"), uploadPaymentProof, c.uploadProofController);
transactionRouter.patch("/:id/cancel", requireRole("CUSTOMER"), c.cancelController);


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