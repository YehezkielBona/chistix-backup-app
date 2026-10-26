import { Router, Request, Response } from "express";
import { requireOrganizer } from "../middlewares/role.middleware.js";
import {
  getOrganizerTransactionsController,
  acceptTransactionController,
  rejectTransactionController,
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
