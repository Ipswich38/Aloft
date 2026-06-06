/**
 * Simple, transparent delivery pricing (centavos).
 * Tunable per operator. Island/rural runs are priced on distance + weight.
 */
export const PRICING = {
  baseCentavos: 50000, // ₱500 dispatch base
  perKmCentavos: 6000, // ₱60 / km
  perKgCentavos: 8000, // ₱80 / kg
  coldChainSurchargeCentavos: 30000, // ₱300 if temperature-controlled
} as const;

export function quote(opts: {
  distanceKm: number;
  weightKg: number;
  coldChain?: boolean;
}): number {
  return Math.round(
    PRICING.baseCentavos +
      opts.distanceKm * PRICING.perKmCentavos +
      opts.weightKg * PRICING.perKgCentavos +
      (opts.coldChain ? PRICING.coldChainSurchargeCentavos : 0),
  );
}
