import cron from "node-cron"
import { prisma } from "../lib/prisma.js"

export const initCronJobs = () => {
    cron.schedule("* * * * *", async () => {
        const now = new Date()

        try {
            const expiredConfirmations = await prisma.transaction.findMany({
                where: {
                    status: "WAITING_CONFIRM",
                    ConfirmDeadline: {
                        lt: now, // lt itu adalah less than
                    }
                },
                include: {
                    event: true
                }
            })

            for (const trx of expiredConfirmations) {
                await prisma.$transaction(async (tx) => {

                    await tx.transaction.update({
                        where: {id: trx.id},
                        data: {status: "CANCELED"}
                    })

                    const quotaField = trx.ticketType === "VIP" ? "vipQuota" : 
                    trx.ticketType === "PRESALE" ? "presaleQuota" :
                    "regularQuota";

                    await tx.event.update({
                        where: {id: trx.eventId},
                        data: {
                            [quotaField]: {
                                increment: trx.quantity,
                            },
                            totalQuotaTiket: {
                                increment: trx.quantity
                            }
                        }
                    })

                    if (trx.pointUsed > 0) {
                        await tx.user.update({
                            where: {id: trx.userId},
                            data: {
                                points: {
                                    increment: trx.pointUsed
                                }
                            }
                        })
                    }
                })
            }

            const expiredPayments = await prisma.transaction.findMany({
                where: {
                    status: "WAITING_PAYMENT",
                    paymentDeadline: {
                        lt: now
                    }
                }
            })

            for (const trx of expiredPayments) {
                await prisma.$transaction(async (tx) => {
                    
                    await tx.transaction.update({
                        where: {id: trx.id},
                        data: {status: "EXPIRED"}
                    })

                    const quotaField = trx.ticketType === "VIP" ? "vipQuota" :
                    trx.ticketType === "PRESALE" ? "presaleQuota" : "regularQuota"

                    await tx.event.update({
                        where: {id: trx.eventId},
                        data: {
                            [quotaField]: {
                                increment: trx.quantity
                            },
                            totalQuotaTiket: {
                                increment: trx.quantity
                            }
                        }
                    })

                    if (trx.pointUsed > 0) {
                        await tx.user.update({
                            where: {id: trx.userId},
                            data: {
                                points: {
                                    increment: trx.pointUsed
                                }
                            }
                        })
                    }
                })
            }
        } catch (error) {
            console.error("Cron job transaksi gagal dijalankan: ", error)
        }
    })
}