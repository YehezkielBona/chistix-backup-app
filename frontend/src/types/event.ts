export type EventStatus = "UPCOMING" | "DRAFT" | "ENDED" | "ON STAGE"

export interface TicketTier {
    id: string
    name: string
    price: number
    finalPrice: number
    quota: number
    sold: number
}

export interface PresaleTicket {
    enabled: boolean
    amount: number
    startDate: string
    endDate: string
}

export interface EventItem {
    id: string
    title: string
    category: string
    date: string
    timeRange?: string
    description: string
    province: string
    city: string
    venueMaps: string
    venueDetail: string
    totalTicket: number
    ticketTiers: TicketTier[]
    presale: PresaleTicket
    thumbnailImage: string
    coverImages: string[]
    videoUrl?: string
    status: EventStatus
    scheduledPublishStart?: string
    scheduledPublishEnd?: string
    organizerId: string
}

export type EventFormData = Omit<EventItem, "id" | "organizerId" | "status">