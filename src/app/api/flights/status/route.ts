import { NextResponse } from "next/server";
import { flightProvider } from "@/lib/flight-provider";
import { applyDemoFlightStatus } from "@/lib/demo-store";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import type { FlightStatus, OrderStatus } from "@/lib/types";

/**
 * Inbound flight-status webhook (provider-agnostic).
 *
 * The flight provider (DJI DeliveryHub) calls this as a mission progresses. We verify
 * the secret, normalize the event via the provider, then advance the flight and any
 * attached orders — closing the loop from "dispatched" all the way to "delivered".
 *
 * Configure DeliveryHub to POST here, sending the shared secret in `x-webhook-secret`.
 */

// Normalized provider status → (flight status, order status to apply)
const STATUS_MAP: Record<
  "dispatched" | "airborne" | "completed" | "aborted",
  { flight: FlightStatus; order: OrderStatus | null }
> = {
  dispatched: { flight: "dispatched", order: "in_flight" },
  airborne: { flight: "airborne", order: "in_flight" },
  completed: { flight: "completed", order: "delivered" },
  aborted: { flight: "aborted", order: "accepted" }, // back to queue for re-dispatch
};

export async function POST(req: Request) {
  // 1. Authenticate the webhook.
  const secret =
    req.headers.get("x-webhook-secret") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    null;
  if (!flightProvider.verifyWebhook(secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse + normalize the body.
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const update = flightProvider.parseStatus(body);
  if (!update) {
    return NextResponse.json({ error: "Unrecognized status payload" }, { status: 400 });
  }

  const mapped = STATUS_MAP[update.status];

  // 3. Demo mode: persist to the local file-backed demo store.
  if (!isAdminConfigured()) {
    const flightId = await applyDemoFlightStatus({
      jobId: update.jobId,
      flightStatus: mapped.flight,
      orderStatus: mapped.order,
    });
    if (!flightId) {
      return NextResponse.json(
        { error: `No demo flight found for job ${update.jobId}` },
        { status: 404 },
      );
    }
    return NextResponse.json({
      ok: true,
      demo: true,
      flightId,
      jobId: update.jobId,
      status: mapped.flight,
      orderStatus: mapped.order,
    });
  }

  // 4. Persist: advance the flight, then its orders.
  const supabase = createAdminClient();

  const { data: flight, error: flightErr } = await supabase
    .from("flights")
    .update({
      status: mapped.flight,
      ...(update.status === "completed" ? { completed_at: new Date().toISOString() } : {}),
    })
    .eq("deliveryhub_job_id", update.jobId)
    .select("id")
    .single();

  if (flightErr || !flight) {
    return NextResponse.json(
      { error: `No flight found for job ${update.jobId}` },
      { status: 404 },
    );
  }

  if (mapped.order) {
    await supabase.from("orders").update({ status: mapped.order }).eq("flight_id", flight.id);
  }

  await supabase.from("audit_log").insert({
    actor_id: null,
    entity: "flight",
    entity_id: flight.id,
    action: "provider_status_update",
    detail: {
      provider: flightProvider.id,
      job_id: update.jobId,
      status: update.status,
      note: update.note ?? null,
    },
  });

  return NextResponse.json({ ok: true, flightId: flight.id, status: mapped.flight });
}
