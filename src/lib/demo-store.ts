import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { demoFlights, demoOrders, type DemoFlight } from "./demo-data";
import type { FlightStatus, Order, OrderStatus } from "./types";

interface DemoStore {
  orders: Order[];
  flights: DemoFlight[];
}

const STORE_PATH = path.join(process.cwd(), ".aloft-demo-store.json");

async function readStore(): Promise<DemoStore> {
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<DemoStore>;
    return {
      orders: parsed.orders ?? demoOrders,
      flights: parsed.flights ?? demoFlights,
    };
  } catch {
    return {
      orders: demoOrders,
      flights: demoFlights,
    };
  }
}

async function writeStore(store: DemoStore) {
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  await writeFile(STORE_PATH, `${JSON.stringify(store, null, 2)}\n`);
}

export async function getDemoOrders() {
  const store = await readStore();
  return store.orders;
}

export async function getDemoOrder(id: string) {
  const store = await readStore();
  return store.orders.find((o) => o.id === id) ?? null;
}

export async function getDemoFlights() {
  const store = await readStore();
  return store.flights;
}

export async function createDemoOrder(input: {
  originSiteId: string;
  destSiteId: string;
  category: Order["category"];
  cargoDescription: string;
  weightKg: number;
  priority: boolean;
  priceCentavos: number;
}) {
  const store = await readStore();
  const nextId = `ord-demo-${Date.now().toString().slice(-6)}`;
  const order: Order = {
    id: nextId,
    customerId: "demo-customer",
    merchantId: null,
    originSiteId: input.originSiteId,
    destSiteId: input.destSiteId,
    category: input.category,
    cargoDescription: input.cargoDescription,
    weightKg: input.weightKg,
    priority: input.priority,
    status: "submitted",
    flightId: null,
    priceCentavos: input.priceCentavos,
    createdAt: new Date().toISOString(),
  };

  await writeStore({
    ...store,
    orders: [order, ...store.orders],
  });

  return order;
}

export async function setDemoOrderStatus(orderId: string, status: "accepted" | "rejected") {
  const store = await readStore();
  await writeStore({
    ...store,
    orders: store.orders.map((order) =>
      order.id === orderId
        ? {
            ...order,
            merchantId: status === "accepted" ? "demo-merchant" : order.merchantId,
            status,
          }
        : order,
    ),
  });
}

export async function dispatchDemoFlight(input: {
  corridorId: string;
  droneId: string;
  pilotId: string;
  plannedAltM: number;
  deliveryhubJobId: string;
  orderId?: string;
}) {
  const store = await readStore();
  const flight: DemoFlight = {
    id: `flt-demo-${Date.now().toString().slice(-6)}`,
    corridorId: input.corridorId,
    droneId: input.droneId,
    pilotId: input.pilotId,
    status: "dispatched",
    plannedAltM: input.plannedAltM,
    scheduledFor: new Date().toISOString(),
    deliveryhubJobId: input.deliveryhubJobId,
  };

  await writeStore({
    flights: [flight, ...store.flights],
    orders: store.orders.map((order) =>
      order.id === input.orderId
        ? { ...order, status: "in_flight", flightId: flight.id }
        : order,
    ),
  });

  return flight;
}

export async function applyDemoFlightStatus(input: {
  jobId: string;
  flightStatus: FlightStatus;
  orderStatus: OrderStatus | null;
}) {
  const store = await readStore();
  const flight = store.flights.find((f) => f.deliveryhubJobId === input.jobId);
  if (!flight) return null;

  await writeStore({
    flights: store.flights.map((f) =>
      f.id === flight.id ? { ...f, status: input.flightStatus } : f,
    ),
    orders: store.orders.map((order) =>
      order.flightId === flight.id && input.orderStatus
        ? { ...order, status: input.orderStatus }
        : order,
    ),
  });

  return flight.id;
}
