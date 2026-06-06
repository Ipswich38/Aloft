/**
 * DJI FlyCart hardware spec sheet + payload validation.
 *
 * Sources (researched 2026-06):
 *  - DJI FlyCart 30 specs: dji.com/flycart-30/specs
 *  - DJI FlyCart 100 specs: dji.com/flycart-100/specs
 *
 * Flight control itself happens in DJI DeliveryHub (DJI's cloud, on AWS).
 * Aloft is the order-to-handoff layer; these specs let us validate jobs
 * BEFORE we hand them to DeliveryHub so we never dispatch an impossible flight.
 */

export type FlyCartModel = "FC30" | "FC100";

export interface FlyCartSpec {
  model: FlyCartModel;
  name: string;
  /** Max payload in kg (best-case battery configuration). */
  maxPayloadKg: number;
  /** Practical payload (dual-battery, the safe planning default). */
  plannedPayloadKg: number;
  /** Max range fully loaded, one-way, km. Plan round-trips at half this. */
  maxRangeLoadedKm: number;
  /** Cruise speed, m/s. */
  cruiseSpeedMs: number;
  /** Max wind resistance, m/s. Above this, ground the flight. */
  maxWindMs: number;
  /** Service ceiling AGL the airframe supports, m (CAAP caps ops at 120 m). */
  maxAltitudeM: number;
  /** Operating temperature range, °C. */
  tempRangeC: [number, number];
  ipRating: string;
}

export const FLYCART_SPECS: Record<FlyCartModel, FlyCartSpec> = {
  FC30: {
    model: "FC30",
    name: "DJI FlyCart 30",
    maxPayloadKg: 40, // single-battery
    plannedPayloadKg: 30, // dual-battery (the realistic PH workhorse)
    maxRangeLoadedKm: 16,
    cruiseSpeedMs: 20,
    maxWindMs: 12,
    maxAltitudeM: 6000,
    tempRangeC: [-20, 45],
    ipRating: "IP55",
  },
  FC100: {
    model: "FC100",
    name: "DJI FlyCart 100",
    maxPayloadKg: 80, // single-battery
    plannedPayloadKg: 65, // dual-battery
    maxRangeLoadedKm: 12,
    cruiseSpeedMs: 20,
    maxWindMs: 12,
    maxAltitudeM: 6000,
    tempRangeC: [-20, 40],
    ipRating: "IP55",
  },
};

export interface PayloadCheckInput {
  model: FlyCartModel;
  weightKg: number;
  /** One-way distance pickup → dropoff, km. */
  distanceKm: number;
  /** Forecast wind at the corridor, m/s (optional). */
  windMs?: number;
  /** Whether the drone must return to base (round trip) on one charge. */
  roundTrip?: boolean;
}

export interface PayloadCheckResult {
  ok: boolean;
  reasons: string[];
  spec: FlyCartSpec;
}

/**
 * Validate a delivery against the chosen aircraft's limits.
 * Returns ok=false with human-readable reasons if it can't be flown safely.
 */
export function checkPayload(input: PayloadCheckInput): PayloadCheckResult {
  const spec = FLYCART_SPECS[input.model];
  const reasons: string[] = [];

  if (input.weightKg <= 0) {
    reasons.push("Payload weight must be greater than 0 kg.");
  }
  if (input.weightKg > spec.plannedPayloadKg) {
    reasons.push(
      `Payload ${input.weightKg} kg exceeds the planned limit of ${spec.plannedPayloadKg} kg for ${spec.name}.`,
    );
  }

  const requiredRangeKm = input.roundTrip
    ? input.distanceKm * 2
    : input.distanceKm;
  if (requiredRangeKm > spec.maxRangeLoadedKm) {
    reasons.push(
      `Required range ${requiredRangeKm.toFixed(1)} km exceeds the ${spec.maxRangeLoadedKm} km loaded range of ${spec.name}` +
        (input.roundTrip ? " (round trip)." : "."),
    );
  }

  if (input.windMs !== undefined && input.windMs > spec.maxWindMs) {
    reasons.push(
      `Forecast wind ${input.windMs} m/s exceeds the ${spec.maxWindMs} m/s safe limit. Ground the flight.`,
    );
  }

  return { ok: reasons.length === 0, reasons, spec };
}

/** Rough flight-time estimate in minutes for a one-way leg. */
export function estimateFlightMinutes(model: FlyCartModel, distanceKm: number): number {
  const spec = FLYCART_SPECS[model];
  const seconds = (distanceKm * 1000) / spec.cruiseSpeedMs;
  // +3 min overhead for ascent/descent/winch.
  return Math.ceil(seconds / 60) + 3;
}
