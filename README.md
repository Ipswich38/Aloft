# Aloft 🇵🇭🛩️

**Drone delivery for the Philippine islands** — built on DJI FlyCart, gated by CAAP compliance.

> *Aloft* — up in the air. Packages carried over the water and mountains that slow the roads.

Aloft is the **order-to-handoff platform** for a Philippine drone-delivery operation. It does
**not** fly the drone — DJI's **DeliveryHub** cloud does the actual flight. Aloft handles
everything around it: customer booking, merchant dispatch, fleet, CAAP compliance, and the
handoff of cleared flights to DeliveryHub.

Designed around the strongest PH value prop: **island / rural last-mile** — medicine, lab
samples, and critical supplies where roads take hours.

---

## Why it's built this way (research summary)

### The aircraft — DJI FlyCart
| | FlyCart 30 (workhorse) | FlyCart 100 |
|---|---|---|
| Planned payload (dual-batt) | **30 kg** (40 kg single) | **65 kg** (80 kg single) |
| Loaded range | 16 km | 12 km |
| Cruise / wind limit | 20 m/s / 12 m/s | 20 m/s / 12 m/s |
| Weather | IP55 | IP55 |
| Availability / price | global, ~$28–32k | global late-2025, ~$12.4k+ |

`src/lib/flycart.ts` encodes these limits and validates every booking **before** dispatch.

### Flight control = DJI DeliveryHub (not us)
DJI doesn't let third parties fly FlyCart from a custom app. **DeliveryHub** (DJI's cloud, on
AWS, ISO 27001) does planning, dispatch, live monitoring, and post-flight analytics, and
**integrates with external cloud platforms**. Aloft is a **layer above** it, integrated at
exactly two seams:

- **Outbound (dispatch):** a cleared flight is handed off via `flightProvider.dispatch()`.
- **Inbound (status):** DeliveryHub POSTs progress to `POST /api/flights/status`, which
  advances the flight and its orders — closing the loop to `delivered`.

Both go through a vendor-neutral **`FlightProvider`** interface (`src/lib/flight-provider/`),
so DJI is the *only* vendor-specific code and can be swapped without touching the app.
Dispatch is simulated until `DELIVERYHUB_*` env vars are set.

### Compliance — CAAP gates the business
FlyCart (25–95 kg) sits in CAAP's **7–150 kg** class, which requires:
- **Drone registration** with CAAP
- Pilot **Remote Pilot Licence (RPL)** / RPA Controller Certificate
- Company **RPAS Operator Certificate (ROC)**
- **Third-party liability insurance**
- Default ops: **VLOS, ≤120 m AGL, >10 km from airports, not over crowds**
- Real delivery is **BVLOS** → a **Special Flight Permit** per corridor

`src/lib/compliance.ts` encodes this envelope. The operator **cannot dispatch** a flight that
fails the gate (`planAndDispatch` in `src/app/operator/actions.ts`).

### Reference architecture (Zipline / Wing / Meituan)
Three surfaces feeding the drone-control cloud: **customer ordering + tracking**,
**merchant/dispatch**, **operator fleet + UTM/compliance**. Aloft mirrors this with three roles.

---

## Tech stack
- **Next.js 16** (App Router, React 19, Turbopack) + **TypeScript** + **Tailwind v4**
- **Supabase** (Postgres + Auth + RLS) — compliance-first schema
- **PWA** — installable on Android & iOS (manifest + service worker), scales to native wrappers later
- **Vercel** for deploy (matches the VissionLink ecosystem)

## Roles & routes
| Role | Routes | Purpose |
|---|---|---|
| Customer | `/customer`, `/customer/new`, `/customer/track/[id]` | Book deliveries (live payload check), track to landing |
| Merchant | `/merchant`, `/merchant/dispatched` | Accept bookings, prep cargo |
| Operator | `/operator`, `/operator/flights`, `/operator/fleet`, `/operator/compliance`, `/operator/readiness` | Fleet, CAAP gate, dispatch to DeliveryHub, audit log, ROC application checklist |

---

## Run it

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

**Demo mode:** with no Supabase keys, the whole app is explorable on seeded Bohol-island
sample data. Visit `/operator`, `/customer`, `/merchant` directly.

## Go live

1. **Supabase** — create a project, then in `supabase/`:
   - run `schema.sql` (tables, enums, RLS, signup trigger)
   - run `seed.sql` (demo Bohol drop sites / drones / pilots / corridors)
2. Copy `.env.local.example` → `.env.local` and fill:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `DELIVERYHUB_WEBHOOK_URL`, `DELIVERYHUB_API_KEY` (when you have DeliveryHub access)
   - optional `PAYMONGO_SECRET_KEY` for GCash/Maya/card payments
3. `pnpm build && pnpm start`, or deploy with `vercel --prod`.

## Project map
```
src/lib/
  flycart.ts          FlyCart specs + payload validation
  compliance.ts       CAAP envelope + flight gate
  flight-provider/    Vendor-neutral FlightProvider interface
    types.ts          The contract (dispatch + parseStatus + verifyWebhook)
    deliveryhub.ts    DJI DeliveryHub implementation (the only vendor code)
    index.ts          Active provider selection
  pricing.ts          Transparent distance + weight pricing
  data.ts             Supabase-or-demo data accessors
  auth.ts             Session + role guards (+ demo access)
  supabase/           SSR client/server/middleware + admin (service role)
src/app/api/flights/status/route.ts   Inbound provider status webhook
supabase/
  schema.sql          Compliance-first schema + RLS
  seed.sql            Bohol island scenario
```

## The flight loop (closed)
```
operator dispatch ──► flightProvider.dispatch() ──► DeliveryHub flies
       │                                                   │
   flight=dispatched, order=in_flight                      │ progress events
       │                                                   ▼
       └────────────── POST /api/flights/status ◄── DeliveryHub webhook
                       (verify secret → advance flight + orders)
                       completed → order=delivered ✓
```
Configure DeliveryHub to POST status to `/api/flights/status` with header
`x-webhook-secret: $DELIVERYHUB_WEBHOOK_SECRET`. Without a service-role key it runs in
demo mode (acknowledges events without persisting).

## CAAP ROC readiness (`/operator/readiness`)
The **RPAS Operator Certificate** is the real "franchise to operate." The app encodes the
official 21-item ROC application checklist (`src/lib/caap-roc.ts`) and auto-evidences the
items it already holds records for — **insurance, pilot RPLs, aircraft registration** — while
flagging the documents/photos/admin steps you assemble for the (infamous) 3 dark-blue binders.
CPCN (item 17) is auto-marked N/A for medical/cargo last-mile (it's agri-only).

## Roadmap
- ROC readiness: document upload + per-item sign-off persistence, and one-click evidence-pack export
- Live map on the tracking page (status now auto-advances via the webhook)
- PayMongo checkout (downpayment model, matching VissionLink)
- Weather/wind feed wired into the gate (auto-ground above 12 m/s)
- PNG/maskable icon set + native wrappers (Capacitor) for App Store / Play
- Pilot/drone/corridor CRUD in the operator console (currently seed-driven)
