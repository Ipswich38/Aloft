/**
 * Central brand + product configuration.
 * Change values here to re-skin / re-brand the whole app (clone-per-client friendly).
 */
export const siteConfig = {
  name: "Aloft",
  tagline: "Drone delivery for the Philippine islands",
  // "Aloft" = up in the air — packages carried over water and mountains.
  description:
    "Aloft is a Philippine drone-delivery platform built on DJI FlyCart aircraft — " +
    "moving medicine, supplies, and documents across islands and mountains where roads are slow.",
  locale: "en-PH",
  currency: "PHP",
  currencySymbol: "₱",
  contactEmail: "ops@aloft.ph",
  // Primary use case the product is designed around.
  useCase: "island-rural-last-mile" as const,
  roles: ["customer", "merchant", "operator"] as const,
  colors: {
    // Sky + island palette
    brand: "#0EA5E9", // sky-500
    brandDark: "#0369A1", // sky-700
    accent: "#F59E0B", // amber-500
  },
} as const;

export type AppRole = (typeof siteConfig.roles)[number];
