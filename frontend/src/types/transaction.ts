export type TransactionStatus =
| "WAITING_PAYMENT"
| "WAITING_CONFIRM"
| "DONE"
| "REJECTED"
| "CANCELED"
| "EXPIRED"

export interface TransactionItem {
    id: string
    eventId: string
    customerName: string
    customerEmail?: string
    eventName: string
    ticketTier: string
    quantity: number
    normalPrice: number
    discPrice: number
    pointUsed: number
    totalPrice: number
    status: TransactionStatus
    paymentProof?: string | null
    voucherCode?: string | null
    createdAt: string
    autoCancelCountdown?: string
}