export type AttendanceStatus = "ATTENDED" | "REGISTERED";
export type AttendanceeStatus = AttendanceStatus;

export type TicketTierType = "PRESALE" | "REGULAR" | "VIP";

export interface AttendeeItem {
  id: string;
  ticketCode: string;
  qrToken?: string;
  transactionId?: string;
  eventId: string;
  eventName: string;
  customerName: string;
  email: string;
  ticketTier: TicketTierType | string;
  quantity: number;
  transactionQty?: number;
  totalPaid: number;
  status: AttendanceStatus;
  checkInTime?: string | null;
  createdAt?: string;
}
