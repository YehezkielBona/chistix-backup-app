// ============================================================
// Schema validasi form Auth di sisi Frontend (Register & Forgot Password)
// ============================================================
import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(3, "Input Name Minimum 3 Char"),
  email: z.email("Input the correct Email Address"),
  password: z.string().min(6, "Password minimum 6 Char"),
  role: z.enum(["CUSTOMER", "ORGANIZER"]),
  referral: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const emailSchema = z.object({
  email: z.email("Email Address Not Valid"),
});
