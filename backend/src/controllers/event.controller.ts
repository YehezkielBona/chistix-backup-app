import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createEventSchema } from "@/middlewares/event.middleware";
import { statusCodes } from "better-auth";

export function calculateEventStatus(startDate: Date, endDate: Date){
    const now = new Date()
    if(now < startDate){
        return "UPCOMING"
    } else if(now >= startDate && now <= endDate){
        return "ON_STAGE"
    } else {
        return "ENDED"
    }
}

export async function createEventController(inputData: unknown) {
    const validation = createEventSchema.safeParse(inputData)
    if(!validation.success){
        return {
            success: false,
            statusCode: 400,
            message: "Validasi gagal",
            errors: validation.error.flatten().fieldErrors,
        }
    }

    const {
        title, category, startDate, endDate, description, province, city, venueDetail, venueMaps, totalTicket, ticketTiers, presale
    } = validation.data

    // const
    let organizer = await prisma.user.findFirst({
        where: {role: "ORGANIZER"},
    })

    if(!organizer){
        organizer = await prisma.user.create({
            data: {
                id: "org-default-01",
                name: "Soundwave Organizer",
                email: "organizer@chistix.id",
                emailVerified: true,
                role: "ORGANIZER"
            }
        })
        // return {
        //     success: false,
        //     statusCode: 400,
        //     message: "Akun organizer tidak ditemukan dalam database",
        // }
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    const dynamicStatus = calculateEventStatus(start, end)

    const newEvent = await prisma.$transaction(async (tx) => {
        const event = await tx.event.create({
            data: {
                organizerId: organizer.id,
                title,
                category,
                startDate: start,
                endDate: end,
                description,
                province,
                city,
                venueDetail,
                venueMaps: venueMaps || null,
                totalTicket,
                thumbnailImage: null,
                status: dynamicStatus,
            },
        });

        for (const tier of ticketTiers) {
            const isPresaleTier = Boolean(presale?.enabled) && tier.name.toLowerCase().includes("presale")

            await tx.ticketTier.create({
                data: {
                    eventId: event.id,
                    name: tier.name,
                    price: tier.price.toString(),
                    finalPrice: tier.finalPrice.toString(),
                    quota: tier.quota,
                    isPresale: isPresaleTier
                },
            })
        }

        if(presale?.enabled && presale.amount) {
            await tx.ticketTier.create({
                data: {
                    eventId: event.id,
                    name: "Presale",
                    price: "0",
                    finalPrice: "0",
                    quota: presale.amount,
                    isPresale: true,
                    preSaleStart: presale.startDate ? new Date(presale.startDate): null,
                    preSaleEnd: presale.endDate ? new Date(presale.endDate): null
                }
            })
        }

        return event
    })

    return {
        success: true,
        statusCode: 201,
        message: "Event berhasil dibuat dengan status: " + dynamicStatus,
        data: newEvent,
    }
}

export async function getAllEventController() {
    const events = await prisma.event.findMany({
        where: {deletedAt: null},
        include: {
            ticketTiers: true,
            organizer: {
                select: {id: true, name: true, email: true},
            },
        },
        orderBy: {createdAt: "desc"}
    })

    const dynamicEvents = events.map((event) => {
        const liveStatus = calculateEventStatus(new Date(event.startDate), new Date(event.endDate))
        return {
            ...event,
            status: liveStatus
        }
    })

    return {
        success: true,
        statusCode: 200,
        data: dynamicEvents,
    }
}

export async function getEventDetailController(eventId: string) {
    const event = await prisma.event.findUnique({
        where: {id: eventId},
        include: {
            ticketTiers: true,
            organizer: {
                select: {id: true, name: true, email: true}
            }
        }
    })

    if(!event || event.deletedAt) {
        return {
            success: false,
            statusCode: 400,
            message: "Event tidak ditemukan",
        }
    }

    return {
        success: true,
        statusCode: 200,
        data: event,
    }
}

export async function updateEventController(eventId: string, inputData: unknown) {
  const validation = createEventSchema.safeParse(inputData);
  if (!validation.success) {
    return {
      success: false,
      statusCode: 400,
      message: "Validasi update gagal",
      errors: validation.error.flatten(),
    };
  }
  const {
    title,
    category,
    startDate,
    endDate,
    description,
    province,
    city,
    venueDetail,
    venueMaps,
    totalTicket,
    ticketTiers,
  } = validation.data;
  const existingEvent = await prisma.event.findUnique({
    where: { id: eventId },
  });
  if (!existingEvent) {
    return {
      success: false,
      statusCode: 404,
      message: "Event tidak ditemukan",
    };
  }
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dynamicStatus = calculateEventStatus(start, end);

  const updatedEvent = await prisma.$transaction(async (tx) => {
    // 1. Update data event
    const event = await tx.event.update({
      where: { id: eventId },
      data: {
        title,
        category,
        startDate: start,
        endDate: end,
        description,
        province,
        city,
        venueDetail,
        venueMaps: venueMaps || null,
        totalTicket,
        status: dynamicStatus,
      },
    });
    
    // 2. Hapus tier lama event ini & insert tier terbaru
    await tx.ticketTier.deleteMany({
      where: { eventId: eventId },
    });
    for (const tier of ticketTiers) {
      await tx.ticketTier.create({
        data: {
          eventId: eventId,
          name: tier.name,
          price: tier.price.toString(),
          finalPrice: tier.finalPrice.toString(),
          quota: tier.quota,
        },
      });
    }
    return event;
  });
  return {
    success: true,
    statusCode: 200,
    message: "Event berhasil diperbarui",
    data: updatedEvent,
  };
}

// 5. Controller: Soft Delete Event

export async function softDeleteEventController(eventId: string) {
  const existingEvent = await prisma.event.findUnique({
    where: { id: eventId },
  });
  if (!existingEvent) {
    return {
      success: false,
      statusCode: 404,
      message: "Event tidak ditemukan",
    };
  }

  // Hanya boleh delete jika status DRAFT atau UPCOMING
  const statusStr = existingEvent.status.replace("_", " ").toUpperCase();
  if (statusStr !== "DRAFT" && statusStr !== "UPCOMING") {
    return {
      success: false,
      statusCode: 400,
      message: "Hanya event berstatus DRAFT atau UPCOMING yang dapat dihapus!",
    };
  }
  // Set deletedAt (Soft Delete)
  await prisma.event.update({
    where: { id: eventId },
    data: {
      deletedAt: new Date(),
    },
  });
  return {
    success: true,
    statusCode: 200,
    message: `Event "${existingEvent.title}" berhasil dihapus (Soft Delete)!`,
  };
}