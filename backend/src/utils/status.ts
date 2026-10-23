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
 * - Kalau disimpan sebagai ENDED  -> tetap ENDED (diakhiri manual oleh organizer)
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
  if (storedStatus === "ENDED") return "ENDED";

  const now = new Date();
  if (now < startDate) return "UPCOMING";
  if (now <= endDate) return "ON_STAGE";
  return "ENDED";
}

// Fase penjualan tiket (dihitung dinamis, tidak perlu kolom baru di database)
export type TicketSalesPhase =
  | "PRESALE_UPCOMING"
  | "PRESALE_ACTIVE"
  | "GENERAL_SALES"
  | "SALES_CLOSED";

/**
 * Menghitung fase penjualan tiket secara presisi:
 * 1. salesCloseDate (Batas Akhir Penjualan): Tepat H-1 sebelum startDate (24 jam sebelum acara dimulai).
 * 2. Jika waktu sekarang sudah melewati batas H-1, maka fase = SALES_CLOSED.
 * 3. Jika event mengaktifkan Presale:
 *    - Sebelum presaleStart -> PRESALE_UPCOMING (tiket presale belum buka)
 *    - Di antara presaleStart s/d presaleEnd -> PRESALE_ACTIVE (hanya tiket presale yang aktif)
 *    - Setelah presaleEnd s/d batas H-1 -> GENERAL_SALES (tiket VIP & Regular otomatis aktif)
 * 4. Jika event tidak mengaktifkan Presale:
 *    - Langsung GENERAL_SALES sampai batas H-1.
 */
export function calculateTicketSalesPhase(params: {
  startDate: Date;
  isPresale: boolean;
  presaleStart?: Date | null;
  presaleEnd?: Date | null;
}): {
  phase: TicketSalesPhase;
  salesCloseDate: Date;
  vipRegularStartDate: Date | null;
} {
  const now = new Date();

  // Rumus Matematika H-1: kurangi 24 jam x 60 menit x 60 detik x 1000 milidetik dari startDate
  const oneDayInMs = 24 * 60 * 60 * 1000;
  const salesCloseDate = new Date(params.startDate.getTime() - oneDayInMs);

  // Jika waktu sekarang sudah melewati batas H-1, seluruh penjualan ditutup
  if (now > salesCloseDate) {
    return {
      phase: "SALES_CLOSED",
      salesCloseDate,
      vipRegularStartDate: params.presaleEnd || null,
    };
  }

  // Jika event memiliki Presale yang terjadwal
  if (params.isPresale && params.presaleStart && params.presaleEnd) {
    if (now < params.presaleStart) {
      return {
        phase: "PRESALE_UPCOMING",
        salesCloseDate,
        vipRegularStartDate: params.presaleEnd,
      };
    }

    if (now <= params.presaleEnd) {
      return {
        phase: "PRESALE_ACTIVE",
        salesCloseDate,
        vipRegularStartDate: params.presaleEnd,
      };
    }

    // Presale sudah berakhir dan belum H-1: tiket VIP & Regular otomatis aktif
    return {
      phase: "GENERAL_SALES",
      salesCloseDate,
      vipRegularStartDate: params.presaleEnd,
    };
  }

  // Event standar tanpa presale: langsung buka penjualan VIP & Regular
  return {
    phase: "GENERAL_SALES",
    salesCloseDate,
    vipRegularStartDate: null,
  };
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
