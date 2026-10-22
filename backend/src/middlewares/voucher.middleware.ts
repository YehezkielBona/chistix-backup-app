// ============================================================
// Schema validasi Zod untuk Voucher (Create & Update).
// ============================================================
import { z } from "zod";

export const createVoucherSchema = z
  .object({
    code: z
      .string()
      .min(3, "Kode voucher minimal 3 karakter")
      .max(20, "Kode voucher maksimal 20 karakter")
      .regex(/^[A-Z0-9_]+$/, "Kode voucher hanya boleh huruf kapital, angka, atau underscore"),

    eventId: z.string().min(1, "Event harus dipilih"),

    discountType: z.enum(["PERCENTAGE", "FIXED"]),

    discount: z.number().int().min(1, "Diskon harus lebih besar dari 0"),
    validStart: z.string().refine((val) => !isNaN(Date.parse(val)), "Format Start Date tidak valid"),
    validEnd: z.string().refine((val) => !isNaN(Date.parse(val)), "Format End Date tidak valid"),

    maxUsage: z.number().int().min(1, "Maksimal penggunaan minimal 1").default(100),
  })
  .refine((data) => new Date(data.validEnd) > new Date(data.validStart), {
    message: "Tanggal berakhir harus setelah tanggal mulai",
    path: ["validEnd"],
  });

export type CreateVoucherInput = z.infer<typeof createVoucherSchema>;
