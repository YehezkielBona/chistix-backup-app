export const REFERRAL_POINTS = 10_000;
export const REFERRAL_COUPON_AMOUNT = 25_000; // Rp, ganti kalau tim sepakat nilai lain 
export const REWARD_VALID_MONTHS = 3;

export function addMonths(date: Date, months: number) {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
}
// Poin yang benar-benar bisa dipakai (0 kalau sudah hangus)
export function usablePoints(u: {
    points: number | null; pointsExpiresAt:
        Date | null
}, now = new Date()) {
    if (!u.points || !u.pointsExpiresAt || u.pointsExpiresAt <= now) return 0;
    return u.points;
}

// Kupon yang masih aktif, atau null
export function activeCoupon(
    u: {
        couponDiscount: number | null; couponExpiresAt: Date | null;
        couponUsedAt: Date | null
    },
    now = new Date(),
) {
    if (!u.couponDiscount || u.couponUsedAt || !u.couponExpiresAt ||
        u.couponExpiresAt <= now) return null;
    return {
        discountType: "FIXED" as const, discount: u.couponDiscount,
        expiresAt: u.couponExpiresAt
    };
}

