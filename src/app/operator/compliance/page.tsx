import { getOperatorCredentials, getCorridors, getDropSites } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { Card, PageHeader, Badge } from "@/components/ui";
import { DemoBanner } from "@/components/status";
import { CAAP } from "@/lib/compliance";

function validBadge(d: string | null) {
  if (!d) return <Badge tone="red">No expiry / missing</Badge>;
  return new Date(d) > new Date() ? (
    <Badge tone="green">Valid until {d}</Badge>
  ) : (
    <Badge tone="red">Expired {d}</Badge>
  );
}

export default async function CompliancePage() {
  const [creds, corridors, sites] = await Promise.all([
    getOperatorCredentials(),
    getCorridors(),
    getDropSites(),
  ]);
  const siteName = (id: string) => sites.find((s) => s.id === id)?.name ?? "—";

  return (
    <>
      <DemoBanner show={!isSupabaseConfigured()} />
      <PageHeader
        title="Compliance"
        subtitle="CAAP credentials and approved BVLOS corridors. Everything a flight is gated on."
      />

      <div className="mb-6 rounded-xl border border-line bg-white p-4 text-sm text-ink-soft">
        <strong className="text-ink">CAAP envelope:</strong> FlyCart-class drones
        (7–{CAAP.weightClasses.heavy} kg) need registration + RPL + ROC + insurance. Default
        ops are VLOS, ≤{CAAP.maxAltitudeAglM} m AGL, &gt;{CAAP.minAirportDistanceKm} km from
        airports. Delivery is BVLOS → each corridor needs a Special Flight Permit.
      </div>

      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
        Operator credentials
      </h2>
      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        {creds.map((c) => (
          <Card key={c.id}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-ink">
                  {c.kind === "operator_roc" ? "RPAS Operator Certificate" : "Third-Party Liability Insurance"}
                </p>
                <p className="font-mono text-xs text-muted">{c.reference}</p>
              </div>
              {validBadge(c.validUntil)}
            </div>
          </Card>
        ))}
      </div>

      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
        BVLOS corridors
      </h2>
      <div className="grid gap-3">
        {corridors.map((c) => {
          const permitOk = !!c.specialPermitNumber && new Date(c.permitExpiry ?? 0) > new Date();
          return (
            <Card key={c.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{c.name}</p>
                  <p className="text-sm text-muted">
                    {siteName(c.originSiteId)} → {siteName(c.destSiteId)} · {c.distanceKm} km ·{" "}
                    {c.nearestAirportKm} km from airport
                  </p>
                </div>
                <div className="text-right">
                  {c.isBvlos && <Badge tone="sky">BVLOS</Badge>}{" "}
                  {permitOk ? (
                    <Badge tone="green">Permit {c.specialPermitNumber}</Badge>
                  ) : (
                    <Badge tone="red">No valid permit</Badge>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
