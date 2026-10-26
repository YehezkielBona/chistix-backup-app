import type { Request, Response, NextFunction } from "express";
import { parse } from "../utils/validate.js";
import { createReviewSchema, updateReviewSchema, reviewPageSchema } from "../middlewares/review.middleware.js";
import * as svc from "../services/review.service.js";

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