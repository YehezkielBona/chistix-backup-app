import { Router } from "express";
import { requireRole } from "../middlewares/role.middleware.js";
import {
    pendingReviewsController,
    myReviewsController,
    createReviewController,
    updateReviewController,
    deleteReviewController,
    eventReviewsController,
} from "../controllers/review.controller.js";

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