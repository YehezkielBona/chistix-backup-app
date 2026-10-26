export type DiscountInput = {
    discountType: "PERCENTAGE" | "FIXED"; discount:
        number
} | null;
export function applyDiscount(amount: number, d: DiscountInput): number {
    if (!d || amount <= 0) return 0;
    const cut = d.discountType === "PERCENTAGE" ? Math.floor((amount *
        d.discount) / 100) : d.discount;
    return Math.min(cut, amount);
}
export function calculatePrice(p: {
    unitPrice: number;
    quantity: number;
    voucher: DiscountInput;
    coupon: DiscountInput;
    pointsRequested: number;
    pointsBalance: number;
}) {
    const subtotal = p.unitPrice * p.quantity;
    const voucherDiscount = applyDiscount(subtotal, p.voucher);
    const afterVoucher = subtotal - voucherDiscount;
    const couponDiscount = applyDiscount(afterVoucher, p.coupon);
    const afterCoupon = afterVoucher - couponDiscount;
    const pointUsed = Math.max(0, Math.min(p.pointsRequested, p.pointsBalance,
        afterCoupon));
    return {
        subtotal, voucherDiscount, couponDiscount, pointUsed, totalPrice:
            afterCoupon - pointUsed
    };
}