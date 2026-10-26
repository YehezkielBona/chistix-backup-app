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

export interface CreateTransactionInput {
    userId?: string
    eventId: string
    ticketType: "VIP" | "REGULAR" | "PRESALE"
    quantity: number
    voucherCode?: string
    pointsUsed?: number
}

// Customer Checkout!
export const createTransactionService = async (input: CreateTransactionInput) => {
    const {eventId, ticketType, quantity, voucherCode, pointsUsed = 0} = input
    let customerId= input.userId
    if(!customerId){
        const defaultCustomer = await prisma.user.findFirst({
            where: {role: "CUSTOMER"}
        })
        customerId = defaultCustomer?.id || "customer-1"
    }

    const event = await prisma.event.findUnique({
        where: {id: eventId}
    })
    if (!event || event.deletedAt) {
        throw new AppError(404, "Cannot found the event or has been deleted")
    }

    let pricePerTicket = 0
    let currentQuota = 0
    let quotaField: "vipQuota" | "regularQuota" | "presaleQuota" = "regularQuota"

    if (ticketType === "VIP") {
        quotaField = "vipQuota"
        currentQuota = event.vipQuota
        pricePerTicket = event.vipPriceFinal || event.vipPriceNormal
    } else if (ticketType === "PRESALE") {
        quotaField = "presaleQuota"
        currentQuota = event.presaleQuota
        pricePerTicket = event.presalePriceFinal || event.presalePriceNormal
    } else {
        quotaField = "regularQuota"
        currentQuota = event.regularQuota
        pricePerTicket = event.regularPriceFinal || event.regularPriceNormal
    }

    // validasi: apakah kuota cukup??
    if (currentQuota < quantity) {
        throw new AppError(400, `Ticket Quota ${ticketType} doesnt enough! ${currentQuota} left`)
    }

    const normalPrice = pricePerTicket * quantity
    let voucherDiscount = 0
    let voucherId: string | null = null

    if (voucherCode) {
        const voucher = await prisma.voucher.findFirst({
            where: {
                code: voucherCode.trim().toUpperCase(),
                deletedAt: null
            }
        })

        if (voucher) {
            voucherId = voucher.id
            if(voucher.discountType === "PERCENTAGE") {
                voucherDiscount = Math.round(normalPrice *(voucher.discount / 100))
            } else {
                voucherDiscount = voucher.discount
            }
        }
    }

    // validasi poin customer
    let validPointsUsed = 0
    if (pointsUsed > 0) {
        const user = await prisma.user.findUnique({
            where: {id: customerId}
        })
        const availablePoints = user?.points || 0
        // Poin yang dipakai tidak boleh melebihi poin yang dimiliki atau melebihi harga setelah voucher
    validPointsUsed = Math.min(pointsUsed, availablePoints, Math.max(0, normalPrice - voucherDiscount));
  }

  const totalDiscount = voucherDiscount + validPointsUsed;
  const totalPrice = Math.max(0, normalPrice - totalDiscount);

  const paymentDeadline = new Date(Date.now() + 10 * 60 * 1000);

  return await prisma.$transaction(async (tx) => {
    // 1. Potong Kuota Tiket di Event (Reserve Seat)
    await tx.event.update({
      where: { id: eventId },
      data: {
        [quotaField]: { decrement: quantity },
        totalQuotaTiket: { decrement: quantity },
      },
    });
    // 2. Potong Poin Customer (jika pakai poin)
    if (validPointsUsed > 0) {
      await tx.user.update({
        where: { id: customerId },
        data: {
          points: { decrement: validPointsUsed },
        },
      });
    }
    // 3. Buat Record Transaksi Baru dengan status WAITING_PAYMENT
    const newTransaction = await tx.transaction.create({
      data: {
        userId: customerId!,
        eventId: event.id,
        voucherId,
        ticketType,
        quantity,
        normalPrice,
        discPrice: totalDiscount,
        pointUsed: validPointsUsed,
        totalPrice,
        status: "WAITING_PAYMENT",
        paymentDeadline,
      },
      include: {
        event: {
          select: {
            title: true,
            thumbnailImage: true,
            startDate: true,
            cityName: true,
          },
        },
      },
    });
    return newTransaction;
  });
};

// get transaction by id
export const getTransactionByIdService = async (transactionId: string) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          startDate: true,
          cityName: true,
          venueDetail: true,
        },
      },
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });
  if (!transaction) {
    throw new AppError(404, "Transaksi tidak ditemukan");
  }
  return transaction;
};