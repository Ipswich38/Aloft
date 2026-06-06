/**
 * In-memory demo data mirroring supabase/seed.sql.
 * Used so the whole app is explorable locally BEFORE a Supabase project is wired up.
 * Island/rural last-mile scenario (Bohol).
 */
import type { Corridor, Drone, DropSite, Order, Pilot } from "./types";
import type { FlightStatus } from "./types";

export const demoDropSites: DropSite[] = [
  { id: "site-1", name: "Tagbilaran Hub", municipality: "Tagbilaran City", province: "Bohol", lat: 9.6496, lng: 123.8556, method: "pad" },
  { id: "site-2", name: "Ubay Rural Health Unit", municipality: "Ubay", province: "Bohol", lat: 10.0556, lng: 124.4731, method: "winch" },
  { id: "site-3", name: "Talibon District Hospital", municipality: "Talibon", province: "Bohol", lat: 10.1496, lng: 124.3219, method: "pad" },
  { id: "site-4", name: "Pres. C.P. Garcia Locker", municipality: "Pitogo", province: "Bohol", lat: 10.0469, lng: 124.5781, method: "locker" },
];

export const demoDrones: Drone[] = [
  { id: "drone-1", model: "FC30", tailNumber: "ALOFT-01", caapRegistration: "RPAS-2026-0451", registrationExpiry: "2027-03-31", status: "active" },
  { id: "drone-2", model: "FC30", tailNumber: "ALOFT-02", caapRegistration: "RPAS-2026-0452", registrationExpiry: "2027-03-31", status: "active" },
  { id: "drone-3", model: "FC100", tailNumber: "ALOFT-03", caapRegistration: null, registrationExpiry: null, status: "maintenance" },
];

export const demoPilots: Pilot[] = [
  { id: "pilot-1", fullName: "Maria Santos", rplNumber: "RPL-PH-018221", rplExpiry: "2027-08-15" },
  { id: "pilot-2", fullName: "Jose Dela Cruz", rplNumber: "RPL-PH-018990", rplExpiry: "2026-11-30" },
];

export const demoCorridors: Corridor[] = [
  { id: "corr-1", name: "Tagbilaran → Ubay", originSiteId: "site-1", destSiteId: "site-2", distanceKm: 14.0, isBvlos: true, specialPermitNumber: "SFP-2026-BHL-002", permitExpiry: "2026-12-31", nearestAirportKm: 22 },
  { id: "corr-2", name: "Tagbilaran → Talibon", originSiteId: "site-1", destSiteId: "site-3", distanceKm: 11.5, isBvlos: true, specialPermitNumber: null, permitExpiry: null, nearestAirportKm: 30 },
];

export const demoOperatorCredentials = [
  { id: "oc-1", kind: "operator_roc" as const, reference: "ROC-2026-ALOFT-PH", validUntil: "2027-01-31" },
  { id: "oc-2", kind: "insurance" as const, reference: "TPL-MAPFRE-99812", validUntil: "2026-12-31" },
];

export const demoOrders: Order[] = [
  { id: "ord-1001", customerId: "demo-customer", merchantId: "demo-merchant", originSiteId: "site-1", destSiteId: "site-2", category: "medicine", cargoDescription: "Vaccines (cold chain) ×2 boxes", weightKg: 4.5, priority: true, status: "in_flight", flightId: "flt-1", priceCentavos: 185000, createdAt: "2026-06-06T01:10:00Z" },
  { id: "ord-1002", customerId: "demo-customer", merchantId: "demo-merchant", originSiteId: "site-1", destSiteId: "site-3", category: "medicine", cargoDescription: "Lab samples — STAT", weightKg: 1.2, priority: true, status: "accepted", flightId: null, priceCentavos: 145000, createdAt: "2026-06-06T02:05:00Z" },
  { id: "ord-1003", customerId: "demo-customer", merchantId: null, originSiteId: "site-1", destSiteId: "site-4", category: "groceries", cargoDescription: "Rice, canned goods, eggs", weightKg: 8.0, priority: false, status: "submitted", flightId: null, priceCentavos: null, createdAt: "2026-06-06T03:20:00Z" },
  { id: "ord-1000", customerId: "demo-customer", merchantId: "demo-merchant", originSiteId: "site-1", destSiteId: "site-2", category: "food", cargoDescription: "Lechon + sides (hot bag)", weightKg: 2.0, priority: true, status: "delivered", flightId: null, priceCentavos: 156000, createdAt: "2026-06-03T22:40:00Z" },
  { id: "ord-0999", customerId: "demo-customer", merchantId: "demo-merchant", originSiteId: "site-1", destSiteId: "site-3", category: "parcel", cargoDescription: "Signed documents (envelope)", weightKg: 0.3, priority: false, status: "delivered", flightId: null, priceCentavos: 124000, createdAt: "2026-06-01T09:15:00Z" },
];

export interface DemoFlight {
  id: string;
  corridorId: string;
  droneId: string;
  pilotId: string;
  status: FlightStatus;
  plannedAltM: number;
  scheduledFor: string | null;
  deliveryhubJobId: string | null;
}

export const demoFlights: DemoFlight[] = [
  { id: "flt-1", corridorId: "corr-1", droneId: "drone-1", pilotId: "pilot-1", status: "airborne", plannedAltM: 100, scheduledFor: "2026-06-06T01:10:00Z", deliveryhubJobId: "DH-77213" },
];

export const isDemoMode = (configured: boolean) => !configured;
