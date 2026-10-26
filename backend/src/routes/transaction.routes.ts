import { Router, Request, Response } from "express";
import { requireOrganizer } from "../middlewares/role.middleware.js";
import {
  getOrganizerTransactionsController,
  acceptTransactionController,
  rejectTransactionController,
  createTransactionController,
  getTransactionByIdController
} from "../controllers/transaction.controller.js";
import { sendResult } from "../lib/sendResult.js";

export const organizerTransactionRouter = Router();

organizerTransactionRouter.use(requireOrganizer);

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

organizerTransactionRouter.patch("/:id/accept", handleAccept);
organizerTransactionRouter.put("/:id/accept", handleAccept);

organizerTransactionRouter.patch("/:id/reject", handleReject);
organizerTransactionRouter.put("/:id/reject", handleReject);

// router transaksi untuk customer publik/checkout

export const customerTransactionRouter = Router ()

customerTransactionRouter.post("/", async (req: Request, res: Response) => {
  const userId = (req as any).user?.id
  const result = await createTransactionController({
    ...req.body,
    userId: userId || req.body.userId,
  })
  sendResult(res, result)
})

// Endpoint: GET /api/transactions/:id (Ambil detail pembayaran & batas waktu)
customerTransactionRouter.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await getTransactionByIdController(String(id));
  sendResult(res, result);
});