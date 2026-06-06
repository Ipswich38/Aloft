import { getDrones, getPilots, getOrders, getFlights, getOperatorCredentials } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { Card, PageHeader, LinkButton } from "@/components/ui";
import { DemoBanner } from "@/components/status";

function isValidDate(d: string | null | undefined): boolean {
  if (!d) return false;
  return new Date(d) > new Date();
}

export default async function OperatorOverview() {
  const [drones, pilots, orders, flights, creds] = await Promise.all([
    getDrones(),
    getPilots(),
    getOrders(),
    getFlights(),
    getOperatorCredentials(),
  ]);

  const activeDrones = drones.filter((d) => d.status === "active").length;
  const airborne = flights.filter((f) => f.status === "airborne" || f.status === "dispatched").length;
  const pendingOrders = orders.filter((o) =>
    ["submitted", "accepted"].includes(o.status),
  ).length;

  const roc = creds.find((c) => c.kind === "operator_roc");
  const insurance = creds.find((c) => c.kind === "insurance");
  const rocOk = isValidDate(roc?.validUntil);
  const insOk = isValidDate(insurance?.validUntil);
  const pilotsOk = pilots.some((p) => isValidDate(p.rplExpiry));

  return (
    <>
      <DemoBanner show={!isSupabaseConfigured()} />
      <PageHeader
        title="Operations overview"
        subtitle="Fleet readiness, compliance posture, and live flights at a glance."
        action={<LinkButton href="/operator/flights">Plan a flight</LinkButton>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Active drones" value={`${activeDrones}/${drones.length}`} />
        <Stat label="In the air" value={String(airborne)} />
        <Stat label="Pending orders" value={String(pendingOrders)} />
        <Stat label="Licensed pilots" value={String(pilots.filter((p) => isValidDate(p.rplExpiry)).length)} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card>
          <h3 className="font-semibold text-ink">Compliance posture</h3>
          <p className="mt-1 text-sm text-muted">
            CAAP requires all four to dispatch a FlyCart-class flight.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <Check ok={rocOk} label="RPAS Operator Certificate (ROC)" detail={roc?.reference} />
            <Check ok={insOk} label="Third-party liability insurance" detail={insurance?.reference} />
            <Check ok={pilotsOk} label="At least one valid Remote Pilot Licence" />
            <Check
              ok={drones.some((d) => isValidDate(d.registrationExpiry))}
              label="At least one CAAP-registered drone"
            />
          </ul>
        </Card>

        <Card>
          <h3 className="font-semibold text-ink">The Aloft model</h3>
          <ol className="mt-3 space-y-2 text-sm text-ink-soft">
            <li>1. Customer books → cargo checked vs FlyCart limits.</li>
            <li>2. Merchant accepts and preps the cargo at the hub.</li>
            <li>3. Operator assigns a drone + pilot to a permitted corridor.</li>
            <li>4. CAAP gate must pass (registration, RPL, ROC, insurance, BVLOS permit).</li>
            <li>5. Cleared flight is handed to DJI DeliveryHub for the actual flight.</li>
          </ol>
        </Card>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-3xl font-bold text-ink">{value}</p>
    </Card>
  );
}

function Check({ ok, label, detail }: { ok: boolean; label: string; detail?: string }) {
  return (
    <li className="flex items-start gap-2">
      <span className={ok ? "text-green-600" : "text-red-600"}>{ok ? "✓" : "✗"}</span>
      <span>
        <span className="text-ink">{label}</span>
        {detail && <span className="ml-1 font-mono text-xs text-muted">{detail}</span>}
      </span>
    </li>
  );
}
