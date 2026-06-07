import { mapProviderStatus } from "./status";
import type {
  DispatchPayload,
  DispatchResult,
  FlightProvider,
  NormalizedStatusUpdate,
} from "./types";

function requiredConfig() {
  return {
    endpoint: process.env.DJI_CLOUD_API_ENDPOINT,
    appId: process.env.DJI_CLOUD_APP_ID,
    appKey: process.env.DJI_CLOUD_APP_KEY,
    appLicense: process.env.DJI_CLOUD_APP_LICENSE,
    apiToken: process.env.DJI_CLOUD_API_TOKEN,
  };
}

function cloudPayload(payload: DispatchPayload) {
  return {
    external_mission_id: payload.flightId,
    mission_name: payload.corridorName,
    aircraft_call_sign: payload.droneTail,
    pilot_name: payload.pilotName,
    planned_altitude_m: payload.plannedAltitudeM,
    cargo_weight_kg: payload.cargoWeightKg,
    route: {
      origin: {
        lat: payload.originLatLng[0],
        lng: payload.originLatLng[1],
      },
      destination: {
        lat: payload.destLatLng[0],
        lng: payload.destLatLng[1],
      },
    },
    app: {
      id: requiredConfig().appId,
      key: requiredConfig().appKey,
      license: requiredConfig().appLicense,
    },
  };
}

export const djiCloudApiProvider: FlightProvider = {
  id: "dji-cloud-api",

  isConfigured() {
    const cfg = requiredConfig();
    return !!(cfg.endpoint && cfg.appId && cfg.appKey && cfg.appLicense && cfg.apiToken);
  },

  async dispatch(payload: DispatchPayload): Promise<DispatchResult> {
    if (!this.isConfigured()) {
      return {
        jobId: `DJI-CLOUD-SIM-${Date.now().toString().slice(-6)}`,
        accepted: true,
        message:
          "Simulated DJI Cloud API handoff. Set DJI_CLOUD_* env vars when DJI provides the exact endpoint and credentials.",
      };
    }

    const cfg = requiredConfig();
    const res = await fetch(cfg.endpoint!, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${cfg.apiToken}`,
        "x-dji-app-id": cfg.appId!,
      },
      body: JSON.stringify(cloudPayload(payload)),
    });

    if (!res.ok) {
      return {
        jobId: "",
        accepted: false,
        message: `DJI Cloud API rejected the handoff (HTTP ${res.status}).`,
      };
    }

    const data = (await res.json()) as {
      job_id?: string;
      jobId?: string;
      mission_id?: string;
      missionId?: string;
      message?: string;
    };
    return {
      jobId: data.job_id ?? data.jobId ?? data.mission_id ?? data.missionId ?? payload.flightId,
      accepted: true,
      message: data.message ?? "Mission handed to DJI Cloud API.",
    };
  },

  verifyWebhook(secret: string | null): boolean {
    const expected = process.env.DJI_CLOUD_WEBHOOK_SECRET;
    if (!expected) return true;
    return !!secret && secret === expected;
  },

  parseStatus(body: unknown): NormalizedStatusUpdate | null {
    if (!body || typeof body !== "object") return null;
    const b = body as Record<string, unknown>;
    const jobId = (b.job_id ?? b.jobId ?? b.mission_id ?? b.missionId ?? b.gateway_sn) as
      | string
      | undefined;
    const rawStatus = (b.status ?? b.event ?? b.method ?? b.state) as string | undefined;
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
