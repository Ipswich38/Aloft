import { getOrders, getDropSites } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { Card, PageHeader } from "@/components/ui";
import { DeliveryModeBadge, OrderStatusBadge, DemoBanner } from "@/components/status";
import { peso } from "@/lib/format";
import { acceptOrder, rejectOrder } from "./actions";
import { checkPayload } from "@/lib/flycart";
import { getCorridors } from "@/lib/data";

export default async function MerchantQueue() {
  const [orders, sites, corridors] = await Promise.all([
    getOrders(),
    getDropSites(),
    getCorridors(),
  ]);
  const siteName = (id: string) => sites.find((s) => s.id === id)?.name ?? "—";
  const distanceFor = (o: { originSiteId: string; destSiteId: string }) =>
    corridors.find(
      (c) => c.originSiteId === o.originSiteId && c.destSiteId === o.destSiteId,
    )?.distanceKm ?? 0;

  const queue = orders.filter((o) => o.status === "submitted");
  const working = orders.filter((o) =>
    ["accepted", "scheduled"].includes(o.status),
  );

  return (
    <>
      <DemoBanner show={!isSupabaseConfigured()} />
      <PageHeader
        title="Dispatch queue"
        subtitle="Accept incoming bookings and prep them for a flight."
      />

      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
        Incoming ({queue.length})
      </h2>
      {queue.length === 0 ? (
        <Card className="mb-6">
          <p className="text-sm text-muted">No new bookings right now.</p>
        </Card>
      ) : (
        <div className="mb-6 space-y-3">
          {queue.map((o) => {
            const check = checkPayload({
              model: "FC30",
              weightKg: o.weightKg,
              distanceKm: distanceFor(o),
              roundTrip: false,
            });
            return (
              <Card key={o.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted">{o.id}</span>
                      <OrderStatusBadge status={o.status} />
                      <DeliveryModeBadge mode={o.deliveryMode} />
                      {!check.ok && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          Payload issue
                        </span>
                      )}
                    </div>
                    <p className="mt-1 font-semibold text-ink">{o.cargoDescription}</p>
                    <p className="text-sm text-muted">
                      {siteName(o.originSiteId)} → {siteName(o.destSiteId)} · {o.weightKg} kg ·{" "}
                      {peso(o.priceCentavos)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <form action={rejectOrder.bind(null, o.id)}>
                      <button className="rounded-xl border border-line px-3 py-2 text-sm font-medium text-ink-soft hover:bg-canvas">
                        Reject
                      </button>
                    </form>
                    <form action={acceptOrder.bind(null, o.id)}>
                      <button
                        disabled={!check.ok}
                        className="rounded-xl bg-ink px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:opacity-50"
                      >
                        Accept
                      </button>
                    </form>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
        In progress ({working.length})
      </h2>
      {working.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">Nothing in prep.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {working.map((o) => (
            <Card key={o.id}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted">{o.id}</span>
                    <OrderStatusBadge status={o.status} />
                    <DeliveryModeBadge mode={o.deliveryMode} />
                  </div>
                  <p className="mt-1 font-semibold text-ink">{o.cargoDescription}</p>
                  <p className="text-sm text-muted">
                    {siteName(o.originSiteId)} → {siteName(o.destSiteId)} · {o.weightKg} kg
                  </p>
                </div>
                <span className="text-xs text-muted">
                  {o.status === "accepted" ? "Awaiting flight assignment" : "Scheduled"}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
