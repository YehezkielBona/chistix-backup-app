import type { Request, Response, NextFunction } from "express";
import { checkReferralCodeService } from "../services/referral.service.js";
import { customerOverviewService } from "../services/customer.service.js"; // [BARU]


// GET /api/referral/check?code=...
export async function referralCheckController(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await checkReferralCodeService(String(req.query.code ?? ""));
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// Tahap 5 nanti: customerOverviewController ditambahkan di file ini
// [BARU] GET /api/customer/overview
export async function customerOverviewController(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await customerOverviewService(req.user!.id); // req.user diisi requireRole
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}