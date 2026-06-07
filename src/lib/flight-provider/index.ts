/**
 * Active flight provider selection.
 *
 * The whole app imports `flightProvider` from here and never references a specific
 * vendor. To add a new backend, implement FlightProvider and switch it in below
 * with FLIGHT_PROVIDER.
 */
import { djiCloudApiProvider } from "./dji-cloud-api";
import { deliveryHubProvider } from "./deliveryhub";
import { simulatedFlightProvider } from "./simulated";
import type { FlightProvider } from "./types";

const providers = {
  deliveryhub: deliveryHubProvider,
  "dji-cloud-api": djiCloudApiProvider,
  simulated: simulatedFlightProvider,
} satisfies Record<string, FlightProvider>;

export type FlightProviderId = keyof typeof providers;

function selectProvider(): FlightProvider {
  const requested = process.env.FLIGHT_PROVIDER as FlightProviderId | undefined;
  if (requested && providers[requested]) return providers[requested];

  if (deliveryHubProvider.isConfigured()) return deliveryHubProvider;
  if (djiCloudApiProvider.isConfigured()) return djiCloudApiProvider;
  return simulatedFlightProvider;
}

export const flightProvider: FlightProvider = selectProvider();
export const availableFlightProviders = providers;

export type {
  FlightProvider,
  DispatchPayload,
  DispatchResult,
  NormalizedStatusUpdate,
} from "./types";
