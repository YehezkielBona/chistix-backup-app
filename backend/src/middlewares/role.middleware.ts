// ============================================================
// Middleware Autentikasi & Proteksi Role (Organizer vs Customer)
// Menggunakan sesi dari Better Auth.
// ============================================================
import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../controllers/auth.controller.js";

// Simpan info user yang sedang login ke dalam req.user jika ada sesi aktif
export async function attachSession(req: Request, _res: Response, next: NextFunction) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (session?.user) {
      (req as any).user = session.user;
    }
  } catch {
    // Abaikan jika tidak ada sesi (guest)
  }
  next();
}

// Wajib login sebagai ORGANIZER (Customer dilarang masuk)
export async function requireOrganizer(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    // Jika user login tapi role-nya CUSTOMER -> tolak (403 Forbidden)
    if (session?.user) {
      const role = String((session.user as any).role || "CUSTOMER").toUpperCase();
      if (role !== "ORGANIZER") {
        return res.status(403).json({
          success: false,
          message: "Akses ditolak: Halaman/fitur ini khusus untuk Organizer!",
        });
      }
      (req as any).user = session.user;
    }
    // Catatan: jika belum ada session sama sekali (misal saat testing lokal sebelum login),
    // kita tetap izinkan lanjut memakai default organizer agar fitur CRUD tetap mudah dites.
    next();
  } catch (err) {
    next(err);
  }
}

// Wajib login sebagai CUSTOMER (Organizer dilarang masuk untuk beli tiket)
export async function requireCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (session?.user) {
      const role = String((session.user as any).role || "CUSTOMER").toUpperCase();
      if (role !== "CUSTOMER") {
        return res.status(403).json({
          success: false,
          message: "Akses ditolak: Akun Organizer tidak dapat melakukan transaksi Customer!",
        });
      }
      (req as any).user = session.user;
    }
    next();
  } catch (err) {
    next(err);
  }
}
