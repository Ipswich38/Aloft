import { getCorridors, getOrder, getDropSites } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { DemoBanner } from "@/components/status";
import { BookingForm, type BookingRoute, type BookingInitial } from "./BookingForm";

export default async function NewDeliveryPage({
  searchParams,
}: {
  searchParams: Promise<{ reorder?: string }>;
}) {
  const [{ reorder }, corridors, sites] = await Promise.all([
    searchParams,
    getCorridors(),
    getDropSites(),
  ]);
  const siteName = (id: string) => sites.find((s) => s.id === id)?.name ?? "—";

  const routes: BookingRoute[] = corridors.map((c) => ({
    id: c.id,
    fromName: siteName(c.originSiteId),
    toName: siteName(c.destSiteId),
    distanceKm: c.distanceKm,
  }));

  // Re-order: prefill from a past delivery.
  let initial: BookingInitial | undefined;
  if (reorder) {
    const order = await getOrder(reorder);
    if (order) {
      const corridor = corridors.find(
        (c) => c.originSiteId === order.originSiteId && c.destSiteId === order.destSiteId,
      );
      initial = {
        corridorId: corridor?.id,
        category: order.category ?? undefined,
        cargo: order.cargoDescription,
        weight: order.weightKg,
        priority: order.priority,
      };
    }
  }

  return (
    <>
      <DemoBanner show={!isSupabaseConfigured()} />
      <PageHeader
        title={reorder ? "Send again" : "Book a delivery"}
        subtitle="Fly it. Today!"
      />
      {routes.length === 0 ? (
        <p className="text-sm text-muted">
          No approved routes yet. Ask your operator to set up a service area.
        </p>
      ) : (
        <BookingForm routes={routes} initial={initial} />
      )}
    </>
  );
}
