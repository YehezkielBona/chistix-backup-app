import type { EventItem } from "@/data/events";
import type { ApiEvent } from "@/types/api";
export function toEventCard(e: ApiEvent): EventItem {
    const tiers = e.ticketTiers.filter((t) => t.quota > 0);
    const cheapest = tiers.reduce<typeof tiers[number] | undefined>(
        (min, t) => (!min || t.finalPrice < min.finalPrice ? t : min),
        undefined,
    );
    return {
        id: e.id,
        title: e.title,
        location: `${e.cityName}, ${e.provinceName}`,
        date: e.startDate,
        price: cheapest?.finalPrice ?? 0,
        originalPrice: cheapest && cheapest.price > cheapest.finalPrice ?
            cheapest.price : undefined,
        image: e.thumbnailImage,
        landscapeImage: e.coverImages[0] ?? e.thumbnailImage,
        isPresale: e.salesPhase === "PRESALE_ACTIVE",
        category: e.category,
        organizer: e.organizer?.name,
        description: e.description,
        status: tiers.length > 0 && tiers.every((t) => t.sold >= t.quota) ?
            "sold-out" : "available",
    };
}