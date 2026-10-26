// ============================================================
// Express Router untuk Voucher:
// 1. organizerVoucherRouter -> /api/organizer/vouchers (CRUD + Validate)
// 2. publicVoucherRouter    -> /api/vouchers (Validate saat Customer Checkout)
// ============================================================
import { Router } from "express";
import {
  getVouchersController,
  getVoucherDetailController,
  createVoucherController,
  updateVoucherController,
  softDeleteVoucherController,
  validateVoucherController,
} from "../controllers/voucher.controller.js";
import { sendResult } from "../lib/sendResult.js";
import { requireOrganizer, requireCustomer } from "../middlewares/role.middleware.js";

const organizerVoucherRouter = Router();

organizerVoucherRouter.use(requireOrganizer);

// GET /api/organizer/vouchers
organizerVoucherRouter.get("/", async (_req, res) => {
  sendResult(res, await getVouchersController());
});

// POST /api/organizer/vouchers
organizerVoucherRouter.post("/", async (req, res) => {
  const organizerId = (req as any).user?.id
  sendResult(res, await createVoucherController(req.body));
});

// POST /api/organizer/vouchers/validate (jaga-jaga jika ada kode lama yang memanggil path ini)
organizerVoucherRouter.post("/validate", async (req, res) => {
  const { code, eventId } = req.body ?? {};
  if (!code || !eventId) {
    return res
      .status(400)
      .json({ success: false, message: "Code dan EventId wajib diisi" });
  }
  sendResult(res, await validateVoucherController(String(code), String(eventId)));
});

// GET /api/organizer/vouchers/:id
organizerVoucherRouter.get("/:id", async (req, res) => {
  sendResult(res, await getVoucherDetailController(String(req.params.id)));
});

// PUT /api/organizer/vouchers/:id
organizerVoucherRouter.put("/:id", async (req, res) => {
  sendResult(res, await updateVoucherController(String(req.params.id), req.body));
});

// DELETE /api/organizer/vouchers/:id (Soft Delete)
organizerVoucherRouter.delete("/:id", async (req, res) => {
  sendResult(res, await softDeleteVoucherController(String(req.params.id)));
});

// ---------- Router Publik / Customer (/api/vouchers) ----------
const publicVoucherRouter = Router();

// POST /api/vouchers/validate -> dipakai halaman Cart saat Customer memakai voucher
publicVoucherRouter.post("/validate", requireCustomer, async (req, res) => {
  const { code, eventId } = req.body ?? {};
  if (!code || !eventId) {
    return res
      .status(400)
      .json({ success: false, message: "Code dan EventId wajib diisi" });
  }
  sendResult(res, await validateVoucherController(String(code), String(eventId)));
});

export { organizerVoucherRouter, publicVoucherRouter };
