import Link from "next/link";
import { getOrders, getDropSites } from "@/lib/data";
import { getSessionProfile } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { Card } from "@/components/ui";
import { OrderStatusBadge, DemoBanner } from "@/components/status";
import { SendIcon, ChevronRightIcon, BoxIcon } from "@/components/icons";
import { peso, shortDate } from "@/lib/format";
import type { Order } from "@/lib/types";

const ACTIVE: Order["status"][] = ["submitted", "accepted", "scheduled", "in_flight"];
const IN_TRANSIT: Order["status"][] = ["accepted", "scheduled", "in_flight"];

export default async function CustomerHome() {
  const [orders, sites, profile] = await Promise.all([
    getOrders(),
    getDropSites(),
    getSessionProfile(),
  ]);
  const siteName = (id: string) => sites.find((s) => s.id === id)?.name ?? "—";
  const firstName = (profile?.fullName ?? "").split(" ")[0];

  const active = orders.filter((o) => ACTIVE.includes(o.status));
  const past = orders.filter((o) => !ACTIVE.includes(o.status));

  // Business summary
  const now = new Date();
  const thisMonth = (iso: string) => {
    const d = new Date(iso);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  };
  const inTransit = orders.filter((o) => IN_TRANSIT.includes(o.status)).length;
  const deliveredThisMonth = orders.filter(
    (o) => o.status === "delivered" && thisMonth(o.createdAt),
  ).length;
  const spendThisMonth = orders
    .filter((o) => thisMonth(o.createdAt))
    .reduce((sum, o) => sum + (o.priceCentavos ?? 0), 0);

  return (
    <>
      <DemoBanner show={!isSupabaseConfigured()} />

      <div className="mb-5">
        <p className="text-sm text-ink-soft">{greeting()}{firstName ? `, ${firstName}` : ""}</p>
        <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-ink">What are we sending?</h1>
      </div>

      {/* Business summary strip */}
      <div className="mb-5 grid grid-cols-3 overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]">
        <Stat value={String(inTransit)} label="In transit" />
        <Stat value={String(deliveredThisMonth)} label="Delivered" sub="this month" divider />
        <Stat value={peso(spendThisMonth)} label="Spent" sub="this month" divider />
      </div>

      {/* Primary action */}
      <Link href="/customer/new" className="group block">
        <div className="flex items-center gap-4 rounded-2xl bg-ink p-5 text-white shadow-[var(--shadow-pop)] transition active:scale-[0.99]">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
            <SendIcon size={24} />
          </span>
          <div className="flex-1">
            <p className="text-base font-semibold">Send a package</p>
            <p className="text-sm text-white/70">Pick a route, see the price, confirm.</p>
          </div>
          <ChevronRightIcon size={22} className="text-white/60 transition group-hover:translate-x-0.5" />
        </div>
      </Link>

      {/* Active deliveries */}
      {active.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Active</h2>
          <div className="space-y-3">
            {active.map((o) => (
              <Link key={o.id} href={`/customer/track/${o.id}`} className="block">
                <Card className="transition active:scale-[0.99]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <OrderStatusBadge status={o.status} />
                    </div>
                    <span className="text-xs text-muted">{shortDate(o.createdAt)}</span>
                  </div>
                  <p className="mt-2 font-semibold text-ink">{o.cargoDescription}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-soft">
                    <span>{siteName(o.originSiteId)}</span>
                    <ChevronRightIcon size={14} className="text-muted" />
                    <span>{siteName(o.destSiteId)}</span>
                  </p>
                  <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                    <span className="text-sm text-ink-soft">{o.weightKg} kg</span>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-strong">
                      Track <ChevronRightIcon size={16} />
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* History */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          {active.length > 0 ? "Past deliveries" : "Your deliveries"}
        </h2>
        {past.length === 0 && active.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand-strong">
              <BoxIcon size={24} />
            </div>
            <p className="mt-3 font-semibold text-ink">No deliveries yet</p>
            <p className="mt-1 text-sm text-ink-soft">Your first drone delivery is one tap away.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            {past.map((o, i) => (
              <div
                key={o.id}
                className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-line" : ""}`}
              >
                <Link href={`/customer/track/${o.id}`} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{o.cargoDescription}</p>
                  <p className="truncate text-xs text-muted">
                    {siteName(o.originSiteId)} → {siteName(o.destSiteId)} · {peso(o.priceCentavos)}
                  </p>
                </Link>
                <OrderStatusBadge status={o.status} />
                <Link
                  href={`/customer/new?reorder=${o.id}`}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-ink transition hover:bg-canvas"
                  aria-label={`Re-order ${o.cargoDescription}`}
                >
                  <ReorderIcon /> Re-order
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function Stat({
  value,
  label,
  sub,
  divider,
}: {
  value: string;
  label: string;
  sub?: string;
  divider?: boolean;
}) {
  return (
    <div className={`px-3 py-4 text-center ${divider ? "border-l border-line" : ""}`}>
      <p className="text-xl font-bold tracking-tight text-ink">{value}</p>
      <p className="mt-0.5 text-[11px] font-medium leading-tight text-muted">
        {label}
        {sub && <span className="block">{sub}</span>}
      </p>
    </div>
  );
}

function ReorderIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
