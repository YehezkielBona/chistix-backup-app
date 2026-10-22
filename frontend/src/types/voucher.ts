export type VoucherStatus = "ACTIVE" | "SCHEDULED" | "EXPIRED";
export type DiscountType = "PERCENTAGE" | "FIXED"

export interface VoucherItem {
  id: string;
  code: string;        
  eventId: string;       
  eventName: string;
  discountType: DiscountType      
  discount: number;       
  validStart: string
  validEnd: string  
  usedCount: number;           
  maxUsage: number
  status: VoucherStatus;
}

export interface VoucherFormInput {
  code: string
  eventId: string
  discountType: DiscountType
  discount: number
  validStart: string
  validEnd: string
  maxUsage: number
}

export type VoucherFormData = Omit<VoucherItem, "id" | "used">;
