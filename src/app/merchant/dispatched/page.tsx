import { getOrders, getDropSites } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { Card, PageHeader } from "@/components/ui";
import { OrderStatusBadge, DemoBanner } from "@/components/status";

export default async function MerchantDispatched() {
  const [orders, sites] = await Promise.all([getOrders(), getDropSites()]);
  const siteName = (id: string) => sites.find((s) => s.id === id)?.name ?? "—";
  const dispatched = orders.filter((o) =>
    ["in_flight", "delivered"].includes(o.status),
  );

  return (
    <>
      <DemoBanner show={!isSupabaseConfigured()} />
      <PageHeader title="Dispatched" subtitle="Orders handed to a flight." />
      {dispatched.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">Nothing dispatched yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {dispatched.map((o) => (
            <Card key={o.id}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted">{o.id}</span>
                    <OrderStatusBadge status={o.status} />
                  </div>
                  <p className="mt-1 font-semibold text-ink">{o.cargoDescription}</p>
                  <p className="text-sm text-muted">
                    {siteName(o.originSiteId)} → {siteName(o.destSiteId)} · {o.weightKg} kg
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
