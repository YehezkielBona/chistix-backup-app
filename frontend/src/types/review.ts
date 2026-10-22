export interface ReviewItem {
    id: string
    eventId: string
    eventName: string
    customerName: string
    customerEmail: string
    ticketTier: string
    rating: number
    comment: string
    createdAt: string
    organizerReply?: string
    repliedAt?: string
}