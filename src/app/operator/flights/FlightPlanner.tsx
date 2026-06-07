"use client";

import { useActionState, useMemo, useState } from "react";
import { planAndDispatch, type DispatchState } from "../actions";
import { Button, Card, Field, inputClass } from "@/components/ui";
import type { Corridor, Drone, Pilot, Order } from "@/lib/types";

export function FlightPlanner({
  corridors,
  drones,
  pilots,
  acceptedOrders,
}: {
  corridors: Corridor[];
  drones: Drone[];
  pilots: Pilot[];
  acceptedOrders: Order[];
}) {
  const [state, action, pending] = useActionState<DispatchState | undefined, FormData>(
    planAndDispatch,
    undefined,
  );
  const activeDrones = drones.filter((d) => d.status === "active");
  const [alt, setAlt] = useState(100);
  const [orderId, setOrderId] = useState("");
  const [corridorId, setCorridorId] = useState(corridors[0]?.id ?? "");
  const orderRoute = useMemo(() => {
    const order = acceptedOrders.find((o) => o.id === orderId);
    if (!order) return null;
    return corridors.find(
      (c) => c.originSiteId === order.originSiteId && c.destSiteId === order.destSiteId,
    ) ?? null;
  }, [acceptedOrders, corridors, orderId]);

  return (
    <Card>
      <h3 className="font-semibold text-ink">Plan &amp; dispatch a flight</h3>
      <p className="mt-1 text-sm text-muted">
        Runs the CAAP compliance gate, then hands off to DJI DeliveryHub.
      </p>

      <form action={action} className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Order (optional)">
          <select
            name="orderId"
            className={inputClass}
            value={orderId}
            onChange={(event) => {
              const nextOrderId = event.target.value;
              setOrderId(nextOrderId);
              const order = acceptedOrders.find((o) => o.id === nextOrderId);
              const route = order
                ? corridors.find(
                    (c) => c.originSiteId === order.originSiteId && c.destSiteId === order.destSiteId,
                  )
                : null;
              if (route) setCorridorId(route.id);
            }}
          >
            <option value="">— none —</option>
            {acceptedOrders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.id} · {o.cargoDescription} ({o.weightKg} kg)
              </option>
            ))}
          </select>
        </Field>

        <Field label="Corridor">
          <select
            name="corridorId"
            required
            className={inputClass}
            value={corridorId}
            onChange={(event) => setCorridorId(event.target.value)}
          >
            {corridors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.distanceKm} km
              </option>
            ))}
          </select>
          {orderRoute && (
            <p className="mt-1.5 text-xs text-muted">
              Matched to selected order route: {orderRoute.name}.
            </p>
          )}
        </Field>

        <Field label="Drone">
          <select name="droneId" required className={inputClass} defaultValue={activeDrones[0]?.id}>
            {activeDrones.map((d) => (
              <option key={d.id} value={d.id}>
                {d.tailNumber} · {d.model}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Pilot">
          <select name="pilotId" required className={inputClass} defaultValue={pilots[0]?.id}>
            {pilots.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Planned altitude (m AGL)" hint="CAAP standard ceiling is 120 m.">
          <input
            name="plannedAltM"
            type="number"
            min={10}
            max={400}
            value={alt}
            onChange={(e) => setAlt(Number(e.target.value))}
            className={inputClass}
          />
        </Field>

        <div className="flex items-end">
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Running compliance gate…" : "Run gate & dispatch"}
          </Button>
        </div>
      </form>

      {state && (
        <div className="mt-5">
          {state.ok ? (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              <strong>✓ Cleared &amp; dispatched.</strong> DeliveryHub job{" "}
              <span className="font-mono">{state.jobId}</span>
              {state.provider && <span> via {state.provider}</span>}. {state.message}
            </div>
          ) : (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <strong>✗ Dispatch blocked by CAAP gate:</strong>
              <ul className="mt-1 list-disc pl-5">
                {state.blockers?.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          )}
          {state.warnings && state.warnings.length > 0 && (
            <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <strong>Warnings:</strong>
              <ul className="mt-1 list-disc pl-5">
                {state.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
