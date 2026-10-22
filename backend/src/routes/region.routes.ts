// ============================================================
// Express Router untuk Wilayah Indonesia (Emsifa) & Upload Cloudinary
// - GET  /api/regions/provinces          -> daftar 34 provinsi
// - GET  /api/regions/cities/:provinceId -> daftar kota/kabupaten di provinsi tsb
// - POST /api/upload/signature           -> tanda tangan upload Cloudinary
// ============================================================
import { Router } from "express";
import {
  getProvincesController,
  getCitiesController,
  getCloudinarySignatureController,
} from "../controllers/region.controller.js";
import { sendResult } from "../lib/sendResult.js";

const regionRouter = Router();

// GET /api/regions/provinces
regionRouter.get("/provinces", async (_req, res) => {
  sendResult(res, await getProvincesController());
});

// GET /api/regions/cities/:provinceId
regionRouter.get("/cities/:provinceId", async (req, res) => {
  sendResult(res, await getCitiesController(String(req.params.provinceId)));
});

// ---------- Router Upload Cloudinary (/api/upload) ----------
const uploadRouter = Router();

// POST /api/upload/signature
uploadRouter.post("/signature", (req, res) => {
  const folder = req.body?.folder ? String(req.body.folder) : undefined;
  sendResult(res, getCloudinarySignatureController(folder));
});

export { regionRouter, uploadRouter };
