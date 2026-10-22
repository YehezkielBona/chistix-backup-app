// ============================================================
// Schema validasi Zod untuk Event (dipakai saat Create & Update).
// Disesuaikan 100% dengan prisma/schema.prisma yang baru (flat columns).
// ============================================================
import { z } from "zod";

const tierQuota = z.number().int().min(0, "Quota cannot be negative");
const tierPrice = z.number().int().min(0, "Price cannot be negative");

export const createEventSchema = z
  .object({
    title: z
      .string()
      .min(5, "Event title must be at least 5 characters")
      .max(100, "Maximum is 100 characters"),
    category: z.enum(["MUSIC", "SEMINAR", "TALKSHOW", "SPORTS", "EXHIBITION"]),

    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid start date format"),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid end date format"),

    description: z
      .string()
      .min(20, "Description must be at least 20 characters")
      .max(1000, "Maximum character in description is 1000 characters"),

    // Lokasi dari API Emsifa (ID + Nama Provinsi & Kota)
    provinceId: z.string().min(1, "Province ID is required").default("31"),
    provinceName: z.string().min(1, "Province is required"),
    cityId: z.string().min(1, "City ID is required").default("3171"),
    cityName: z.string().min(1, "City name is required"),

    venueDetail: z.string().min(3, "Venue detail is required"),
    venueMaps: z.string().optional().or(z.literal("")),

    // Sesuai nama kolom di schema.prisma: totalQuotaTiket
    totalQuotaTiket: z.number().int().positive("Total ticket must be greater than 0"),

    // Tipe tiket aktif saat ini
    ticketType: z.enum(["PRESALE", "REGULAR", "VIP"]).default("REGULAR"),

    // Kuota & harga flat per tier
    vipQuota: tierQuota.default(0),
    vipPriceNormal: tierPrice.default(0),
    vipPriceFinal: tierPrice.default(0),

    regularQuota: tierQuota.default(0),
    regularPriceNormal: tierPrice.default(0),
    regularPriceFinal: tierPrice.default(0),

    presaleQuota: tierQuota.default(0),
    presalePriceNormal: tierPrice.default(0),
    presalePriceFinal: tierPrice.default(0),

    // Media (Cloudinary URL)
    thumbnailImage: z.string().min(1, "Thumbnail image is required"),
    coverImages: z.array(z.string()).default([]),
    videoUrl: z.string().optional().or(z.literal("")),

    // Periode Presale / Jadwal Publish
    scheduledPublishStart: z.string().optional().or(z.literal("")),
    scheduledPublishEnd: z.string().optional().or(z.literal("")),

    // Flag apakah disimpan sebagai DRAFT
    isDraft: z.boolean().default(false),
  })
  .refine((d) => d.vipQuota + d.regularQuota + d.presaleQuota === d.totalQuotaTiket, {
    message: "VIP + Regular + Presale Quota must match Total Ticket Amount",
    path: ["totalQuotaTiket"],
  })
  .refine((d) => new Date(d.endDate) > new Date(d.startDate), {
    message: "End date must be after start date",
    path: ["endDate"],
  })
  .refine(
    (d) =>
      d.vipPriceFinal <= d.vipPriceNormal &&
      d.regularPriceFinal <= d.regularPriceNormal &&
      d.presalePriceFinal <= d.presalePriceNormal,
    {
      message: "Final price cannot be higher than Normal Price",
      path: ["vipPriceFinal"],
    },
  );

export type CreateEventInput = z.infer<typeof createEventSchema>;
