/**
 * Central brand + product configuration.
 * Change values here to re-skin / re-brand the whole app (clone-per-client friendly).
 */
export const siteConfig = {
  name: "Aloft",
  tagline: "Fast. Smart. Delivered by air.",
  // "Aloft" = up in the air — on-demand drone delivery.
  description:
    "Aloft is a Philippine on-demand drone-delivery platform built on DJI FlyCart aircraft — " +
    "food, groceries, parcels, and medicine flown door-to-door, including islands and rural " +
    "areas where roads are slow.",
  locale: "en-PH",
  currency: "PHP",
  currencySymbol: "₱",
  contactEmail: "ops@aloft.ph",
  // Primary use case the product is designed around.
  useCase: "island-rural-last-mile" as const,
  roles: ["customer", "merchant", "operator"] as const,
  colors: {
    // Emerald "delivered by air" palette
    brand: "#0f9d77", // emerald
    brandDark: "#0a7d5e", // emerald-strong
    accent: "#f59e0b", // amber
  },
} as const;

export type AppRole = (typeof siteConfig.roles)[number];
