import type { z } from "zod";
import { AppError } from "./AppError.js";

export function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Validasi gagal";
    throw new AppError(400, message, result.error.flatten().fieldErrors);
  }
  return result.data;
}