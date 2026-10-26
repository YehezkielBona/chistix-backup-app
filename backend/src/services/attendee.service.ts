// ============================================================
// ATTENDEE & SCANNER SERVICE (backend/src/services/attendee.service.ts)
// Tugas: Berinteraksi langsung dengan Database PostgreSQL (via Prisma)
// untuk mengambil daftar peserta (E-Ticket) dan memproses scan QR Check-In.
// ============================================================
import { prisma } from "../lib/prisma.js";

// ------------------------------------------------------------
// 1. Mengambil Semua Daftar Attendee (Berbasis Per E-Ticket)
// ------------------------------------------------------------
export async function getOrganizerAttendeesService(organizerId?: string) {
  // Ambil seluruh data dari tabel ETicket yang tidak dihapus (deletedAt: null)
  // dan yang status transaksinya sudah lunas/disetujui (status: "DONE").
  const eTickets = await prisma.eTicket.findMany({
    where: {
      deletedAt: null,
      transaction: {
        status: "DONE",
        deletedAt: null,
        // Jika organizerId tersedia dari sesi login, filter hanya event milik organizer tersebut
        // Muat semua attendee
        ...(false
          ? {
              event: {
                organizerId: organizerId,
                deletedAt: null,
              },
            }
          : {}),
      },
    },
    include: {
      transaction: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          event: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Transformasi (mapping) bentuk data dari struktur relasi Prisma
  // menjadi bentuk datar (flat object) yang siap dipakai oleh tabel Frontend.
  return eTickets.map((ticket) => {
    const trx = ticket.transaction;
    // Hitung harga per 1 tiket: Total harga transaksi dibagi jumlah tiket yang dibeli
    // Math.max(1, trx.quantity) mencegah pembagian dengan angka nol (division by zero)
    const unitPricePaid = Math.round(trx.totalPrice / Math.max(1, trx.quantity));

    return {
      id: ticket.id,
      ticketCode: ticket.ticketCode,
      qrToken: ticket.qrToken,
      transactionId: trx.id,
      eventId: trx.eventId,
      eventName: trx.event?.title || "Untitled Event",
      customerName: trx.user?.name || "Customer",
      email: trx.user?.email || "-",
      ticketTier: trx.ticketType, // "PRESALE" | "REGULAR" | "VIP"
      quantity: 1, // Karena Opsi A adalah Per E-Ticket, setiap baris mewakili 1 tiket masuk
      transactionQty: trx.quantity, // Informasi tambahan: total tiket dalam transaksi induknya
      totalPaid: unitPricePaid,
      transactionTotalPaid: trx.totalPrice,
      status: ticket.isAttended ? "ATTENDED" : "REGISTERED",
      checkInTime: ticket.attendedAt ? ticket.attendedAt.toISOString() : null,
      createdAt: ticket.createdAt.toISOString(),
    };
  });
}

// ------------------------------------------------------------
// 2. Memproses Scan QR / Input Kode Tiket di Gate Check-In
// ------------------------------------------------------------
export async function scanCheckInTicketService(
  rawCode: string,
  selectedEventId?: string,
  organizerId?: string
) {
  const cleanCode = rawCode.trim();

  if (!cleanCode) {
    return {
      scanStatus: "INVALID" as const,
      message: "Kode tiket tidak boleh kosong.",
    };
  }

  // Cari E-Ticket berdasarkan ticketCode (contoh: CHX-1234-ABCD) ATAU qrToken (UUID)
  const foundTicket = await prisma.eTicket.findFirst({
    where: {
      deletedAt: null,
      OR: [
        { ticketCode: { equals: cleanCode, mode: "insensitive" } },
        { qrToken: { equals: cleanCode, mode: "insensitive" } },
      ],
    },
    include: {
      transaction: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          event: {
            select: {
              id: true,
              title: true,
              organizerId: true,
            },
          },
        },
      },
    },
  });

  // Validasi 1: Apakah tiket ditemukan di database?
  if (!foundTicket) {
    return {
      scanStatus: "INVALID" as const,
      message: `Tiket dengan kode "${cleanCode.toUpperCase()}" tidak terdaftar di dalam database.`,
    };
  }

  const trx = foundTicket.transaction;

  // Validasi 2: Apakah event ini milik organizer yang sedang bertugas?
  if (organizerId && trx.event.organizerId !== organizerId) {
    return {
      scanStatus: "INVALID" as const,
      message: "Tiket ini berasal dari penyelenggara event lain.",
    };
  }

  // Validasi 3: Apakah transaksi tiket ini sudah berstatus DONE?
  if (trx.status !== "DONE") {
    return {
      scanStatus: "INVALID" as const,
      message: `Tiket belum aktif karena status pembayaran masih ${trx.status}.`,
    };
  }

  // Validasi 4: Apakah tiket di-scan pada Gate Event yang sesuai?
  if (selectedEventId && selectedEventId !== "ALL" && trx.eventId !== selectedEventId) {
    return {
      scanStatus: "INVALID" as const,
      message: `Tiket ini valid, tetapi terdaftar untuk event "${trx.event.title}", bukan untuk gate event yang sedang dipilih.`,
    };
  }

  // Validasi 5: Apakah tiket sudah pernah dipakai check-in sebelumnya? (Cegah tiket ganda/duplikat)
  if (foundTicket.isAttended) {
    return {
      scanStatus: "ALREADY_USED" as const,
      message: "Tiket ini sudah pernah di-scan sebelumnya. Dilarang memberikan akses masuk ganda.",
      ticket: {
        id: foundTicket.id,
        ticketCode: foundTicket.ticketCode,
        eventId: trx.eventId,
        eventName: trx.event.title,
        customerName: trx.user.name,
        email: trx.user.email,
        ticketTier: trx.ticketType,
        status: "ATTENDED" as const,
        checkedInAt: foundTicket.attendedAt ? foundTicket.attendedAt.toISOString() : null,
      },
    };
  }

  // Jika lolos seluruh validasi di atas -> Tandai hadir (isAttended = true) dan catat jam sekarang
  const now = new Date();
  const updatedTicket = await prisma.eTicket.update({
    where: { id: foundTicket.id },
    data: {
      isAttended: true,
      attendedAt: now,
    },
  });

  return {
    scanStatus: "SUCCESS" as const,
    message: "Verifikasi berhasil. Peserta diizinkan memasuki area acara.",
    ticket: {
      id: updatedTicket.id,
      ticketCode: updatedTicket.ticketCode,
      eventId: trx.eventId,
      eventName: trx.event.title,
      customerName: trx.user.name,
      email: trx.user.email,
      ticketTier: trx.ticketType,
      status: "ATTENDED" as const,
      checkedInAt: updatedTicket.attendedAt ? updatedTicket.attendedAt.toISOString() : now.toISOString(),
    },
  };
}
