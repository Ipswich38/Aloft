"use client";

import { useActionState, useMemo, useState } from "react";
import { createOrder, type BookingState } from "../actions";
import { Button, Card, Field, inputClass, StickyBar } from "@/components/ui";
import { ChevronRightIcon, ClockIcon } from "@/components/icons";
import { checkPayload, estimateFlightMinutes, FLYCART_SPECS } from "@/lib/flycart";
import { quote } from "@/lib/pricing";
import { peso } from "@/lib/format";
import type { Corridor } from "@/lib/types";

export function BookingForm({ corridors }: { corridors: Corridor[] }) {
  const [state, action, pending] = useActionState<BookingState, FormData>(createOrder, undefined);
  const [corridorId, setCorridorId] = useState(corridors[0]?.id ?? "");
  const [weight, setWeight] = useState(2);
  const [coldChain, setColdChain] = useState(false);

  const corridor = corridors.find((c) => c.id === corridorId);
  const spec = FLYCART_SPECS.FC30;

  const check = useMemo(() => {
    if (!corridor) return null;
    return checkPayload({ model: "FC30", weightKg: weight, distanceKm: corridor.distanceKm, roundTrip: true });
  }, [corridor, weight]);

  const price = corridor ? quote({ distanceKm: corridor.distanceKm, weightKg: weight, coldChain }) : null;
  const eta = corridor ? estimateFlightMinutes("FC30", corridor.distanceKm) : null;
  const weightPct = Math.min(100, Math.round((weight / spec.plannedPayloadKg) * 100));

  return (
    <form action={action}>
      <div className="space-y-4">
        {/* Where to */}
        <Card>
          <Field label="Where to?" hint="Approved drone routes near you.">
            <div className="relative">
              <select
                name="corridorId"
                value={corridorId}
                onChange={(e) => setCorridorId(e.target.value)}
                className={`${inputClass} appearance-none pr-10`}
              >
                {corridors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.distanceKm} km
                  </option>
                ))}
              </select>
              <ChevronRightIcon
                size={18}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-muted"
              />
            </div>
          </Field>
        </Card>

        {/* What's inside */}
        <Card>
          <Field label="What's inside?">
            <input
              name="cargoDescription"
              placeholder="e.g. Vaccines (2 boxes)"
              required
              className={inputClass}
            />
          </Field>

          <label className="mt-4 flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-canvas px-4 py-3">
            <span>
              <span className="block text-sm font-semibold text-ink">Keep it cold</span>
              <span className="block text-xs text-muted">Temperature-controlled · +{peso(30000)}</span>
            </span>
            <span className="relative inline-flex">
              <input
                type="checkbox"
                name="coldChain"
                checked={coldChain}
                onChange={(e) => setColdChain(e.target.checked)}
                className="peer sr-only"
              />
              <span className="h-7 w-12 rounded-full bg-black/15 transition peer-checked:bg-brand" />
              <span className="absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
            </span>
          </label>
        </Card>

        {/* How heavy */}
        <Card>
          <Field label="How heavy?" hint={`Up to ${spec.plannedPayloadKg} kg on the ${spec.name}.`}>
            <div className="flex items-center gap-2">
              <input
                name="weightKg"
                type="number"
                min={0.1}
                step={0.1}
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                required
                className={inputClass}
              />
              <span className="text-sm font-semibold text-ink-soft">kg</span>
            </div>
          </Field>
          {/* Payload meter */}
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-black/[0.06]">
            <div
              className={`h-full rounded-full transition-all ${check?.ok ? "bg-brand" : "bg-red-500"}`}
              style={{ width: `${weightPct}%` }}
            />
          </div>
        </Card>

        {/* Payload problem */}
        {check && !check.ok && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {check.reasons[0]}
          </div>
        )}
        {state?.error && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </div>
        )}
      </div>

      {/* Sticky quote + confirm */}
      <StickyBar>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-2xl font-bold tracking-tight text-ink">{peso(price)}</p>
            <p className="flex items-center gap-1 text-xs text-muted">
              <ClockIcon size={13} /> ~{eta ?? "—"} min · {spec.name}
            </p>
          </div>
          <Button type="submit" size="lg" disabled={pending || !check?.ok} className="min-w-[9rem]">
            {pending ? "Sending…" : "Confirm"}
          </Button>
        </div>
      </StickyBar>
    </form>
  );
}
