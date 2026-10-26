// ============================================================
// Express Router untuk Event:
// 1. organizerEventRouter -> dipasang di /api/organizer/events (CRUD Organizer)
// 2. publicEventRouter    -> dipasang di /api/events (Publik & Search Suggest)
// ============================================================
import { Router } from "express";
import {
  getAllEventController,
  getEventDetailController,
  createEventController,
  updateEventController,
  softDeleteEventController,
  suggestEventController,
} from "../controllers/event.controller.js";
import { sendResult } from "../lib/sendResult.js";
import { requireOrganizer } from "../middlewares/role.middleware.js";
import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

const organizerEventRouter = Router();

// Proteksi role: jika user login sebagai CUSTOMER, tolak akses ke menu Organizer
organizerEventRouter.use(requireOrganizer);

// GET /api/organizer/events -> daftar semua event
organizerEventRouter.get("/", async (_req, res) => {
  sendResult(res, await getAllEventController());
});

// POST /api/organizer/events -> buat event baru
organizerEventRouter.post("/", async (req, res) => {
  const userId = (req as any).user?.id;
  sendResult(res, await createEventController(req.body, userId));
});

// GET /api/organizer/events/:id -> detail 1 event
organizerEventRouter.get("/:id", async (req, res) => {
  sendResult(res, await getEventDetailController(String(req.params.id)));
});

// PUT /api/organizer/events/:id -> edit event
organizerEventRouter.put("/:id", async (req, res) => {
  sendResult(res, await updateEventController(String(req.params.id), req.body));
});

// PATCH /api/organizer/events/:id/end

organizerEventRouter.put("/:id/end", async (req, res) => {
  const { id } = req.params;
  const updated = await prisma.event.update({
    where: { id: String(id) },
    data: { eventStatus: "ENDED" },
  });
  sendResult(res, {
    success: true, data: updated,
    statusCode: 201
  });
});

// DELETE /api/organizer/events/:id -> soft delete event
organizerEventRouter.delete("/:id", async (req, res) => {
  sendResult(res, await softDeleteEventController(String(req.params.id)));
});

// ---------- Router Publik (/api/events) ----------
const publicEventRouter = Router();

// URUTAN PENTING: route dengan kata tetap (/home, /suggest, /:id/reviews)
// harus SEBELUM /:id. Kalau tidak, Express mengira "home" adalah id event.

// [LAMA] GET /api/events -> semua event (termasuk DRAFT, tanpa pagination)
// publicEventRouter.get("/", async (_req, res) => {
//   sendResult(res, await getAllEventController());
// });
// [BARU] GET /api/events -> browse: search + filter + sort + pagination di backend
publicEventRouter.get("/", listPublicEventsController);

// [BARU] GET /api/events/home -> 3 baris homepage (presale, terdekat, populer)
publicEventRouter.get("/home", homeEventsController);

// GET /api/events/suggest?q=... -> saran pencarian di SearchForm navbar
publicEventRouter.get("/suggest", async (req, res) => {
  const q = String(req.query.q ?? "");
  const result = await suggestEventController(q);
  res.status(result.statusCode).json({ suggestions: result.suggestions });
});

// [BARU] GET /api/events/:id/reviews -> review per event (aktifkan di Tahap 2)
// publicEventRouter.get("/:id/reviews", eventReviewsController);

// [LAMA] GET /api/events/:id -> detail event (DRAFT ikut tampil)
// publicEventRouter.get("/:id", async (req, res) => {
//   sendResult(res, await getEventDetailController(String(req.params.id)));
// });
// [BARU] GET /api/events/:id -> detail publik (DRAFT/dihapus = 404) + rating organizer
// SELALU taruh paling bawah
publicEventRouter.get("/:id", publicEventDetailController);

export { organizerEventRouter, publicEventRouter };