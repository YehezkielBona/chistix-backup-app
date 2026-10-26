import { Router, type Request, type Response } from "express";
import { requireRole, requireOrganizer } from "../middlewares/role.middleware.js";
import { sendResult } from "../lib/sendResult.js";
import {
    pendingReviewsController,
    myReviewsController,
    createReviewController,
    updateReviewController,
    deleteReviewController,
    eventReviewsController,
    getOrganizerReviewController,
    replyOrganierReviewController,
} from "../controllers/review.controller.js";

// ================= CUSTOMER REVIEWS (MUTI) =================
// /api/reviews : khusus customer yang login
export const reviewRouter = Router();
reviewRouter.use(requireRole("CUSTOMER"));
reviewRouter.get("/pending", pendingReviewsController); // event yang perlu direview
reviewRouter.get("/me", myReviewsController);           // review milik saya
reviewRouter.post("/", createReviewController);
reviewRouter.patch("/:id", updateReviewController);
reviewRouter.delete("/:id", deleteReviewController);

// /api/events/:id/reviews : publik, dipasang di prefix /api/events
// File terpisah supaya event.routes.ts milik teman tidak perlu diubah
export const eventReviewRouter = Router();
eventReviewRouter.get("/:id/reviews", eventReviewsController);

// ================= ORGANIZER REVIEWS (KIEL) =================
// /api/organizer/reviews : khusus organizer yang login
export const organizerReviewRouter = Router();
organizerReviewRouter.use(requireOrganizer);

organizerReviewRouter.get("/", async (req: Request, res: Response) => {
    const organizerId = (req as any).user?.id;
    const result = await getOrganizerReviewController(organizerId);
    sendResult(res, result);
});

organizerReviewRouter.patch("/:id/reply", async (req: Request, res: Response) => {
    const organizerId = (req as any).user?.id;
    const { id } = req.params;
    const result = await replyOrganierReviewController(String(id), req.body, organizerId);
    sendResult(res, result);
});