export type DeliveryMode = "air" | "land";

export const DELIVERY_MODE_LABELS: Record<DeliveryMode, string> = {
  air: "Air",
  land: "Land",
};

export const DELIVERY_MODE_COPY: Record<
  DeliveryMode,
  { title: string; subtitle: string; etaLabel: string }
> = {
  air: {
    title: "Drone",
    subtitle: "Fastest for island and rural routes",
    etaLabel: "flight",
  },
  land: {
    title: "Land courier",
    subtitle: "Rider/van fallback for road-accessible drops",
    etaLabel: "road",
  },
};

export const LAND_MAX_WEIGHT_KG = 80;

export function estimateLandMinutes(distanceKm: number) {
  // Conservative provincial-road estimate with loading/dispatch buffer.
  return Math.max(15, Math.round((distanceKm / 28) * 60 + 12));
}
