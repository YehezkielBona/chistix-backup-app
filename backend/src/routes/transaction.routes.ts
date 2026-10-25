import { Router, Request, Response } from "express";
import { requireOrganizer } from "../middlewares/role.middleware.js";
import { getOrganizerTransactionsController, acceptTransactionController, rejectTransactionController } from "../controllers/transaction.controller.js";
import { sendResult } from "../lib/sendResult.js";

export const organizerTransactionRouter = Router()

organizerTransactionRouter.use(requireOrganizer) // -> tujuan proteksi akses untuk role organizer

organizerTransactionRouter.get("/", async (req: Request, res: Response) => {
    const organizerId = (req as any).user?.id
    const result = await getOrganizerTransactionsController(organizerId)
    sendResult(res, result)
})

organizerTransactionRouter.put(":/id/accept", async (req: Request, res: Response) => {
    const organizerId = (req as any).user?.id
    const {id} = req.params
    const result = await acceptTransactionController(String(id), organizerId)
    sendResult(res, result)
})

organizerTransactionRouter.put("/:id/reject", async (req: Request, res: Response) => {
    const organizerId = (req as any).user?.id
    const {id} = req.params
    const result = await rejectTransactionController(String(id), organizerId)
    sendResult(res, result)
})