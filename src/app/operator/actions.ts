"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  getCorridors,
  getDrones,
  getPilots,
  getOperatorCredentials,
  getDropSites,
  getOrders,
} from "@/lib/data";
import { dispatchDemoFlight } from "@/lib/demo-store";
import { checkFlightCompliance } from "@/lib/compliance";
import { flightProvider } from "@/lib/flight-provider";

const schema = z.object({
  corridorId: z.string().min(1),
  droneId: z.string().min(1),
  pilotId: z.string().min(1),
  plannedAltM: z.coerce.number().int().positive().default(100),
  orderId: z.string().optional(),
});

export interface DispatchState {
  ok?: boolean;
  blockers?: string[];
  warnings?: string[];
  jobId?: string;
  message?: string;
}

const isValid = (d: string | null | undefined) => !!d && new Date(d) > new Date();

export async function planAndDispatch(
  _prev: DispatchState | undefined,
  formData: FormData,
): Promise<DispatchState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, blockers: ["Invalid flight plan."] };
  const { corridorId, droneId, pilotId, plannedAltM, orderId } = parsed.data;

  const [corridors, drones, pilots, creds, sites, orders] = await Promise.all([
    getCorridors(),
    getDrones(),
    getPilots(),
    getOperatorCredentials(),
    getDropSites(),
    getOrders(),
  ]);

  const corridor = corridors.find((c) => c.id === corridorId);
  const drone = drones.find((d) => d.id === droneId);
  const pilot = pilots.find((p) => p.id === pilotId);
  if (!corridor || !drone || !pilot)
    return { ok: false, blockers: ["Drone, pilot, or corridor not found."] };

  const roc = creds.find((c) => c.kind === "operator_roc");
  const insurance = creds.find((c) => c.kind === "insurance");

  // The CAAP gate — this is the legal go/no-go.
  const gate = checkFlightCompliance({
    droneRegistrationValid: isValid(drone.registrationExpiry),
    pilotLicenceValid: isValid(pilot.rplExpiry),
    operatorRocValid: isValid(roc?.validUntil),
    insuranceValid: isValid(insurance?.validUntil),
    isBvlos: corridor.isBvlos,
    specialPermitValid: isValid(corridor.permitExpiry) && !!corridor.specialPermitNumber,
    plannedAltitudeM: plannedAltM,
    nearestAirportKm: corridor.nearestAirportKm,
  });

  if (!gate.cleared) {
    return { ok: false, blockers: gate.blockers, warnings: gate.warnings };
  }

  // Cleared → hand the mission to DJI DeliveryHub.
  const origin = sites.find((s) => s.id === corridor.originSiteId);
  const dest = sites.find((s) => s.id === corridor.destSiteId);
  // Carry the real cargo weight when an order is attached.
  const order = orderId ? orders.find((o) => o.id === orderId) : undefined;
  if (order && order.deliveryMode !== "air") {
    return {
      ok: false,
      blockers: ["Selected order is a land delivery and cannot be dispatched as a drone flight."],
      warnings: gate.warnings,
    };
  }
  if (order && (order.originSiteId !== corridor.originSiteId || order.destSiteId !== corridor.destSiteId)) {
    return {
      ok: false,
      blockers: ["Selected order does not match the selected corridor."],
      warnings: gate.warnings,
    };
  }
  const handoff = await flightProvider.dispatch({
    flightId: `flt-${Date.now()}`,
    droneTail: drone.tailNumber,
    pilotName: pilot.fullName,
    corridorName: corridor.name,
    originLatLng: [origin?.lat ?? 0, origin?.lng ?? 0],
    destLatLng: [dest?.lat ?? 0, dest?.lng ?? 0],
    plannedAltitudeM: plannedAltM,
    cargoWeightKg: order?.weightKg ?? 0,
  });

  if (!handoff.accepted) {
    return { ok: false, blockers: [handoff.message], warnings: gate.warnings };
  }

  if (!isSupabaseConfigured()) {
    await dispatchDemoFlight({
      corridorId,
      droneId,
      pilotId,
      plannedAltM,
      deliveryhubJobId: handoff.jobId,
      orderId,
    });
    revalidatePath("/operator/flights");
    revalidatePath("/operator");
    revalidatePath("/merchant");
    revalidatePath("/customer");
    if (orderId) revalidatePath(`/customer/track/${orderId}`);
  } else {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: flight } = await supabase
      .from("flights")
      .insert({
        corridor_id: corridorId,
        drone_id: droneId,
        pilot_id: pilotId,
        status: "dispatched",
        planned_alt_m: plannedAltM,
        deliveryhub_job_id: handoff.jobId,
        dispatched_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (flight && orderId) {
      await supabase
        .from("orders")
        .update({ status: "in_flight", flight_id: flight.id })
        .eq("id", orderId);
    }

    await supabase.from("audit_log").insert({
      actor_id: user?.id ?? null,
      entity: "flight",
      entity_id: flight?.id ?? null,
      action: "compliance_check_passed_dispatched",
      detail: {
        corridor: corridor.name,
        provider: flightProvider.id,
        deliveryhub_job: handoff.jobId,
        warnings: gate.warnings,
      },
    });

    revalidatePath("/operator/flights");
    revalidatePath("/operator");
  }

  return {
    ok: true,
    warnings: gate.warnings,
    jobId: handoff.jobId,
    message: handoff.message,
  };
}
