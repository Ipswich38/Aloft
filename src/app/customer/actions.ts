"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getCorridors } from "@/lib/data";
import { checkPayload } from "@/lib/flycart";
import { quote } from "@/lib/pricing";

const schema = z.object({
  corridorId: z.string().min(1, "Choose a route."),
  cargoDescription: z.string().min(3, "Describe the cargo."),
  weightKg: z.coerce.number().positive("Weight must be greater than 0."),
  coldChain: z.union([z.literal("on"), z.null()]).optional(),
});

export type BookingState = { error?: string } | undefined;

export async function createOrder(
  _prev: BookingState,
  formData: FormData,
): Promise<BookingState> {
  const parsed = schema.safeParse({
    corridorId: formData.get("corridorId"),
    cargoDescription: formData.get("cargoDescription"),
    weightKg: formData.get("weightKg"),
    coldChain: formData.get("coldChain"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const corridors = await getCorridors();
  const corridor = corridors.find((c) => c.id === parsed.data.corridorId);
  if (!corridor) return { error: "Selected route not found." };

  // Validate against the FlyCart 30 envelope before accepting the booking.
  const check = checkPayload({
    model: "FC30",
    weightKg: parsed.data.weightKg,
    distanceKm: corridor.distanceKm,
    roundTrip: true,
  });
  if (!check.ok) return { error: check.reasons.join(" ") };

  const priceCentavos = quote({
    distanceKm: corridor.distanceKm,
    weightKg: parsed.data.weightKg,
    coldChain: parsed.data.coldChain === "on",
  });

  if (!isSupabaseConfigured()) {
    // Demo mode: nothing to persist; bounce back to the list.
    redirect("/customer?booked=demo");
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
    cargo_description: parsed.data.cargoDescription,
    weight_kg: parsed.data.weightKg,
    status: "submitted",
    price_centavos: priceCentavos,
  });
  if (error) return { error: error.message };

  redirect("/customer?booked=1");
}
