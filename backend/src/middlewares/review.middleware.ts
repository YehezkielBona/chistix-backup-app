import { z } from "zod";

// POST /api/reviews
export const createReviewSchema = z.object({
    eventId: z.string().trim().min(1, "eventId wajib diisi"),
    ratingScore: z.coerce.number().int().min(1, "Rating minimal 1").max(5, "Rating maksimal 5"),
    reviewDesc: z.string().trim().max(500, "Komentar maksimal 500 karakter").optional(),
});
export type CreateReviewInput = z.infer<typeof createReviewSchema>;

// PATCH /api/reviews/:id (boleh ubah rating saja, komentar saja, atau dua-duanya)
export const updateReviewSchema = z
    .object({
        ratingScore: z.coerce.number().int().min(1, "Rating minimal 1").max(5, "Rating maksimal 5").optional(),
        reviewDesc: z.string().trim().max(500, "Komentar maksimal 500 karakter").optional(),
    })
    .refine((d) => d.ratingScore !== undefined || d.reviewDesc !== undefined, {
        message: "Tidak ada perubahan yang dikirim",
    });
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;

// ?page=&limit= untuk daftar review
export const reviewPageSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
});
export type ReviewPageQuery = z.infer<typeof reviewPageSchema>;