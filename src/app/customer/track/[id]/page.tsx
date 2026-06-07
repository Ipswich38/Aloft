import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrder, getDropSites, getCorridors } from "@/lib/data";
import { Card, LinkButton } from "@/components/ui";
import { RatingStars } from "@/components/TrackWidgets";
import { CheckIcon, ChevronRightIcon, DroneIcon, SignalIcon } from "@/components/icons";
import { peso, shortDate } from "@/lib/format";
import { FLYCART_SPECS, estimateFlightMinutes } from "@/lib/flycart";
import { CATEGORY_LABELS } from "@/lib/categories";
import type { CSSProperties } from "react";
import type { DropSite, Order, OrderStatus } from "@/lib/types";

const STEPS = ["Order Confirmed", "Drone Assigned", "Picked Up", "In Transit", "Delivered"] as const;
const STATUS_STEP: Record<OrderStatus, number> = {
  draft: -1, submitted: 0, accepted: 1, scheduled: 2, in_flight: 3, delivered: 4,
  cancelled: 99, rejected: 99,
};
const STATUS_PROGRESS: Record<OrderStatus, number> = {
  draft: 0, submitted: 0.08, accepted: 0.18, scheduled: 0.32, in_flight: 0.62, delivered: 1,
  cancelled: 0, rejected: 0,
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
  const origin = sites.find((s) => s.id === order.originSiteId);
  const destination = sites.find((s) => s.id === order.destSiteId);
  const routeProgress = STATUS_PROGRESS[order.status];

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
                <p className="text-sm/none text-white/70">Delivering by drone</p>
                <p className="text-xl font-bold">{order.category ? CATEGORY_LABELS[order.category] : "package"}</p>
              </div>
              <DroneIcon size={56} className="text-white/90" />
            </div>

            <div className="mt-5 rounded-2xl bg-white p-4 text-ink">
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

          {origin && destination && (
            <RouteMap
              origin={origin}
              destination={destination}
              progress={routeProgress}
              distanceKm={distanceKm}
            />
          )}

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

function RouteMap({
  origin,
  destination,
  progress,
  distanceKm,
}: {
  origin: DropSite;
  destination: DropSite;
  progress: number;
  distanceKm: number;
}) {
  const latMin = Math.min(origin.lat, destination.lat);
  const latMax = Math.max(origin.lat, destination.lat);
  const lngMin = Math.min(origin.lng, destination.lng);
  const lngMax = Math.max(origin.lng, destination.lng);
  const latRange = Math.max(latMax - latMin, 0.01);
  const lngRange = Math.max(lngMax - lngMin, 0.01);

  const pointFor = (site: DropSite) => ({
    x: 15 + ((site.lng - lngMin) / lngRange) * 70,
    y: 20 + (1 - (site.lat - latMin) / latRange) * 60,
  });

  const start = pointFor(origin);
  const end = pointFor(destination);
  const drone = {
    x: start.x + (end.x - start.x) * progress,
    y: start.y + (end.y - start.y) * progress,
  };

  return (
    <Card className="mt-4 overflow-hidden p-0">
      <div className="relative aspect-[1.55] min-h-56 bg-[#e8f3ef]">
        <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(90deg,rgba(15,157,119,0.12)_1px,transparent_1px),linear-gradient(rgba(15,157,119,0.12)_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="absolute -left-12 top-12 h-36 w-48 rounded-full bg-white/60 blur-2xl" />
        <div className="absolute bottom-4 right-5 h-28 w-44 rounded-[45%] bg-brand-soft/75 blur-xl" />

        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          <line
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke="rgba(11,18,32,0.16)"
            strokeWidth="2"
            strokeDasharray="4 4"
            strokeLinecap="round"
          />
          <line
            x1={start.x}
            y1={start.y}
            x2={drone.x}
            y2={drone.y}
            stroke="var(--color-brand)"
            strokeWidth="2.75"
            strokeLinecap="round"
          />
        </svg>

        <MapPin point={start} label={origin.name} align="left" tone="origin" />
        <MapPin point={end} label={destination.name} align="right" tone="destination" />

        <div
          className="absolute z-10 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-ink text-white shadow-[var(--shadow-pop)] ring-4 ring-white"
          style={mapPointStyle(drone)}
          aria-label="Current drone position"
        >
          <DroneIcon size={22} />
        </div>

        <div className="absolute bottom-4 left-4 rounded-xl border border-white/70 bg-white/90 px-3 py-2 shadow-[var(--shadow-card)] backdrop-blur">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Live corridor
          </p>
          <p className="text-sm font-semibold text-ink">{distanceKm} km</p>
        </div>
      </div>
    </Card>
  );
}

function MapPin({
  point,
  label,
  align,
  tone,
}: {
  point: { x: number; y: number };
  label: string;
  align: "left" | "right";
  tone: "origin" | "destination";
}) {
  return (
    <div
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={mapPointStyle(point)}
    >
      <span
        className={`block h-4 w-4 rounded-full ring-4 ring-white ${
          tone === "origin" ? "bg-ink" : "bg-accent"
        }`}
      />
      <span
        className={`absolute top-5 max-w-36 rounded-lg border border-white/70 bg-white/90 px-2.5 py-1.5 text-xs font-semibold leading-tight text-ink shadow-[var(--shadow-card)] ${
          align === "left" ? "left-0" : "right-0 text-right"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function mapPointStyle(point: { x: number; y: number }): CSSProperties {
  return {
    left: `${point.x}%`,
    top: `${point.y}%`,
  };
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
