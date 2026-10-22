// ============================================================
// Voucher Controller: Validasi Zod & memanggil Voucher Service.
// ============================================================
import { createVoucherSchema } from "../middlewares/voucher.middleware.js";
import {
  getAllVouchersService,
  getVoucherByIdService,
  createVoucherService,
  updateVoucherService,
  softDeleteVoucherService,
  validateAndUseVoucherService,
} from "../services/voucher.service.js";

// 1. GET /api/organizer/vouchers
export async function getVouchersController() {
  const result = await getAllVouchersService();
  return {
    success: true,
    statusCode: 200,
    data: result,
  };
}

// 2. GET /api/organizer/vouchers/:id
export async function getVoucherDetailController(voucherId: string) {
  const voucher = await getVoucherByIdService(voucherId);
  if (!voucher) {
    return {
      success: false,
      statusCode: 404,
      message: "Voucher tidak ditemukan",
    };
  }
  return {
    success: true,
    statusCode: 200,
    data: voucher,
  };
}

// 3. POST /api/organizer/vouchers
export async function createVoucherController(inputData: unknown) {
  const validation = createVoucherSchema.safeParse(inputData);
  if (!validation.success) {
    const firstMsg = validation.error.issues[0]?.message || "Validasi gagal";
    return {
      success: false,
      statusCode: 400,
      message: firstMsg,
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const outcome = await createVoucherService(validation.data);

  if ("duplicate" in outcome) {
    return {
      success: false,
      statusCode: 400,
      message: `Kode voucher "${validation.data.code}" sudah digunakan`,
    };
  }

  if ("noEligibleEvents" in outcome) {
    return {
      success: false,
      statusCode: 400,
      message: "Tidak ada event berstatus DRAFT atau UPCOMING yang tersedia",
    };
  }

  if ("createdAll" in outcome && Array.isArray(outcome.data)) {
    return {
      success: true,
      statusCode: 201,
      data: outcome.data,
      message: `${outcome.data.length} voucher berhasil dibuat untuk semua event aktif`,
    };
  }

  return {
    success: true,
    statusCode: 201,
    data: outcome.data,
    message: "Voucher berhasil dibuat",
  };
}

// 4. PUT /api/organizer/vouchers/:id
export async function updateVoucherController(voucherId: string, inputData: unknown) {
  const validation = createVoucherSchema.safeParse(inputData);
  if (!validation.success) {
    const firstMsg = validation.error.issues[0]?.message || "Validasi gagal";
    return {
      success: false,
      statusCode: 400,
      message: firstMsg,
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const updated = await updateVoucherService(voucherId, validation.data);
  if (!updated) {
    return {
      success: false,
      statusCode: 404,
      message: "Voucher tidak ditemukan",
    };
  }

  return {
    success: true,
    statusCode: 200,
    data: updated,
    message: "Voucher berhasil diperbarui",
  };
}

// 5. DELETE /api/organizer/vouchers/:id (Soft Delete)
export async function softDeleteVoucherController(voucherId: string) {
  const ok = await softDeleteVoucherService(voucherId);
  if (!ok) {
    return {
      success: false,
      statusCode: 404,
      message: "Voucher tidak ditemukan",
    };
  }
  return {
    success: true,
    statusCode: 200,
    message: "Voucher berhasil dihapus (Soft Delete)",
  };
}

// 6. POST /api/vouchers/validate (dipakai halaman Cart saat checkout)
export async function validateVoucherController(code: string, eventId: string) {
  const result = await validateAndUseVoucherService(code, eventId);
  if ("error" in result) {
    return {
      success: false,
      statusCode: 400,
      message: result.error,
    };
  }

  return {
    success: true,
    statusCode: 200,
    message: "Voucher berhasil dipasang",
    data: result.voucher,
  };
}
