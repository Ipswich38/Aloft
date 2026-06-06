import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrder, getDropSites } from "@/lib/data";
import { Card } from "@/components/ui";
import { OrderStatusBadge } from "@/components/status";
import { CheckIcon, ChevronRightIcon } from "@/components/icons";
import { peso, shortDate } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

const TIMELINE: { status: OrderStatus; label: string; hint: string }[] = [
  { status: "submitted", label: "Booked", hint: "We received your request" },
  { status: "accepted", label: "Accepted", hint: "Hub is preparing your cargo" },
  { status: "scheduled", label: "Assigned to a flight", hint: "Drone & pilot ready" },
  { status: "in_flight", label: "In the air", hint: "Flying to the drop-site" },
  { status: "delivered", label: "Delivered", hint: "Dropped at destination" },
];

const ORDER_RANK: Record<OrderStatus, number> = {
  draft: -1, submitted: 0, accepted: 1, scheduled: 2, in_flight: 3,
  delivered: 4, cancelled: 99, rejected: 99,
};

export default async function TrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, sites] = await Promise.all([getOrder(id), getDropSites()]);
  if (!order) notFound();

  const siteName = (sid: string) => sites.find((s) => s.id === sid)?.name ?? "—";
  const rank = ORDER_RANK[order.status];

  return (
    <>
      <Link
        href="/customer"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ink-soft transition hover:text-ink"
      >
        <ChevronRightIcon size={16} className="rotate-180" /> Home
      </Link>

      {/* Hero status */}
      <Card className="mb-4">
        <div className="flex items-center justify-between gap-3">
          <OrderStatusBadge status={order.status} />
          <span className="text-xs text-muted">{order.id}</span>
        </div>
        <p className="mt-3 text-lg font-bold tracking-tight text-ink">{order.cargoDescription}</p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
          <span>{siteName(order.originSiteId)}</span>
          <ChevronRightIcon size={14} className="text-muted" />
          <span>{siteName(order.destSiteId)}</span>
        </p>
        {order.status === "in_flight" && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-brand-soft px-4 py-3 text-sm font-medium text-brand-strong">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand" />
            </span>
            Airborne — landing shortly
          </div>
        )}
      </Card>

      {/* Journey */}
      <Card className="mb-4">
        <ol className="relative">
          {TIMELINE.map((step, i) => {
            const stepRank = ORDER_RANK[step.status];
            const done = rank > stepRank;
            const active = rank === stepRank;
            const last = i === TIMELINE.length - 1;
            return (
              <li key={step.status} className="flex gap-4 pb-6 last:pb-0">
                <div className="relative flex flex-col items-center">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                      done || active ? "bg-brand text-white" : "bg-black/[0.06] text-muted"
                    }`}
                  >
                    {done ? <CheckIcon size={16} /> : <span className="text-xs font-bold">{i + 1}</span>}
                  </span>
                  {!last && (
                    <span className={`mt-1 w-0.5 flex-1 ${done ? "bg-brand" : "bg-line"}`} />
                  )}
                </div>
                <div className={last ? "" : "pb-1"}>
                  <p className={`text-sm font-semibold ${done || active ? "text-ink" : "text-muted"}`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-muted">{step.hint}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </Card>

      {/* Details */}
      <Card>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Details</h3>
        <dl className="space-y-2.5 text-sm">
          <Row label="Weight" value={`${order.weightKg} kg`} />
          <Row label="From" value={siteName(order.originSiteId)} />
          <Row label="To" value={siteName(order.destSiteId)} />
          <Row label="Booked" value={shortDate(order.createdAt)} />
          <div className="flex items-center justify-between border-t border-line pt-2.5">
            <dt className="text-ink-soft">Total paid</dt>
            <dd className="text-base font-bold text-ink">{peso(order.priceCentavos)}</dd>
          </div>
        </dl>
      </Card>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="shrink-0 text-ink-soft">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}
