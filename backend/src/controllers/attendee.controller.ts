// ============================================================
// ATTENDEE & SCANNER CONTROLLER (backend/src/controllers/attendee.controller.ts)
// Tugas: Menerima parameter dari Route, memanggil Service terkait,
// dan mengembalikan struktur { success, statusCode, message, data }.
// ============================================================
import {
  getOrganizerAttendeesService,
  scanCheckInTicketService,
} from "../services/attendee.service.js";

// 1. Controller Ambil Daftar Seluruh Peserta (Attendee List)
export async function getOrganizerAttendeesController(organizerId?: string) {
  try {
    const data = await getOrganizerAttendeesService(organizerId);
    return {
      success: true,
      statusCode: 200,
      message: "Berhasil memuat daftar peserta event",
      data,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: error.statusCode || 500,
      message: error.message || "Gagal memuat daftar peserta",
    };
  }
}

// 2. Controller Proses Scan QR / Check-In Tiket
export async function scanCheckInTicketController(
  body: { ticketCode?: string; eventId?: string },
  organizerId?: string
) {
  try {
    const ticketCode = String(body?.ticketCode || "");
    const eventId = body?.eventId ? String(body.eventId) : undefined;

    const result = await scanCheckInTicketService(ticketCode, eventId, organizerId);

    // Meskipun tiket INVALID atau ALREADY_USED, kita tetap kembalikan HTTP 200
    // dengan field scanStatus di dalam data agar UI Scanner bisa menampilkan kartu status dengan mulus.
    return {
      success: result.scanStatus === "SUCCESS",
      statusCode: 200,
      message: result.message,
      data: result,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: error.statusCode || 500,
      message: error.message || "Terjadi kesalahan saat memverifikasi tiket",
    };
  }
}
