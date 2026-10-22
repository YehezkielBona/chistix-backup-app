export type AttendanceeStatus = "ATTENDED" | "REGISTERED"

export interface AttendeeItem {
    id: string
    eventId: string
    customerName: string
    email: string
    ticketTier: string
    quantity: number
    totalPaid: number
    status: AttendanceeStatus
    checkInTime?: string
}