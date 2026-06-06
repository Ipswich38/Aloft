import { getDrones, getPilots } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { Card, PageHeader, Badge } from "@/components/ui";
import { DemoBanner } from "@/components/status";
import { FLYCART_SPECS } from "@/lib/flycart";

function expiryBadge(d: string | null) {
  if (!d) return <Badge tone="red">Missing</Badge>;
  const valid = new Date(d) > new Date();
  return valid ? <Badge tone="green">Valid · {d}</Badge> : <Badge tone="red">Expired · {d}</Badge>;
}

export default async function FleetPage() {
  const [drones, pilots] = await Promise.all([getDrones(), getPilots()]);

  return (
    <>
      <DemoBanner show={!isSupabaseConfigured()} />
      <PageHeader title="Fleet" subtitle="Aircraft and licensed pilots." />

      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
        Drones
      </h2>
      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        {drones.map((d) => {
          const spec = FLYCART_SPECS[d.model];
          return (
            <Card key={d.id}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-ink">{d.tailNumber}</p>
                  <p className="text-sm text-muted">{spec.name}</p>
                </div>
                <Badge tone={d.status === "active" ? "green" : d.status === "maintenance" ? "amber" : "red"}>
                  {d.status}
                </Badge>
              </div>
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Payload (planned)</dt>
                  <dd className="font-medium">{spec.plannedPayloadKg} kg</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">CAAP registration</dt>
                  <dd>{expiryBadge(d.registrationExpiry)}</dd>
                </div>
              </dl>
            </Card>
          );
        })}
      </div>

      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
        Pilots
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {pilots.map((p) => (
          <Card key={p.id}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-ink">{p.fullName}</p>
                <p className="font-mono text-xs text-muted">{p.rplNumber ?? "No RPL"}</p>
              </div>
              {expiryBadge(p.rplExpiry)}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
