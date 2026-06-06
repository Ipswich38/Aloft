import { createClient, isSupabaseConfigured } from "./supabase/server";
import {
  demoCorridors,
  demoDrones,
  demoDropSites,
  demoFlights,
  demoOperatorCredentials,
  demoOrders,
  demoPilots,
} from "./demo-data";
import type { Corridor, Drone, DropSite, Order, Pilot } from "./types";

/**
 * Data accessors. Each returns live Supabase rows when configured,
 * otherwise the demo dataset so the UI is fully explorable offline.
 */

export async function getDropSites(): Promise<DropSite[]> {
  if (!isSupabaseConfigured()) return demoDropSites;
  const supabase = await createClient();
  const { data } = await supabase.from("drop_sites").select("*").order("name");
  return (data ?? []).map(mapDropSite);
}

export async function getDrones(): Promise<Drone[]> {
  if (!isSupabaseConfigured()) return demoDrones;
  const supabase = await createClient();
  const { data } = await supabase.from("drones").select("*").order("tail_number");
  return (data ?? []).map(mapDrone);
}

export async function getPilots(): Promise<Pilot[]> {
  if (!isSupabaseConfigured()) return demoPilots;
  const supabase = await createClient();
  const { data } = await supabase.from("pilots").select("*").order("full_name");
  return (data ?? []).map(mapPilot);
}

export async function getCorridors(): Promise<Corridor[]> {
  if (!isSupabaseConfigured()) return demoCorridors;
  const supabase = await createClient();
  const { data } = await supabase.from("corridors").select("*").order("name");
  return (data ?? []).map(mapCorridor);
}

export async function getOrders(): Promise<Order[]> {
  if (!isSupabaseConfigured()) return demoOrders;
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []).map(mapOrder);
}

export async function getOrder(id: string): Promise<Order | null> {
  if (!isSupabaseConfigured()) return demoOrders.find((o) => o.id === id) ?? null;
  const supabase = await createClient();
  const { data } = await supabase.from("orders").select("*").eq("id", id).single();
  return data ? mapOrder(data) : null;
}

export async function getOperatorCredentials() {
  if (!isSupabaseConfigured()) return demoOperatorCredentials;
  const supabase = await createClient();
  const { data } = await supabase.from("operator_credentials").select("*");
  return (data ?? []).map((r) => ({
    id: r.id,
    kind: r.kind as "operator_roc" | "insurance",
    reference: r.reference,
    validUntil: r.valid_until,
  }));
}

export async function getFlights() {
  if (!isSupabaseConfigured()) return demoFlights;
  const supabase = await createClient();
  const { data } = await supabase
    .from("flights")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []).map((r) => ({
    id: r.id,
    corridorId: r.corridor_id,
    droneId: r.drone_id,
    pilotId: r.pilot_id,
    status: r.status,
    plannedAltM: r.planned_alt_m,
    scheduledFor: r.scheduled_for,
    deliveryhubJobId: r.deliveryhub_job_id,
  }));
}

// --- row mappers (snake_case → camelCase) ---------------------------------
/* eslint-disable @typescript-eslint/no-explicit-any */
const mapDropSite = (r: any): DropSite => ({
  id: r.id, name: r.name, municipality: r.municipality, province: r.province,
  lat: r.lat, lng: r.lng, method: r.method,
});
const mapDrone = (r: any): Drone => ({
  id: r.id, model: r.model, tailNumber: r.tail_number,
  caapRegistration: r.caap_registration, registrationExpiry: r.registration_expiry,
  status: r.status,
});
const mapPilot = (r: any): Pilot => ({
  id: r.id, fullName: r.full_name, rplNumber: r.rpl_number, rplExpiry: r.rpl_expiry,
});
const mapCorridor = (r: any): Corridor => ({
  id: r.id, name: r.name, originSiteId: r.origin_site_id, destSiteId: r.dest_site_id,
  distanceKm: r.distance_km, isBvlos: r.is_bvlos, specialPermitNumber: r.special_permit_number,
  permitExpiry: r.permit_expiry, nearestAirportKm: r.nearest_airport_km,
});
const mapOrder = (r: any): Order => ({
  id: r.id, customerId: r.customer_id, merchantId: r.merchant_id,
  originSiteId: r.origin_site_id, destSiteId: r.dest_site_id,
  cargoDescription: r.cargo_description, weightKg: Number(r.weight_kg),
  status: r.status, flightId: r.flight_id, priceCentavos: r.price_centavos,
  createdAt: r.created_at,
});
