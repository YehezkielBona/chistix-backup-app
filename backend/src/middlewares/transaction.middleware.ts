import { z } from "zod";

// TODO schema v2: checkoutSchema (eventId, ticketType, quantity, voucherCode, useCoupon, pointsToUse)

// Query daftar transaksi: ?status=&page=&limit=
export const listQuerySchema = z.object({
  status: z
    .enum(["WAITING_PAYMENT", "WAITING_CONFIRM", "DONE", "REJECTED", "EXPIRED", "CANCELED"])
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
export type ListQuery = z.infer<typeof listQuerySchema>;

// Body saat organizer menolak transaksi
export const rejectSchema = z.object({
  reason: z.string().trim().max(300).optional(),
});