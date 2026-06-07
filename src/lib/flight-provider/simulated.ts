import { mapProviderStatus } from "./status";
import type {
  DispatchPayload,
  DispatchResult,
  FlightProvider,
  NormalizedStatusUpdate,
} from "./types";

export const simulatedFlightProvider: FlightProvider = {
  id: "simulated",

  isConfigured() {
    return true;
  },

  async dispatch(payload: DispatchPayload): Promise<DispatchResult> {
    return {
      jobId: `SIM-${Date.now().toString().slice(-6)}`,
      accepted: true,
      message: `Simulated handoff for ${payload.corridorName}. Add DJI credentials and set FLIGHT_PROVIDER to go live.`,
    };
  },

  verifyWebhook(secret: string | null): boolean {
    const expected = process.env.SIMULATED_WEBHOOK_SECRET;
    if (!expected) return true;
    return !!secret && secret === expected;
  },

  parseStatus(body: unknown): NormalizedStatusUpdate | null {
    if (!body || typeof body !== "object") return null;
    const b = body as Record<string, unknown>;
    const jobId = (b.job_id ?? b.jobId ?? b.job_id_sim ?? b.simJobId) as string | undefined;
    const rawStatus = (b.status ?? b.event) as string | undefined;
    if (!jobId || !rawStatus) return null;
    const status = mapProviderStatus(String(rawStatus));
    if (!status) return null;
    return {
      jobId,
      status,
      note: typeof b.note === "string" ? b.note : undefined,
    };
  },
};
