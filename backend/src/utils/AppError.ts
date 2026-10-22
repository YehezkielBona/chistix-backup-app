// ============================================================
// AppError = error "yang kita sengaja" (bukan bug).
// Contoh: data tidak ditemukan (404), input salah (400), belum login (401).
//
// Cara pakai di service:
//   throw new AppError(404, "Event tidak ditemukan");
//
// Error ini akan ditangkap oleh error.middleware.ts lalu dikirim ke
// frontend sebagai JSON: { success: false, message: "...", errors: ... }
// ============================================================
export class AppError extends Error {
  statusCode: number;
  errors?: unknown;

  constructor(statusCode: number, message: string, errors?: unknown) {
    super(message); // isi properti "message" milik class Error bawaan
    this.statusCode = statusCode;
    this.errors = errors;
  }
}
