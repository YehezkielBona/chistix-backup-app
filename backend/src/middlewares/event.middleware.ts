import { z } from "zod";

const tierQuota = z.number().int().min(0, "Quota cannot be negative")
const tierPrice = z.number().int().min(0, "Price cannot be negative")

export const createEventSchema = z
  .object({
    title: z.string().min(5, "Event title must be at least 5 characters").max(100, "Maximum is 100 Character"),
    category: z.enum(["MUSIC", "SEMINAR", "TALKSHOW", "SPORTS", "EXHIBITION"]),

    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid start date Format"),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid end date format"),

    description: z.string().min(20, "Description must be at least 20 characters").max(250, "Maximum Character in Description is 250 characters"),
    provinceName: z.string().min(1, "PRovince is required"),
    cityId: z.string().min(1, "City is required"),
    cityName: z.string().min(1, "You must fill name of city"),
    venueDetail: z.string().min(3, "Venue detail is required"),
    venueMaps: z.string().min(3, "Venue detail location is required"),
    totalQuotaTicket: z.number().int().positive("Total ticket must be greater than 0"),

    ticketType: z.enum(["PRESALE", "REGULAR", "VIP"]),

    vipQuota: tierQuota,
    vipPriceNormal: tierPrice,
    vipPriceFinal: tierPrice,
    regularQuota: tierQuota,
    regularPriceNormal: tierPrice,
    regularPriceFinal: tierPrice,
    presaleQuota: tierQuota,
    presalePriceNormal: tierPrice,
    presalePriceFinal: tierPrice,

    thumbnailImage: z.string().min(1, "Thumbnail image is required"),
    coverImages: z.array(z.string()).default([]),
    videoUrl: z.string().optional().or(z.literal("")),

    scheduledPublishStart: z.string().optional().or(z.literal("")),
    scheduledPublishEnd: z.string().optional().or(z.literal("")),

    isDraft: z.boolean().default(false),
  })

  .refine(
    (d) => d.vipQuota + d.regularQuota + d.presaleQuota === d.totalQuotaTicket,
    {message: "VIP + Regular + Presale Quota must match Total Ticket Amount", path: ["totalQuotaTiket"]}
  )

  .refine((d) => new Date(d.endDate) > new Date(d.startDate), {
    message: "End date must be after start date",
    path: 
  })

  .refine(
    (d) =>
      d.vipPriceFinal <= d.vipPriceNormal &&
      d.regularPriceFinal <= d.regularPriceNormal &&
      d.presalePriceFinal <= d.presalePriceNormal,
      {message: "Final price cannot be higher than Normal Price", path: ["vipPriceFinal"]}
  )

export type createEventInput = z.infer<typeof createEventSchema>;
