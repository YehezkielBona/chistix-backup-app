// ============================================================
// ATTENDEE & SCANNER ROUTES (backend/src/routes/attendee.routes.ts)
// Tugas: Menangkap HTTP Request dari Frontend (/api/organizer/attendees),
// mengecek hak akses Organizer (requireOrganizer), lalu meneruskan ke Controller.
// ============================================================
import { Router, Request, Response } from "express";
import { requireOrganizer } from "../middlewares/role.middleware.js";
import { sendResult } from "../lib/sendResult.js";
import {
  getOrganizerAttendeesController,
  scanCheckInTicketController,
} from "../controllers/attendee.controller.js";

export const organizerAttendeeRouter = Router();

// Pasang penjaga autentikasi Role Organizer
organizerAttendeeRouter.use(requireOrganizer);

// GET /api/organizer/attendees -> Mengambil seluruh daftar E-Ticket peserta
organizerAttendeeRouter.get("/", async (req: Request, res: Response) => {
  const organizerId = (req as any).user?.id;
  const result = await getOrganizerAttendeesController(organizerId);
  sendResult(res, result);
});

// POST /api/organizer/attendees/scan -> Memverifikasi & check-in kode tiket / QR
organizerAttendeeRouter.post("/scan", async (req: Request, res: Response) => {
  const organizerId = (req as any).user?.id;
  const result = await scanCheckInTicketController(req.body, organizerId);
  sendResult(res, result);
});
