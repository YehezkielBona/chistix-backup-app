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
export interface Paged<T> {
    data: T[]; total: number; page: number;
    totalPages: number; limit: number
}
export interface ApiTicketTier {
    id: string; name: "VIP" | "Regular" | "Presale"; price: number; finalPrice:
    number;
    quota: number; sold: number; isAvailable: boolean; statusLabel: string;
}
export interface ApiEvent {
    id: string; title: string; category: string; description: string;
    startDate: string; endDate: string; provinceName: string; cityName: string;
    venueDetail: string;
    thumbnailImage: string; coverImages: string[]; salesPhase: string;
    ticketTiers: ApiTicketTier[];
    organizer?: { id: string; name: string; image: string | null };
    organizerRating?: { average: number; count: number };
}
export interface ApiReview {
    id: string; ratingScore: number; reviewDesc: string | null;
    reviewCustomerAt: string;
    user: { name: string; image: string | null };
}
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
export interface ApiTransaction {
    id: string; status: TrxStatus; ticketType: TicketTypeEnum; quantity:
    number;
    normalPrice: number; discPrice: number; couponDiscount: number; pointUsed:
    number; totalPrice: number;
    paymentProof: string | null; paymentDeadline: string; ConfirmDeadline:
    string | null; createdAt: string;
    event: {
        id: string; title: string; thumbnailImage: string; startDate:
            string; cityName: string; provinceName: string; venueDetail: string
    };
    eTickets: ApiETicket[];
    serverTime?: string;
}
export interface CustomerOverview {
    name: string; referralCode: string; referredCount: number;
    points: number; pointsExpiresAt: string | null;
    coupon: { discountType: "FIXED"; discount: number; expiresAt: string } |
    null;
    upcomingTickets: number; waitingPayment: number; eventsAttended: number;
    pendingReviews: number;
}