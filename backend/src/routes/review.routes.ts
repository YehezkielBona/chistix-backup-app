import { Router, Request, Response } from "express";
import { requireOrganizer } from "../middlewares/role.middleware.js";
import { sendResult } from "../lib/sendResult.js";
import { getOrganizerReviewController, replyOrganierReviewController } from "../controllers/review.controller.js";

export const organizerReviewRouter = Router()

organizerReviewRouter.use(requireOrganizer)

organizerReviewRouter.get("/", async (req: Request, res: Response) => {
    const organizerId = (req as any).user?.id
    const result = await getOrganizerReviewController(organizerId)
    sendResult(res, result)
})

organizerReviewRouter.patch("/:id/reply", async (req: Request, res: Response) => {
    const organizerId = (req as any).user?.id
    const {id} = req.params
    const result = await replyOrganierReviewController(String(id), req.body, organizerId)
    sendResult(res, result)
})