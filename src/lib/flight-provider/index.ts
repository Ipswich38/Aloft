/**
 * Active flight provider selection.
 *
 * The whole app imports `flightProvider` from here and never references a specific
 * vendor. To add a new backend, implement FlightProvider and switch it in below
 * (later: choose by env, or per-drone).
 */
import { deliveryHubProvider } from "./deliveryhub";
import type { FlightProvider } from "./types";

export const flightProvider: FlightProvider = deliveryHubProvider;

export type {
  FlightProvider,
  DispatchPayload,
  DispatchResult,
  NormalizedStatusUpdate,
} from "./types";
