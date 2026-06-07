import type { NormalizedStatusUpdate } from "./types";

export function mapProviderStatus(raw: string): NormalizedStatusUpdate["status"] | null {
  switch (raw.toLowerCase()) {
    case "dispatched":
    case "accepted":
    case "preparing":
    case "ready":
    case "queued":
      return "dispatched";
    case "airborne":
    case "in_flight":
    case "in-flight":
    case "enroute":
    case "en_route":
    case "delivering":
    case "executing":
      return "airborne";
    case "completed":
    case "complete":
    case "delivered":
    case "returned":
    case "success":
      return "completed";
    case "aborted":
    case "failed":
    case "cancelled":
    case "canceled":
    case "error":
      return "aborted";
    default:
      return null;
  }
}
