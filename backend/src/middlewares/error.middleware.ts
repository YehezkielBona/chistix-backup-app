// ============================================================
// Global Error Handler Middleware untuk Express.
// Menangkap semua error (baik AppError maupun error tak terduga)
// lalu mengirim respons JSON yang rapi ke frontend.
// ============================================================
import type { Request, Response, NextFunction } from "express";
import multer from "multer";
import { AppError } from "../utils/AppError.js";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  // BARU: error dari Multer (file terlalu besar, terlalu banyak file, nama field salah)
  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE" ? "Ukuran file maksimal 2 MB" : err.message;
    return res.status(400).json({
      success: false,
      message,
      errors: { code: err.code },
    });
  }
  
  // Jika error berasal dari AppError yang kita lempar sengaja di service
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  // Error tak terduga (bug / koneksi DB putus)
  console.error("🔥 [Express Unhandled Error]:", err);
  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
    errors: err.message,
  });
}
