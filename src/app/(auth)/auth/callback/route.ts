import { NextResponse, type NextRequest } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { siteConfig, type AppRole } from "@/lib/site-config";

const validRoles = new Set<string>(siteConfig.roles);

function safeNext(value: string | null, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const roleParam = requestUrl.searchParams.get("role");
  const role = roleParam && validRoles.has(roleParam) ? (roleParam as AppRole) : null;
  const next = safeNext(requestUrl.searchParams.get("next"), role ? `/${role}` : "/customer");

  if (!isSupabaseConfigured() || !code) {
    return NextResponse.redirect(new URL("/login", requestUrl.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const url = new URL("/login", requestUrl.origin);
    url.searchParams.set("error", error.message);
    return NextResponse.redirect(url);
  }

  if (role) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.from("profiles").upsert({
        id: user.id,
        full_name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Aloft user",
        role,
      });
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
