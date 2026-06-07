/**
 * DJI DeliveryHub implementation of FlightProvider.
 *
 * Aloft does NOT fly the drone — DeliveryHub (DJI's cloud, on AWS) does the actual
 * flight planning, dispatch, monitoring and post-flight analytics for FlyCart 30/100.
 * This module is the ONLY DJI-specific code in the app.
 *
 * Until DELIVERYHUB_* env vars are set, dispatch is simulated so the operator flow is
 * end-to-end testable.
 */

import type {
  DispatchPayload,
  DispatchResult,
  FlightProvider,
  NormalizedStatusUpdate,
} from "./types";
import { mapProviderStatus } from "./status";

export const deliveryHubProvider: FlightProvider = {
  id: "deliveryhub",

  isConfigured() {
    return (
      !!process.env.DELIVERYHUB_WEBHOOK_URL && !!process.env.DELIVERYHUB_API_KEY
    );
  },

  async dispatch(payload: DispatchPayload): Promise<DispatchResult> {
    if (!this.isConfigured()) {
      return {
        jobId: `DH-SIM-${Date.now().toString().slice(-6)}`,
        accepted: true,
        message:
          "Simulated handoff (DeliveryHub not configured). Set DELIVERYHUB_* env vars to go live.",
      };
    }

    const res = await fetch(process.env.DELIVERYHUB_WEBHOOK_URL!, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.DELIVERYHUB_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return {
        jobId: "",
        accepted: false,
        message: `DeliveryHub rejected the handoff (HTTP ${res.status}).`,
      };
    }

    const data = (await res.json()) as { job_id?: string };
    return {
      jobId: data.job_id ?? payload.flightId,
      accepted: true,
      message: "Flight handed to DeliveryHub.",
    };
  },

  verifyWebhook(secret: string | null): boolean {
    const expected = process.env.DELIVERYHUB_WEBHOOK_SECRET;
    // If no secret is configured (dev/sim), accept; otherwise require an exact match.
    if (!expected) return true;
    return !!secret && secret === expected;
  },

  parseStatus(body: unknown): NormalizedStatusUpdate | null {
    if (!body || typeof body !== "object") return null;
    // DeliveryHub-style payload: { job_id, status, note? }
    const b = body as Record<string, unknown>;
    const jobId = (b.job_id ?? b.jobId) as string | undefined;
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
