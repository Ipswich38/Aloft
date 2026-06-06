/**
 * Delivery categories — the consumer-facing purposes Aloft serves.
 * The island/clinic medical logistics lives under "medicine"; nothing was removed,
 * the app just now offers food / groceries / parcels alongside it.
 */
export type DeliveryCategoryId = "food" | "groceries" | "parcel" | "medicine";

export interface DeliveryCategory {
  id: DeliveryCategoryId;
  label: string;
  blurb: string;
  /** icon key resolved in the UI */
  icon: "utensils" | "bag" | "box" | "cross";
  /** whether cold-chain handling is commonly offered for this category */
  coldChainCommon: boolean;
}

export const DELIVERY_CATEGORIES: DeliveryCategory[] = [
  { id: "food", label: "Food", blurb: "Hot meals & restaurant orders", icon: "utensils", coldChainCommon: false },
  { id: "groceries", label: "Groceries", blurb: "Market & supermarket runs", icon: "bag", coldChainCommon: true },
  { id: "parcel", label: "Parcel", blurb: "Packages & documents", icon: "box", coldChainCommon: false },
  { id: "medicine", label: "Medicine", blurb: "Pharmacy & clinic supplies", icon: "cross", coldChainCommon: true },
];

export const CATEGORY_LABELS: Record<DeliveryCategoryId, string> = Object.fromEntries(
  DELIVERY_CATEGORIES.map((c) => [c.id, c.label]),
) as Record<DeliveryCategoryId, string>;

/** Weight tiers shown as quick-pick chips (kg). FlyCart 30 handles up to 30 kg. */
export const WEIGHT_TIERS: { label: string; kg: number }[] = [
  { label: "Up to 1 kg", kg: 1 },
  { label: "Up to 3 kg", kg: 3 },
  { label: "Up to 6 kg", kg: 6 },
];
