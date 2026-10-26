import { Router } from "express";
import { requireRole } from "../middlewares/role.middleware.js"; // [BARU]
// [LAMA] import { referralCheckController } from "../controllers/customer.controller.js";
import { referralCheckController, customerOverviewController } from "../controllers/customer.controller.js";

// /api/referral : publik, karena dipakai sebelum user punya akun
export const referralRouter = Router();
referralRouter.get("/check", referralCheckController);

// [BARU] /api/customer : wajib login sebagai CUSTOMER
export const customerRouter = Router();
customerRouter.get("/overview", requireRole("CUSTOMER"), customerOverviewController);