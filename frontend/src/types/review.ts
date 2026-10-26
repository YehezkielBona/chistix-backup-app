export interface ReviewItem {
    id: string
    eventId: string
    eventName: string
    customerName: string
    customerEmail: string
    customerAvatar?: string | null
    ticketTier: string
    rating: number
    comment: string
    createdAt: string
    organizerReply?: string | null
    repliedAt?: string  | null
}