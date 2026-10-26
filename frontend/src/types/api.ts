export type TicketTypeEnum = "VIP" | "REGULAR" | "PRESALE";
export type TrxStatus = "WAITING_PAYMENT" | "WAITING_CONFIRM" | "DONE" |
    "REJECTED" | "EXPIRED" | "CANCELED";
export const STATUS_LABEL: Record<TrxStatus, string> = {
    WAITING_PAYMENT: "Waiting for Payment",
    WAITING_CONFIRM: "Waiting for Admin Confirmation",
    DONE: "Done",
    REJECTED: "Rejected",
    EXPIRED: "Expired",
    CANCELED: "Canceled",
};

// [BARU] label tampilan jenis tiket (database memakai huruf besar)
export const TICKET_LABEL: Record<TicketTypeEnum, string> = {
    VIP: "VIP",
    REGULAR: "Regular",
    PRESALE: "Presale",
};

export interface Paged<T> {
    data: T[]; total: number; page: number;
    totalPages: number; limit: number
}

// [LAMA]
// export interface ApiTicketTier {
//     id: string; name: "VIP" | "Regular" | "Presale"; price: number; finalPrice:
//     number;
//     quota: number; sold: number; isAvailable: boolean; statusLabel: string;
// }
export interface ApiTicketTier {
    id: string; name: "VIP" | "Regular" | "Presale"; price: number; finalPrice:
    number;
    quota: number; sold: number; isAvailable: boolean; statusLabel: string;
    ticketType: TicketTypeEnum; // [BARU] enum untuk dikirim ke cart / checkout
    remaining: number;          // [BARU] sisa kursi kategori ini
    lowStock: boolean;          // [BARU] true kalau sisa <= 5 ("5 tickets left!")
}

export interface ApiEvent {
    id: string; title: string; category: string; description: string;
    startDate: string; endDate: string; provinceName: string; cityName: string;
    venueDetail: string;
    venueMaps?: string | null; // [BARU] link Google Maps (kolom opsional di schema)
    thumbnailImage: string; coverImages: string[]; salesPhase: string;
    ticketTiers: ApiTicketTier[];
    organizer?: { id: string; name: string; image: string | null };
    organizerRating?: { average: number; count: number };
}

// [LAMA]
// export interface ApiReview {
//     id: string; ratingScore: number; reviewDesc: string | null;
//     reviewCustomerAt: string;
//     user: { name: string; image: string | null };
// }
export interface ApiReview {
    id: string; ratingScore: number; reviewDesc: string | null;
    reviewCustomerAt: string;
    orgReply?: string | null;   // [BARU] balasan organizer (dikirim GET /api/events/:id/reviews)
    orgReplyAt?: string | null; // [BARU]
    user: { name: string; image: string | null };
}

// Dipakai nanti untuk preview harga di cart (endpoint checkout belum dibuat)
export interface Quote {
    unitPrice: number; seatsLeft: number; subtotal: number; voucherDiscount:
    number;
    couponDiscount: number; pointUsed: number; totalPrice: number;
    voucherCode: string | null; couponApplied: boolean;
}

export interface ApiETicket {
    id: string; ticketCode: string; qrToken:
        string; isAttended: boolean
}

// [LAMA]
// export interface ApiTransaction {
//     id: string; status: TrxStatus; ticketType: TicketTypeEnum; quantity:
//     number;
//     normalPrice: number; discPrice: number; couponDiscount: number; pointUsed:
//     number; totalPrice: number;
//     paymentProof: string | null; paymentDeadline: string; ConfirmDeadline:
//     string | null; createdAt: string;
//     event: {
//         id: string; title: string; thumbnailImage: string; startDate:
//             string; cityName: string; provinceName: string; venueDetail: string
//     };
//     eTickets: ApiETicket[];
//     serverTime?: string;
// }
export interface ApiTransaction {
    id: string; status: TrxStatus; ticketType: TicketTypeEnum; quantity:
    number;
    normalPrice: number; discPrice: number;
    couponDiscount?: number; // [BARU] jadi opsional: kolom ini belum ada di schema sekarang
    pointUsed: number; totalPrice: number;
    paymentProof: string | null; paymentDeadline: string; ConfirmDeadline:
    string | null; createdAt: string;
    event: {
        id: string; title: string; thumbnailImage: string; startDate:
            string; cityName: string; provinceName: string; venueDetail: string
    };
    eTickets: ApiETicket[];
    voucher?: { code: string } | null; // [BARU] dikirim GET /api/transactions/:id
    serverTime?: string;
}

// [LAMA]
// export interface CustomerOverview {
//     name: string; referralCode: string; referredCount: number;
//     points: number; pointsExpiresAt: string | null;
//     coupon: { discountType: "FIXED"; discount: number; expiresAt: string } |
//     null;
//     upcomingTickets: number; waitingPayment: number; eventsAttended: number;
//     pendingReviews: number;
// }
export interface CustomerOverview {
    // [BARU] referralCode bisa null untuk akun lama (dibuat sebelum hook referral dipasang)
    name: string; referralCode: string | null; referredCount: number;
    points: number; pointsExpiresAt: string | null;
    // kupon referral: selalu null sampai kolom kupon ditambahkan ke schema
    coupon: { discountType: "FIXED"; discount: number; expiresAt: string } |
    null;
    upcomingTickets: number; waitingPayment: number; eventsAttended: number;
    pendingReviews: number;
}

// [BARU] Review
export interface PendingReview {
  eventId: string;
  title: string;
  thumbnailImage: string;
  startDate: string;
  attendedAt: string | null;
  ticketCount: number;
}

export interface MyReview {
  id: string;
  ratingScore: number;
  reviewDesc: string | null;
  reviewCustomerAt: string;
  orgReply: string | null;
  orgReplyAt: string | null;
  event: { id: string; title: string; thumbnailImage: string };
}