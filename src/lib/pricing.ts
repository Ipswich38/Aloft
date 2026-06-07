/**
 * Simple, transparent delivery pricing (centavos).
 * Tunable per operator. Priced on distance + weight, with optional add-ons.
 */
import type { DeliveryMode } from "./delivery-modes";

export const PRICING = {
  baseCentavos: 50000, // ₱500 dispatch base
  perKmCentavos: 6000, // ₱60 / km
  perKgCentavos: 8000, // ₱80 / kg
  landBaseCentavos: 25000, // ₱250 rider/van dispatch base
  landPerKmCentavos: 3500, // ₱35 / km
  landPerKgCentavos: 4500, // ₱45 / kg
  coldChainSurchargeCentavos: 30000, // ₱300 if temperature-controlled
  prioritySurchargeCentavos: 15000, // ₱150 for priority (front-of-queue)
} as const;

export function quote(opts: {
  distanceKm: number;
  weightKg: number;
  mode?: DeliveryMode;
  coldChain?: boolean;
  priority?: boolean;
}): number {
  const mode = opts.mode ?? "air";
  const base =
    mode === "land" ? PRICING.landBaseCentavos : PRICING.baseCentavos;
  const perKm =
    mode === "land" ? PRICING.landPerKmCentavos : PRICING.perKmCentavos;
  const perKg =
    mode === "land" ? PRICING.landPerKgCentavos : PRICING.perKgCentavos;

  return Math.round(
    base +
      opts.distanceKm * perKm +
      opts.weightKg * perKg +
      (opts.coldChain ? PRICING.coldChainSurchargeCentavos : 0) +
      (opts.priority ? PRICING.prioritySurchargeCentavos : 0),
  );
}
