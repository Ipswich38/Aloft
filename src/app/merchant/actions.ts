"use server";

import { revalidatePath } from "next/cache";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { setDemoOrderStatus } from "@/lib/demo-store";

async function setOrderStatus(orderId: string, status: "accepted" | "rejected") {
  if (!isSupabaseConfigured()) {
    await setDemoOrderStatus(orderId, status);
    revalidatePath("/merchant");
    revalidatePath("/customer");
    revalidatePath(`/customer/track/${orderId}`);
    return;
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase
    .from("orders")
    .update({ status, merchant_id: user?.id ?? null })
    .eq("id", orderId);

  await supabase.from("audit_log").insert({
    actor_id: user?.id ?? null,
    entity: "order",
    entity_id: orderId,
    action: "status_change",
    detail: { to: status },
  });

  revalidatePath("/merchant");
}

export async function acceptOrder(orderId: string) {
  await setOrderStatus(orderId, "accepted");
}

export async function rejectOrder(orderId: string) {
  await setOrderStatus(orderId, "rejected");
}
