import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "./supabase/server";
import type { AppRole } from "./site-config";

export interface SessionProfile {
  id: string;
  email: string | null;
  fullName: string | null;
  role: AppRole;
  orgName: string | null;
}

/** Returns the signed-in user's profile, or null. Safe before Supabase is configured. */
export async function getSessionProfile(): Promise<SessionProfile | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, org_name")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? null,
    fullName: profile?.full_name ?? null,
    role: (profile?.role as AppRole) ?? "customer",
    orgName: profile?.org_name ?? null,
  };
}

/** Guard a route by role. Redirects to /login or the user's own home if mismatched. */
export async function requireRole(role: AppRole): Promise<SessionProfile> {
  const profile = await getSessionProfile();
  if (!profile) redirect(`/login?next=/${role}`);
  if (profile.role !== role) redirect(`/${profile.role}`);
  return profile;
}

/**
 * Role access for layouts. When Supabase is configured, enforce real auth.
 * When it isn't (local exploration), return a demo profile so the app is browsable.
 */
export async function resolveRoleAccess(
  role: AppRole,
): Promise<{ profile: SessionProfile; demo: boolean }> {
  if (!isSupabaseConfigured()) {
    return {
      demo: true,
      profile: {
        id: `demo-${role}`,
        email: `${role}@demo.hatid.ph`,
        fullName: `Demo ${role[0].toUpperCase()}${role.slice(1)}`,
        role,
        orgName: role === "operator" ? "Aloft Rentals PH" : null,
      },
    };
  }
  return { demo: false, profile: await requireRole(role) };
}
