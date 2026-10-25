import { z } from "zod";
export const eventQuerySchema = z.object({
    search: z.string().trim().max(100).optional(),
    category: z.enum(["MUSIC", "SEMINAR", "TALKSHOW", "SPORTS",
        "EXHIBITION"]).optional(),
    city: z.string().trim().max(100).optional(),
    minPrice: z.coerce.number().int().min(0).optional(),
    maxPrice: z.coerce.number().int().min(0).optional(),
    sort: z.enum(["soonest", "newest", "popular", "price_asc",
        "price_desc"]).default("soonest"),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(9),
});
export type EventQuery = z.infer<typeof eventQuerySchema>;
export const pageQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
});
export type PageQuery = z.infer<typeof pageQuerySchema>;