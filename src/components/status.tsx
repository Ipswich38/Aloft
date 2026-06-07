import { Badge } from "./ui";
import {
  ORDER_STATUS_LABELS,
  type DeliveryMode,
  type OrderStatus,
  type FlightStatus,
} from "@/lib/types";
import { DELIVERY_MODE_LABELS } from "@/lib/delivery-modes";

const orderTone: Record<OrderStatus, "slate" | "green" | "amber" | "red" | "sky"> = {
  draft: "slate",
  submitted: "amber",
  accepted: "sky",
  scheduled: "sky",
  in_flight: "sky",
  delivered: "green",
  cancelled: "slate",
  rejected: "red",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={orderTone[status]}>{ORDER_STATUS_LABELS[status]}</Badge>;
}

const flightTone: Record<FlightStatus, "slate" | "green" | "amber" | "red" | "sky"> = {
  planned: "slate",
  compliance_blocked: "red",
  cleared: "amber",
  dispatched: "sky",
  airborne: "sky",
  completed: "green",
  aborted: "red",
};

const flightLabel: Record<FlightStatus, string> = {
  planned: "Planned",
  compliance_blocked: "Compliance blocked",
  cleared: "Cleared",
  dispatched: "Dispatched",
  airborne: "Airborne",
  completed: "Completed",
  aborted: "Aborted",
};

export function FlightStatusBadge({ status }: { status: FlightStatus }) {
  return <Badge tone={flightTone[status]}>{flightLabel[status]}</Badge>;
}

export function DeliveryModeBadge({ mode }: { mode: DeliveryMode }) {
  return <Badge tone={mode === "air" ? "sky" : "green"}>{DELIVERY_MODE_LABELS[mode]}</Badge>;
}

export function DemoBanner({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <strong>Demo mode.</strong> Supabase isn&apos;t configured, so you&apos;re seeing seeded
      sample data (Bohol island scenario). Add your Supabase keys to <code>.env.local</code> to go live.
    </div>
  );
}
