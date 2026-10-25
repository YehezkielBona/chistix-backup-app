import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";


export const getOrganizerTransactionService = async (organizerId: string) => {
    return await prisma.transaction.findMany({
        where: {
            event: {
                organizerId: organizerId // mengambil transaksi dari event yang dibuat oleh user EO ini!
            },
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            },
            event: {
                select: {
                    id: true,
                    title: true
                }
            },
            voucher: {
                select: {
                    code: true,
                    discount: true,
                    discountType: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc', // Transaksi paling baru akan di urutan paling atas!
        }
    })
}

// Apabila nanti EO menyetujui Pembayaran Customer
export const acceptTransactionService = async (transactionId: string, organizerId: string) => {
    const transaction = await prisma.transaction.findUnique({
        where: {id: transactionId},
        include: {event: true},
    })

    if (!transaction) {
        throw new AppError(404, "Cannot find transaction")
    }
    if (transaction.event.organizerId !== organizerId) {
        throw new AppError(403, "You dont have access to transaction in this event! ")
    }
    if (transaction.status !== "WAITING_CONFIRM") {
        throw new AppError(400, "Only waiting confirm status in transaction can be approved")
    }

    return await prisma.$transaction(async (tx) => {
        const updatedTrx = await tx.transaction.update({
            where: {id: transactionId},
            data: {
                status: "DONE"
            }
        })

        // karena sudah disetujui dan status berubah menjadi DONE maka harus terbitkan E-Ticket
        for (let i = 0; i < transaction.quantity; i++) {
            const uniqueCode = `CHX-${Date.now().toString().slice(-4)} -${Math.random().toString(36).substring(2,6).toUpperCase()}`
            await tx.eTicket.create({
                data: {
                    transactionId: transaction.id,
                    ticketCode: uniqueCode
                }
            })
        }
        return updatedTrx
    })
}

// Apabila EO Reject atau menolak pembayaran dari Customer (misal bukti tf palsu)
export const rejectTransactionService = async (transactionId: string, organizerId: string) => {
    const transaction = await prisma.transaction.findUnique({
        where: {id: transactionId},
        include: {event: true}
    })

    if (!transaction) {
        throw new AppError(404, "Cannot found transaction")
    }
    if (transaction.event.organizerId !== organizerId) {
        throw new AppError(403, "You dont have access to transaction in this event!")
    }
    if (transaction.status !== "WAITING_CONFIRM") {
        throw new AppError(400, "Only waiting confirm status in transaction can be Rejected")
    }

    return await prisma.$transaction(async (tx) => {
        const updatedTrx = await tx.transaction.update({
            where: {id: transactionId},
            data: {
                status: "REJECTED"
            }
        })
        // Karena status rejected, maka quota tiket perlu dikembalikan ke Event
        const quotaField = transaction.ticketType === "VIP" ? "vipQuota" :
        transaction.ticketType === "PRESALE" ? "presaleQuota" : "regularQuota"

        await tx.event.update({
            where: {id: transaction.eventId},
            data: {
                [quotaField]: {
                    increment: transaction.quantity
                },
                totalQuotaTiket: {
                    increment: transaction.quantity
                }
            }
        })
        // karena sudah reject dan jika customer terlanjur menggunakan Poin maka perlu dikembalikan juga!
        if (transaction.pointUsed > 0) {
            await tx.user.update({
                where: {id: transaction.userId},
                data: {
                    points: {
                        increment: transaction.pointUsed
                    }
                }
            })
        }
        return updatedTrx
    })
}