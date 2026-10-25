import type { Request, Response, NextFunction } from "express";
import { parse } from "../utils/validate.js";
import { eventQuerySchema } from "../middlewares/eventQuery.middleware.js";
import * as svc from "../services/publicEvent.service.js";
export async function listPublicEventsController(req: Request, res: Response,
    next: NextFunction) {
    try {
        const query = parse(eventQuerySchema, req.query);
        res.status(200).json({
            success: true, ...(await
                svc.listPublicEventsService(query))
        });
    } catch (err) { next(err); }
}
export async function homeEventsController(_req: Request, res: Response,
    next: NextFunction) {
    try {
        res.status(200).json({
            success: true, data: await svc.homeEventsService()
        });
    } catch (err) { next(err); }
}
export async function publicEventDetailController(req: Request, res:
    Response, next: NextFunction) {
    try {
        res.status(200).json({
            success: true, data: await
                svc.publicEventDetailService(String(req.params.id))
        });
    } catch (err) { next(err); }
}