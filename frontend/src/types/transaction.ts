export type TransactionStatus =
| "WAITING_CONFIRM"
| "DONE"
| "REJECTED"
| "CANCELED"
| "EXPIRED"

export interface TransactionItem {
    id: string
    customerName: string
    eventName: string
    ticketTier: string
    quantity: number
    totalPrice: number
    status: TransactionStatus
    autoCancelCountdown?: string
}