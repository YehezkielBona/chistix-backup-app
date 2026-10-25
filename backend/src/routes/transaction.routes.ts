import { Router } from "express";
import * as c from "../controllers/transaction.controller.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { uploadPaymentProof } from "../middlewares/upload.middleware.js";

// /api/transactions : khusus CUSTOMER
export const transactionRouter = Router();
transactionRouter.use(requireRole("CUSTOMER"));
// TODO schema v2: transactionRouter.post("/preview", c.previewController);
// TODO schema v2: transactionRouter.post("/", c.checkoutController);
transactionRouter.get("/", c.myTransactionsController);
transactionRouter.get("/:id", c.myTransactionDetailController);
transactionRouter.post("/:id/payment-proof", uploadPaymentProof, c.uploadProofController); // login dulu, baru Multer
transactionRouter.patch("/:id/cancel", c.cancelController);

// /api/organizer/transactions : khusus ORGANIZER
export const organizerTransactionRouter = Router();
organizerTransactionRouter.use(requireRole("ORGANIZER"));
organizerTransactionRouter.get("/", c.organizerTransactionsController);
organizerTransactionRouter.patch("/:id/accept", c.acceptController);
organizerTransactionRouter.patch("/:id/reject", c.rejectController);

// /api/cron : dipanggil Vercel Cron setiap hari
export const cronRouter = Router();
cronRouter.get("/transactions", c.cronSweepController);