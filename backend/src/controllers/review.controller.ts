import type { Request, Response, NextFunction } from "express";
import { parse } from "../utils/validate.js";
import { createReviewSchema, updateReviewSchema, reviewPageSchema } from "../middlewares/review.middleware.js";
import * as svc from "../services/review.service.js";
import { getOrganizerReviewService, replyOrganierReviewService } from "../services/review.service.js";

// ================= CUSTOMER REVIEWS (MUTI) =================
export async function pendingReviewsController(req: Request, res: Response, next: NextFunction) {
    try {
        const data = await svc.getPendingReviewsService(req.user!.id);
        res.json({ success: true, data });
    } catch (err) { next(err); }
}

export async function myReviewsController(req: Request, res: Response, next: NextFunction) {
    try {
        const q = parse(reviewPageSchema, req.query);
        res.json({ success: true, ...(await svc.getMyReviewsService(req.user!.id, q)) });
    } catch (err) { next(err); }
}

export async function createReviewController(req: Request, res: Response, next: NextFunction) {
    try {
        const input = parse(createReviewSchema, req.body);
        const data = await svc.createReviewService(req.user!.id, input);
        res.status(201).json({ success: true, message: "Review berhasil dikirim", data });
    } catch (err) { next(err); }
}

export async function updateReviewController(req: Request, res: Response, next: NextFunction) {
    try {
        const input = parse(updateReviewSchema, req.body);
        const data = await svc.updateReviewService(req.user!.id, String(req.params.id), input);
        res.json({ success: true, message: "Review berhasil diperbarui", data });
    } catch (err) { next(err); }
}

export async function deleteReviewController(req: Request, res: Response, next: NextFunction) {
    try {
        const data = await svc.deleteReviewService(req.user!.id, String(req.params.id));
        res.json({ success: true, message: "Review berhasil dihapus", data });
    } catch (err) { next(err); }
}

export async function eventReviewsController(req: Request, res: Response, next: NextFunction) {
    try {
        const q = parse(reviewPageSchema, req.query);
        res.json({ success: true, ...(await svc.getEventReviewsService(String(req.params.id), q)) });
    } catch (err) { next(err); }
}

// ================= ORGANIZER REVIEWS (KIEL) =================
export async function getOrganizerReviewController(organizerId?: string) {
  try {
    const data = await getOrganizerReviewService(organizerId);
    return {
      success: true,
      statusCode: 200,
      message: "Success load review list",
      data,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: error.statusCode || 500,
      message: "Fail load review list",
    };
  }
}

export async function replyOrganierReviewController(reviewId: string, body: { replyText?: string }, organizerId: string) {
  try {
    const replyText = String(body?.replyText || "");
    const data = await replyOrganierReviewService(reviewId, replyText, organizerId);

    return {
      success: true,
      statusCode: 200,
      message: "Successfully sent the reply",
      data,
    };
  } catch (error: any) {
    return {
        success: false,
        statusCode: error.statusCode || 400,
        message: error.message || "Failed to send reply"
    }
  }
}