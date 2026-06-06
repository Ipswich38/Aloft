/**
 * FlightProvider — the contract for whatever backend actually flies the drone.
 *
 * DJI DeliveryHub is the first implementation, but the rest of Aloft talks ONLY to
 * this interface. Swapping providers (or adding non-DJI aircraft) means writing a new
 * implementation, not touching the customer/merchant/operator app.
 */

import type { FlightStatus } from "@/lib/types";

/** What we send to dispatch a cleared mission. */
export interface DispatchPayload {
  flightId: string;
  droneTail: string;
  pilotName: string;
  corridorName: string;
  originLatLng: [number, number];
  destLatLng: [number, number];
  plannedAltitudeM: number;
  cargoWeightKg: number;
}

export interface DispatchResult {
  jobId: string;
  accepted: boolean;
  message: string;
}

/**
 * A provider's raw status event, normalized into the small set of states Aloft cares
 * about. `jobId` ties it back to the flight we dispatched.
 */
export interface NormalizedStatusUpdate {
  jobId: string;
  /** Subset of FlightStatus the provider can report after handoff. */
  status: Extract<FlightStatus, "dispatched" | "airborne" | "completed" | "aborted">;
  /** Optional free-form note from the provider. */
  note?: string;
}

export interface FlightProvider {
  /** Stable id, e.g. "deliveryhub". Stored on the flight for traceability. */
  readonly id: string;
  /** True when real credentials are present; false → simulated/dev behaviour. */
  isConfigured(): boolean;
  /** Hand a cleared flight to the provider for actual flight. */
  dispatch(payload: DispatchPayload): Promise<DispatchResult>;
  /**
   * Verify an inbound webhook is genuinely from this provider.
   * `secret` is whatever shared token the request carried.
   */
  verifyWebhook(secret: string | null): boolean;
  /**
   * Translate a provider's raw webhook body into our normalized status,
   * or null if the body is unrecognized.
   */
  parseStatus(body: unknown): NormalizedStatusUpdate | null;
}
