import type { FlyCartModel } from "./flycart";
import type { AppRole } from "./site-config";

export type { AppRole, FlyCartModel };

export type OrderStatus =
  | "draft" // customer is composing
  | "submitted" // sent to merchant
  | "accepted" // merchant accepted, awaiting flight assignment
  | "scheduled" // assigned to a flight
  | "in_flight" // drone airborne
  | "delivered" // dropped at destination
  | "cancelled"
  | "rejected";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  accepted: "Accepted",
  scheduled: "Scheduled",
  in_flight: "In flight",
  delivered: "Delivered",
  cancelled: "Cancelled",
  rejected: "Rejected",
};

export type FlightStatus =
  | "planned"
  | "compliance_blocked" // failed CAAP gate
  | "cleared" // passed gate, ready to hand to DeliveryHub
  | "dispatched" // handed to DeliveryHub
  | "airborne"
  | "completed"
  | "aborted";

export interface DropSite {
  id: string;
  name: string;
  municipality: string;
  province: string;
  lat: number;
  lng: number;
  /** Drop method: locker kiosk, winch-to-ground, or manned pad. */
  method: "locker" | "winch" | "pad";
}

export interface Drone {
  id: string;
  model: FlyCartModel;
  tailNumber: string; // internal call sign
  caapRegistration: string | null;
  registrationExpiry: string | null; // ISO date
  status: "active" | "maintenance" | "grounded";
}

export interface Pilot {
  id: string;
  fullName: string;
  rplNumber: string | null;
  rplExpiry: string | null;
}

/** A pre-approved BVLOS flight corridor with its CAAP permit. */
export interface Corridor {
  id: string;
  name: string;
  originSiteId: string;
  destSiteId: string;
  distanceKm: number;
  isBvlos: boolean;
  specialPermitNumber: string | null;
  permitExpiry: string | null;
  nearestAirportKm: number;
}

export interface Order {
  id: string;
  customerId: string;
  merchantId: string | null;
  originSiteId: string;
  destSiteId: string;
  cargoDescription: string;
  weightKg: number;
  status: OrderStatus;
  flightId: string | null;
  priceCentavos: number | null;
  createdAt: string;
}
