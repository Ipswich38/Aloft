import { getOperatorCredentials, getPilots, getDrones } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { Card, PageHeader, Badge } from "@/components/ui";
import { DemoBanner } from "@/components/status";
import {
  evaluateRoc,
  summarizeRoc,
  type RocItemResult,
  type RocCategory,
  type RocStatus,
} from "@/lib/caap-roc";

const isValid = (d: string | null | undefined) => !!d && new Date(d) > new Date();

const STATUS_BADGE: Record<RocStatus, { tone: "green" | "red" | "amber" | "slate"; label: string }> = {
  evidenced: { tone: "green", label: "✓ In app" },
  missing: { tone: "red", label: "Missing record" },
  prepare: { tone: "amber", label: "Prepare doc" },
  na: { tone: "slate", label: "N/A" },
};

const CATEGORY_ORDER: RocCategory[] = [
  "Legal & corporate",
  "Personnel",
  "Aircraft & equipment",
  "Facilities",
  "Manuals & procedures",
  "Administrative",
];

export default async function ReadinessPage() {
  const [creds, pilots, drones] = await Promise.all([
    getOperatorCredentials(),
    getPilots(),
    getDrones(),
  ]);

  const insurance = creds.find((c) => c.kind === "insurance");
  const items = evaluateRoc({
    // CPCN (item 17) is only for agricultural ops; Aloft is medical/cargo last-mile → N/A.
    isAgricultural: false,
    insuranceValid: isValid(insurance?.validUntil),
    anyValidRpl: pilots.some((p) => isValid(p.rplExpiry)),
    anyRegisteredDrone: drones.some((d) => isValid(d.registrationExpiry)),
  });
  const summary = summarizeRoc(items);

  const byCategory = (cat: RocCategory) => items.filter((i) => i.category === cat);

  return (
    <>
      <DemoBanner show={!isSupabaseConfigured()} />
      <PageHeader
        title="CAAP ROC readiness"
        subtitle="The 21-item RPAS Operator Certificate checklist — your franchise to operate."
      />

      {/* Summary */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted">System-evidenced requirements</p>
            <p className="text-3xl font-bold text-ink">
              {summary.evidenced}
              <span className="text-lg font-medium text-muted">
                {" "}
                / {summary.applicable} applicable
              </span>
            </p>
          </div>
          <div className="flex gap-2 text-sm">
            <Badge tone="green">{summary.evidenced} in app</Badge>
            <Badge tone="red">{summary.missing} missing</Badge>
            <Badge tone="amber">{summary.prepare} to prepare</Badge>
          </div>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-black/[0.06]">
          <div className="h-full rounded-full bg-brand" style={{ width: `${summary.pct}%` }} />
        </div>
        <p className="mt-3 text-xs text-muted">
          The app auto-evidences insurance, pilot licences, and aircraft registration. The
          remaining items are documents, photos, and admin steps you assemble for the 3
          dark-blue binders (CAAP, Operator, facilities).
        </p>
      </Card>

      {/* Checklist by category */}
      <div className="space-y-6">
        {CATEGORY_ORDER.map((cat) => {
          const rows = byCategory(cat);
          if (rows.length === 0) return null;
          return (
            <div key={cat}>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
                {cat}
              </h2>
              <Card className="p-0">
                <ul className="divide-y divide-line">
                  {rows.map((item) => (
                    <Row key={item.no} item={item} />
                  ))}
                </ul>
              </Card>
            </div>
          );
        })}
      </div>
    </>
  );
}

function Row({ item }: { item: RocItemResult }) {
  const badge = STATUS_BADGE[item.status];
  return (
    <li className="flex items-start gap-3 px-5 py-3">
      <span className="mt-0.5 w-6 shrink-0 text-right font-mono text-xs text-muted">
        {item.no}
      </span>
      <div className="flex-1">
        <p className="text-sm font-medium text-ink">{item.title}</p>
        {item.note && <p className="mt-0.5 text-xs text-muted">{item.note}</p>}
      </div>
      <Badge tone={badge.tone}>{badge.label}</Badge>
    </li>
  );
}
