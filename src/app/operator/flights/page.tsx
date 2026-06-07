import {
  getFlights,
  getCorridors,
  getDrones,
  getPilots,
  getOrders,
} from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { Card, PageHeader } from "@/components/ui";
import { FlightStatusBadge, DemoBanner } from "@/components/status";
import { FlightPlanner } from "./FlightPlanner";

export default async function FlightsPage() {
  const [flights, corridors, drones, pilots, orders] = await Promise.all([
    getFlights(),
    getCorridors(),
    getDrones(),
    getPilots(),
    getOrders(),
  ]);
  const corridorName = (id: string | null) =>
    corridors.find((c) => c.id === id)?.name ?? "—";
  const droneTail = (id: string | null) =>
    drones.find((d) => d.id === id)?.tailNumber ?? "—";
  const pilotName = (id: string | null) =>
    pilots.find((p) => p.id === id)?.fullName ?? "—";

  const acceptedOrders = orders.filter((o) => o.status === "accepted" && o.deliveryMode === "air");

  return (
    <>
      <DemoBanner show={!isSupabaseConfigured()} />
      <PageHeader title="Flights" subtitle="Plan, clear, and dispatch missions." />

      <div className="mb-6">
        <FlightPlanner
          corridors={corridors}
          drones={drones}
          pilots={pilots}
          acceptedOrders={acceptedOrders}
        />
      </div>

      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
        Recent flights
      </h2>
      {flights.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">No flights yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {flights.map((f) => (
            <Card key={f.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted">{f.id}</span>
                    <FlightStatusBadge status={f.status} />
                  </div>
                  <p className="mt-1 font-semibold text-ink">
                    {corridorName(f.corridorId)}
                  </p>
                  <p className="text-sm text-muted">
                    {droneTail(f.droneId)} · {pilotName(f.pilotId)} · {f.plannedAltM} m AGL
                  </p>
                </div>
                {f.deliveryhubJobId && (
                  <span className="rounded-lg bg-black/[0.06] px-2 py-1 font-mono text-xs text-ink-soft">
                    DeliveryHub {f.deliveryhubJobId}
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
