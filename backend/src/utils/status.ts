// ============================================================
// Fungsi bantu untuk menghitung STATUS secara otomatis berdasarkan tanggal.
// Status tidak perlu di-update manual di database: setiap kali data dibaca,
// status dihitung ulang dari tanggal sekarang.
// ============================================================

// Tipe status event (sama persis dengan enum EventStatusEnum di schema.prisma)
export type EventStatus = "DRAFT" | "UPCOMING" | "ON_STAGE" | "ENDED";

/**
 * Hitung status event.
 * - Kalau disimpan sebagai DRAFT  -> tetap DRAFT (belum dipublish organizer)
 * - Sebelum startDate             -> UPCOMING
 * - Di antara startDate & endDate -> ON_STAGE (sedang berlangsung)
 * - Setelah endDate               -> ENDED
 */
export function calculateEventStatus(
  storedStatus: string,
  startDate: Date,
  endDate: Date,
): EventStatus {
  if (storedStatus === "DRAFT") return "DRAFT";

  const now = new Date();
  if (now < startDate) return "UPCOMING";
  if (now <= endDate) return "ON_STAGE";
  return "ENDED";
}

// Tipe status voucher (dihitung, TIDAK disimpan di database)
export type VoucherStatus = "SCHEDULED" | "ACTIVE" | "EXPIRED";

/**
 * Hitung status voucher dari periode berlakunya.
 * - Sebelum validStart -> SCHEDULED (terjadwal)
 * - Dalam periode      -> ACTIVE
 * - Lewat validEnd     -> EXPIRED (otomatis kadaluarsa)
 */
export function calculateVoucherStatus(validStart: Date, validEnd: Date): VoucherStatus {
  const now = new Date();
  if (now < validStart) return "SCHEDULED";
  if (now <= validEnd) return "ACTIVE";
  return "EXPIRED";
}
