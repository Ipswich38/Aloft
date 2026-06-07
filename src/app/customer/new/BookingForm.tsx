"use client";

import { useActionState, useMemo, useState } from "react";
import { createOrder, type BookingState } from "../actions";
import { Button, Card, StickyBar, inputClass } from "@/components/ui";
import { ClockIcon, UtensilsIcon, BagIcon, BoxIcon, CrossIcon } from "@/components/icons";
import { checkPayload, estimateFlightMinutes, FLYCART_SPECS } from "@/lib/flycart";
import { quote } from "@/lib/pricing";
import { peso } from "@/lib/format";
import {
  DELIVERY_CATEGORIES,
  WEIGHT_TIERS,
  type DeliveryCategoryId,
} from "@/lib/categories";

export interface BookingRoute {
  id: string;
  fromName: string;
  toName: string;
  distanceKm: number;
}
export interface BookingInitial {
  corridorId?: string;
  category?: DeliveryCategoryId;
  cargo?: string;
  weight?: number;
  priority?: boolean;
}

const CATEGORY_ICON = {
  utensils: UtensilsIcon,
  bag: BagIcon,
  box: BoxIcon,
  cross: CrossIcon,
} as const;

const PLACEHOLDER: Record<DeliveryCategoryId, string> = {
  food: "e.g. 2× chicken meals, 1 drink",
  groceries: "e.g. Rice 5kg, canned goods, eggs",
  parcel: "e.g. Documents, small package",
  medicine: "e.g. Maintenance meds, prescription",
};

export function BookingForm({
  routes,
  initial,
}: {
  routes: BookingRoute[];
  initial?: BookingInitial;
}) {
  const [state, action, pending] = useActionState<BookingState, FormData>(createOrder, undefined);
  const [corridorId, setCorridorId] = useState(initial?.corridorId ?? routes[0]?.id ?? "");
  const [category, setCategory] = useState<DeliveryCategoryId>(initial?.category ?? "food");
  const [weight, setWeight] = useState(initial?.weight ?? 1);
  const [coldChain, setColdChain] = useState(false);
  const [priority, setPriority] = useState(initial?.priority ?? false);

  const route = routes.find((r) => r.id === corridorId);
  const spec = FLYCART_SPECS.FC30;

  const check = useMemo(() => {
    if (!route) return null;
    return checkPayload({ model: "FC30", weightKg: weight, distanceKm: route.distanceKm, roundTrip: false });
  }, [route, weight]);

  const price = route
    ? quote({ distanceKm: route.distanceKm, weightKg: weight, mode: "air", coldChain, priority })
    : null;
  const eta = route ? estimateFlightMinutes("FC30", route.distanceKm) : null;
  const weightPct = Math.min(100, Math.round((weight / spec.plannedPayloadKg) * 100));

  return (
    <form action={action}>
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="deliveryMode" value="air" />

      <div className="space-y-4">
        {/* Category */}
        <div className="grid grid-cols-4 gap-2">
          {DELIVERY_CATEGORIES.map((c) => {
            const Icon = CATEGORY_ICON[c.icon];
            const selected = category === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                aria-pressed={selected}
                className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 transition ${
                  selected
                    ? "border-brand bg-brand-soft text-brand-strong"
                    : "border-line bg-surface text-ink-soft hover:border-brand/40"
                }`}
              >
                <Icon size={22} />
                <span className="text-xs font-semibold">{c.label}</span>
              </button>
            );
          })}
        </div>

        {/* From / To */}
        <Card className="p-0">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand ring-4 ring-brand-soft" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">From</p>
              <p className="truncate text-sm font-semibold text-ink">{route?.fromName ?? "—"}</p>
            </div>
          </div>
          <div className="mx-4 border-t border-dashed border-line" />
          <div className="flex items-center gap-3 px-4 py-3.5">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent ring-4 ring-amber-100" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">To</p>
              <select
                name="corridorId"
                value={corridorId}
                onChange={(e) => setCorridorId(e.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-ink outline-none"
              >
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.toName} · {r.distanceKm} km
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Weight */}
        <Card>
          <p className="mb-2 text-sm font-semibold text-ink">Weight</p>
          <div className="grid grid-cols-3 gap-2">
            {WEIGHT_TIERS.map((t) => {
              const selected = weight === t.kg;
              return (
                <button
                  key={t.kg}
                  type="button"
                  onClick={() => setWeight(t.kg)}
                  aria-pressed={selected}
                  className={`rounded-xl border px-2 py-3 text-center transition ${
                    selected ? "border-brand bg-brand-soft" : "border-line bg-surface hover:border-brand/40"
                  }`}
                >
                  <span className="block text-[11px] text-muted">Up to</span>
                  <span className="block text-lg font-bold text-ink">{t.kg} kg</span>
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-2">
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
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-black/[0.06]">
            <div
              className={`h-full rounded-full transition-all ${check?.ok ? "bg-brand" : "bg-red-500"}`}
              style={{ width: `${weightPct}%` }}
            />
          </div>
        </Card>

        {/* Details + add-ons */}
        <Card>
          <p className="mb-2 text-sm font-semibold text-ink">What&apos;s inside? <span className="font-normal text-muted">(optional)</span></p>
          <input
            name="cargoDescription"
            placeholder={PLACEHOLDER[category]}
            defaultValue={initial?.cargo}
            className={inputClass}
          />

          <Toggle
            name="priority"
            checked={priority}
            onChange={setPriority}
            title="Priority delivery"
            subtitle={`Front of the queue · +${peso(15000)}`}
          />
          <Toggle
            name="coldChain"
            checked={coldChain}
            onChange={setColdChain}
            title="Keep it cold"
            subtitle={`Temperature-controlled · +${peso(30000)}`}
          />
        </Card>

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

      <StickyBar>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-2xl font-bold tracking-tight text-ink">{peso(price)}</p>
            <p className="flex items-center gap-1 text-xs text-muted">
              <ClockIcon size={13} /> ~{eta ?? "—"} min · {spec.name}
              {priority && <span className="ml-1 font-semibold text-brand-strong">· Priority</span>}
            </p>
          </div>
          <Button type="submit" variant="brand" size="lg" disabled={pending || !check?.ok} className="min-w-[9.5rem]">
            {pending ? "Booking…" : "Continue →"}
          </Button>
        </div>
      </StickyBar>
    </form>
  );
}

function Toggle({
  name,
  checked,
  onChange,
  title,
  subtitle,
}: {
  name: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  subtitle: string;
}) {
  return (
    <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-canvas px-4 py-3">
      <span>
        <span className="block text-sm font-semibold text-ink">{title}</span>
        <span className="block text-xs text-muted">{subtitle}</span>
      </span>
      <span className="relative inline-flex">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span className="h-7 w-12 rounded-full bg-black/15 transition peer-checked:bg-brand" />
        <span className="absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
