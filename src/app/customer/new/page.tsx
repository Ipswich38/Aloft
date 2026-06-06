import { getCorridors } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { DemoBanner } from "@/components/status";
import { BookingForm } from "./BookingForm";

export default async function NewDeliveryPage() {
  const corridors = await getCorridors();

  return (
    <>
      <DemoBanner show={!isSupabaseConfigured()} />
      <PageHeader
        title="Send a package"
        subtitle="Tell us what and where — we&apos;ll show the price before you confirm."
      />
      {corridors.length === 0 ? (
        <p className="text-sm text-muted">
          No approved corridors yet. Ask your operator to set up a BVLOS route.
        </p>
      ) : (
        <BookingForm corridors={corridors} />
      )}
    </>
  );
}
