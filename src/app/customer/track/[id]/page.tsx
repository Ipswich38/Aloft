import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrder, getDropSites, getCorridors } from "@/lib/data";
import { Card, LinkButton } from "@/components/ui";
import { RatingStars } from "@/components/TrackWidgets";
import { CheckIcon, ChevronRightIcon, DroneIcon, SignalIcon } from "@/components/icons";
import { peso, shortDate } from "@/lib/format";
import { FLYCART_SPECS, estimateFlightMinutes } from "@/lib/flycart";
import { CATEGORY_LABELS } from "@/lib/categories";
import type { Order, OrderStatus } from "@/lib/types";

const STEPS = ["Order Confirmed", "Drone Assigned", "Picked Up", "In Transit", "Delivered"] as const;
const STATUS_STEP: Record<OrderStatus, number> = {
  draft: -1, submitted: 0, accepted: 1, scheduled: 2, in_flight: 3, delivered: 4,
  cancelled: 99, rejected: 99,
};

function fmtTime(d: Date) {
  return new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit" }).format(d);
}

export default async function TrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, sites, corridors] = await Promise.all([getOrder(id), getDropSites(), getCorridors()]);
  if (!order) notFound();

  const siteName = (sid: string) => sites.find((s) => s.id === sid)?.name ?? "—";
  const corridor = corridors.find(
    (c) => c.originSiteId === order.originSiteId && c.destSiteId === order.destSiteId,
  );
  const spec = FLYCART_SPECS.FC30;
  const distanceKm = corridor?.distanceKm ?? 0;
  const speedKmh = Math.round(spec.cruiseSpeedMs * 3.6);
  const eta = estimateFlightMinutes("FC30", distanceKm);
  const stepIndex = STATUS_STEP[order.status];

  const base = new Date(order.createdAt);
  const stepOffsets = [0, 1, 8, 10, 10 + eta]; // minutes from booking
  const stepTime = (i: number) => fmtTime(new Date(base.getTime() + stepOffsets[i] * 60000));
  const arrival = new Date(base.getTime() + (10 + eta) * 60000);

  const delivered = order.status === "delivered";

  return (
    <>
      <Link
        href="/customer"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ink-soft transition hover:text-ink"
      >
        <ChevronRightIcon size={16} className="rotate-180" /> Home
      </Link>

      {delivered ? (
        <DeliveredView order={order} siteName={siteName} />
      ) : (
        <>
          {/* Hero */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-brand-strong p-5 text-white shadow-[var(--shadow-pop)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm/none text-white/70">Delivering your</p>
                <p className="text-xl font-bold">{order.category ? CATEGORY_LABELS[order.category] : "package"}</p>
              </div>
              <DroneIcon size={56} className="text-white/90" />
            </div>

            {/* faux flight path */}
            <div className="my-5 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-white" />
              <span className="flex-1 border-t-2 border-dashed border-white/50" />
              <span className="h-2.5 w-2.5 rounded-full bg-accent ring-4 ring-white/20" />
            </div>

            <div className="rounded-2xl bg-white p-4 text-ink">
              <p className="text-xs font-medium text-muted">Estimated arrival</p>
              <p className="text-2xl font-bold tracking-tight text-brand-strong">{fmtTime(arrival)}</p>
              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-line pt-3 text-sm">
                <div>
                  <p className="text-xs text-muted">Distance</p>
                  <p className="font-semibold text-ink">{distanceKm} km</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Speed</p>
                  <p className="font-semibold text-ink">{speedKmh} km/h</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                <div>
                  <p className="text-xs text-muted">Delivery ID</p>
                  <p className="font-mono text-sm font-semibold text-ink">{order.id.toUpperCase()}</p>
                </div>
                <div className="flex items-center gap-2 text-brand-strong">
                  <SignalIcon size={18} />
                  <span className="text-sm font-semibold">Live</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status timeline */}
          <Card className="mt-4">
            <h3 className="mb-4 font-semibold text-ink">Delivery details</h3>
            <ol>
              {STEPS.map((label, i) => {
                const done = stepIndex > i;
                const active = stepIndex === i;
                const last = i === STEPS.length - 1;
                return (
                  <li key={label} className="flex gap-4 pb-5 last:pb-0">
                    <div className="relative flex flex-col items-center">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
                          done ? "bg-brand text-white" : active ? "bg-accent text-white" : "bg-black/[0.06] text-muted"
                        }`}
                      >
                        {done ? <CheckIcon size={15} /> : <span className="text-[11px] font-bold">{i + 1}</span>}
                      </span>
                      {!last && <span className={`mt-1 w-0.5 flex-1 ${done ? "bg-brand" : "bg-line"}`} />}
                    </div>
                    <div className={last ? "" : "pb-1"}>
                      <p className={`text-sm font-semibold ${done || active ? "text-ink" : "text-muted"}`}>{label}</p>
                      <p className="text-xs text-muted">{done || active ? stepTime(i) : "--:--"}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>

          {/* Aircraft */}
          <Card className="mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand-strong">
                  <DroneIcon size={24} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{spec.name}</p>
                  <p className="text-xs text-muted">Assigned aircraft</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted">Battery</p>
                <p className="text-sm font-semibold text-brand-strong">78%</p>
              </div>
            </div>
          </Card>
        </>
      )}
    </>
  );
}

function DeliveredView({
  order,
  siteName,
}: {
  order: Order;
  siteName: (id: string) => string;
}) {
  return (
    <>
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-brand-strong p-6 text-center text-white shadow-[var(--shadow-pop)]">
        <DroneIcon size={56} className="mx-auto text-white/90" />
        <div className="mx-auto mt-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand-strong">
          <CheckIcon size={26} />
        </div>
        <p className="mt-3 text-xl font-bold">Delivered successfully!</p>
        <p className="text-sm text-white/80">Your {order.category ? CATEGORY_LABELS[order.category] : "package"} has been delivered.</p>
      </div>

      <Card className="mt-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Delivery info</h3>
        <dl className="space-y-2.5 text-sm">
          <Row label="Delivery ID" value={order.id.toUpperCase()} mono />
          <Row label="Delivered to" value={siteName(order.destSiteId)} />
          <Row label="Delivered on" value={shortDate(order.createdAt)} />
          <div className="flex items-center justify-between border-t border-line pt-2.5">
            <dt className="text-ink-soft">Paid</dt>
            <dd className="text-base font-bold text-ink">{peso(order.priceCentavos)}</dd>
          </div>
        </dl>
      </Card>

      <Card className="mt-4 text-center">
        <p className="text-sm font-semibold text-ink">Rate your experience</p>
        <div className="mt-3">
          <RatingStars />
        </div>
        <textarea
          placeholder="Write a review (optional)…"
          rows={2}
          className="mt-3 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand-soft"
        />
      </Card>

      <LinkButton href="/customer" variant="brand" size="lg" className="mt-4 w-full">
        Done
      </LinkButton>
    </>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="shrink-0 text-ink-soft">{label}</dt>
      <dd className={`text-right font-medium text-ink ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}
