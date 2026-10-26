import prisma from "../lib/prisma.js";

export async function getOrganizerReviewService(organizerId?: string) {
  const reviews = await prisma.review.findMany({
    where: {
      deletedAt: null,
      ...(organizerId
        ? {
            event: {
              organizerId: organizerId,
              deleteAt: null,
            },
          }
        : []),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      event: {
        select: {
          id: true,
          title: true,
        },
      },
      eTicket: {
        include: {
          transaction: {
            select: {
              ticketType: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc", // terbaru
    },
  });

  return reviews.map((rev) => ({
    id: rev.id,
    eventId: rev.eventId,
    eventName: rev.event?.title || "Untitled Event",
    customerName: rev.user?.name || "Customer",
    customerEmail: rev.user?.email || "-",
    customerAvatar: rev.user?.image || null,
    ticketTier: rev.eTicket?.transaction?.ticketType || "Regular",
    rating: rev.ratingScore,
    comment: rev.reviewDesc || "",
    createdAt: rev.reviewCustomerAt ? rev.reviewCustomerAt.toISOString() : rev.createdAt.toISOString(),
    organizerReply: rev.orgReply || null,
    repliedAt: rev.orgReplyAt ? rev.orgReplyAt.toISOString() : null,
  }));
}

export async function replyOrganierReviewService(
    reviewId: string,
    replyText: string,
    organizerId?: string
) {
    const cleanReply = replyText.trim()
    if(!cleanReply) {
        throw new Error("Reply text cannot empty")
    }

    // searching review target
    const review = await prisma.review.findUnique({
        where: {id: reviewId},
        include: {event: true}
    })
    if(!review){
        throw new Error("Reviews cannot found")
    }

    if(organizerId && review.event.organizerId !== organizerId) {
        throw new Error("You dont have access to reply this reviews for this event!")
    }

    const updatedReview = await prisma.review.update({
        where: {id: reviewId},
        data: {
            orgReply: cleanReply,
            orgReplyAt: new Date()
        }
    })
    return updatedReview
}