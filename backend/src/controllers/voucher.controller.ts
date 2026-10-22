import { prisma } from "@/lib/prisma";
import { createVoucherSchema } from "@/middlewares/voucher.middleware";

function calculateVoucherStatus(validStart: Date, validEnd: Date): string {
    const now = new Date()
    if(now < validStart) return "SCHEDULED";
    if(now >= validStart && now <= validEnd) return "ACTIVE"
    return "EXPIRED"
}

// GET ALL VOUCHER
export async function getVouchersController() {
    const vouchers = await prisma.voucher.findMany({
        where: {deletedAt: null},
        include: {
            event: {
                select: {id: true, title: true, status: true}
            }
            
        },
        orderBy: {createdAt: "desc"}
    })

    const result = vouchers.map((v) => ({
        ...v,
        computedStatus: calculateVoucherStatus(v.validStart, v.validEnd),
    }))
    return {success: true, statusCode: 200, data: result}
}

// CREATE NEW VOUCHER

export async function createVoucherController(inputData: unknown) {
    const validation = createVoucherSchema.safeParse(inputData)
    if(!validation.success) {
        return {
            success: false,
            statusCode: 400,
            message: "Validasi gagal",
            errors: validation.error.flatten().fieldErrors
        }
    }
    const {code, eventId, discountType, discount, validStart, validEnd, maxUsage} = validation.data

    const existing = await prisma.voucher.findUnique({
        where: {code}
    })
    if(existing) {
        return {
            success: false, 
            statusCode: 400,
            message: `Voucher code "${code}" already used` 
        }
    }
    if(eventId === "ALL") {
        const eligibleEvents = await prisma.event.findMany({
            where: {
                deletedAt: null,
                status: {in: ["DRAFT", "UPCOMING"]}
            }
        })
        if(eligibleEvents.length === 0) {
            return {
                success: false,
                statusCode: 400,
                message: "Tidak ada event DRAFT atau UPCOMING yang tersedia"
            }
        }

        const created = await prisma.$transaction(
            eligibleEvents.map((evt, index) => 
            prisma.voucher.create({
                data: {
                    code: `${code}_${index}`,
                    eventId: evt.id,
                    discountType,
                    discount,
                    validStart: new Date(validStart),
                    validEnd: new Date(validEnd), 
                    maxUsage,
                }
            })
            )
        )
        return {
            success: true,
            statusCode: 201,
            data: created,
            message: `${created.length} voucher berhasil dibuat untuk semua event`
        }
    }

    // Konteksnya: Kalau Organizer nanti mau buat voucher untuk 1 event aja bukan semua event!
    const voucher = await prisma.voucher.create({
        data: {
            code,
            eventId,
            discountType,
            discount,
            validStart: new Date(validStart),
            validEnd: new Date(validEnd),
            maxUsage,
        }
    })
    return {
        success: true,
        statusCode: 201,
        data: voucher,
        message: "voucher berhasil dibuat"
    }
}

// UPDATE VOUCHER (EDIT)

export async function updateVoucherController(voucherId: string, inputData: unknown) {
    const validation = createVoucherSchema.safeParse(inputData)
    if(!validation.success) {
        return {
            success: false,
            statusCode: 400,
            message: "Validasi Gagal",
            errors: validation.error.flatten().fieldErrors
        }
    }
    const {code, eventId, discountType, discount, validStart, validEnd, maxUsage} = validation.data

    const existing = await prisma.voucher.findUnique({
        where: {id: voucherId}
    })

    if(!existing || existing.deletedAt) {
        return {
            success: false,
            statusCode: 404,
            message: "Voucher tidak ditemukan"
        }
    }
    
    const updated = await prisma.voucher.update({
        where: {id: voucherId},
        data: {code, eventId, discountType, discount, validStart: new Date(validStart), validEnd: new Date(validEnd), maxUsage}
    })
    return {
        success: true,
        statusCode: 200,
        data: updated,
        message: "Voucher berhasil diperbarui"
    }
}

// SOFT DELETE VOUCHER

export async function softDeleteVoucherController(voucherId: string) {
    const existing = await prisma.voucher.findUnique({
        where: {id: voucherId}
    })
    if(!existing || existing.deletedAt) {
        return {
            success: false,
            statusCode: 400,
            message: "Voucher tidak ditemukan"
        }
    }
    await prisma.voucher.update({
        where: {id: voucherId},
        data: {deletedAt: new Date()}
    })
    return {
        success: true,
        statusCode: 200,
        message: "Voucher berhasil dihapus"
    }
}

// VALIDASI VOUCHER (dipakai di halaman Cart saat customer checkout)

export async function validateVoucherController(code: string, eventId: string) {
    const now = new Date()

    const voucher = await prisma.voucher.findUnique({
        where: {code: code.toUpperCase()}
    })

    if(!voucher || voucher.deletedAt) {
        return {success: false, statusCode: 400, message: "Kode voucher tidak ditemukan"}
    }
    if(voucher.eventId !== eventId && voucher.eventId !== "ALL"){
        return {success: false, statusCode: 400, message: "Voucher ini tidak berlaku untuk event ini"}
    }
    if(now < voucher.validStart){
        return {success: false, statusCode: 400, message: "Voucher ini belum aktif"}
    }
    if(now > voucher.validEnd) {
        return {success: false, statusCode: 400, message: "Voucher ini sudah Expired"}
    }
    if(voucher.usedCount >= voucher.maxUsage) {
        return {success: false, statusCode: 400, message: "Voucher telah mencapai batas penggunaan"}
    }

    // Jika lolos dari validasi
    return {
        success: true,
        statusCode: 200,
        data: {
            voucherId: voucher.id,
            discountType: voucher.discountType,
            discount: voucher.discount
        }
    }
}