"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getCorridors } from "@/lib/data";
import { createDemoOrder } from "@/lib/demo-store";
import { checkPayload } from "@/lib/flycart";
import { quote } from "@/lib/pricing";
import { CATEGORY_LABELS } from "@/lib/categories";
import { LAND_MAX_WEIGHT_KG } from "@/lib/delivery-modes";

const schema = z.object({
  corridorId: z.string().min(1, "Choose a route."),
  deliveryMode: z.enum(["air", "land"]).default("air"),
  category: z.enum(["food", "groceries", "parcel", "medicine"]),
  cargoDescription: z.string().optional(),
  weightKg: z.coerce.number().positive("Weight must be greater than 0."),
  coldChain: z.union([z.literal("on"), z.null()]).optional(),
  priority: z.union([z.literal("on"), z.null()]).optional(),
});

export type BookingState = { error?: string } | undefined;

export async function createOrder(
  _prev: BookingState,
  formData: FormData,
): Promise<BookingState> {
  const parsed = schema.safeParse({
    corridorId: formData.get("corridorId"),
    deliveryMode: formData.get("deliveryMode"),
    category: formData.get("category"),
    cargoDescription: formData.get("cargoDescription"),
    weightKg: formData.get("weightKg"),
    coldChain: formData.get("coldChain"),
    priority: formData.get("priority"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const corridors = await getCorridors();
  const corridor = corridors.find((c) => c.id === parsed.data.corridorId);
  if (!corridor) return { error: "Selected route not found." };

  // Validate against the FlyCart 30 envelope before accepting the booking.
  if (parsed.data.deliveryMode === "air") {
    const check = checkPayload({
      model: "FC30",
      weightKg: parsed.data.weightKg,
      distanceKm: corridor.distanceKm,
      roundTrip: false,
    });
    if (!check.ok) return { error: check.reasons.join(" ") };
  } else if (parsed.data.weightKg > LAND_MAX_WEIGHT_KG) {
    return { error: `Land courier limit is ${LAND_MAX_WEIGHT_KG} kg for this route.` };
  }

  const isPriority = parsed.data.priority === "on";
  const priceCentavos = quote({
    distanceKm: corridor.distanceKm,
    weightKg: parsed.data.weightKg,
    mode: parsed.data.deliveryMode,
    coldChain: parsed.data.coldChain === "on",
    priority: isPriority,
  });
  const cargo =
    parsed.data.cargoDescription?.trim() || CATEGORY_LABELS[parsed.data.category];

  if (!isSupabaseConfigured()) {
    const order = await createDemoOrder({
      originSiteId: corridor.originSiteId,
      destSiteId: corridor.destSiteId,
      category: parsed.data.category,
      cargoDescription: cargo,
      weightKg: parsed.data.weightKg,
      priority: isPriority,
      deliveryMode: parsed.data.deliveryMode,
      priceCentavos,
    });
    redirect(`/customer/track/${order.id}?booked=demo`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/customer/new");

  const { error } = await supabase.from("orders").insert({
    customer_id: user.id,
    origin_site_id: corridor.originSiteId,
    dest_site_id: corridor.destSiteId,
    category: parsed.data.category,
    cargo_description: cargo,
    weight_kg: parsed.data.weightKg,
    priority: isPriority,
    delivery_mode: parsed.data.deliveryMode,
    status: "submitted",
    price_centavos: priceCentavos,
  });
  if (error) return { error: error.message };

  redirect("/customer?booked=1");
}
