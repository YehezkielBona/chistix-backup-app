// ============================================================
// Helper untuk mengirim hasil Controller ke Response Express.
// Menggantikan NextResponse.json(...) yang dulu dipakai di Next.js API.
// ============================================================
import type { Response } from "express";

export type ControllerResult = {
  success: boolean;
  message?: string;
  data?: unknown;
  errors?: unknown;
  statusCode: number;
};

export function sendResult(res: Response, result: ControllerResult) {
  return res.status(result.statusCode).json({
    success: result.success,
    message: result.message,
    data: result.data,
    errors: result.errors,
  });
}
