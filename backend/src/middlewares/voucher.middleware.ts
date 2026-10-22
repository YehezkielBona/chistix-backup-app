import {z} from "zod"

export const createVoucherSchema = z.object({
    code: z
    .string()
    .min(3, "Kode voucher minimal 3 karakter")
    .max(15, "Kode voucher maximal 20 karakter")
    .regex(/^[A-Z0-9]+$/, "Kode voucher hanya boleh huruf kapital dan angka, tanpa spasi"),

    eventId: z.string().min(1, "Event harus dipilih"),

    discountType: z.enum(["PERCENTAGE", "FIXED"]),

    discount: z.number().int().min(1, "Diskon must be greater than 0"),
    validStart: z.string().refine((val) => !isNaN(Date.parse(val)), "Format Start Date tidak valid"),
    validEnd: z.string().refine((val) => !isNaN(Date.parse(val)), "Format End Date tidak valid"),

    maxUsage: z.number().int().min(1, "Maksimal penggunaan minimal 1").default(100),
})

    .refine((data) => new Date(data.validEnd) > new Date(data.validStart), {
        message: "End date must be after start date",
        path: ["validEnd"],
    })

    export type createVoucherInput = z.infer<typeof createVoucherSchema>