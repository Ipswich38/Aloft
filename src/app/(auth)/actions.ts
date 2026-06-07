"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { siteConfig } from "@/lib/site-config";

const credSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

const signupSchema = credSchema.extend({
  fullName: z.string().min(2, "Enter your name."),
  role: z.enum(siteConfig.roles),
  orgName: z.string().optional(),
});
const googleSchema = z.object({
  next: z.string().optional(),
  role: z.enum(siteConfig.roles).optional(),
});

export type AuthState = { error?: string } | undefined;

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured yet. Add env vars to enable sign-in." };
  }
  const parsed = credSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };

  const next = (formData.get("next") as string) || "/";
  redirect(next);
}

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured yet. Add env vars to enable sign-up." };
  }
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        role: parsed.data.role,
        org_name: parsed.data.orgName ?? null,
      },
    },
  });
  if (error) return { error: error.message };

  redirect(`/${parsed.data.role}`);
}

export async function signInWithGoogle(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/login?error=supabase-not-configured");
  }

  const parsed = googleSchema.safeParse({
    next: formData.get("next"),
    role: formData.get("role") || undefined,
  });
  const next = parsed.success ? parsed.data.next || "/" : "/";
  const role = parsed.success ? parsed.data.role : undefined;
  const headerStore = await headers();
  const origin = headerStore.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const callback = new URL("/auth/callback", origin);
  callback.searchParams.set("next", next);
  if (role) callback.searchParams.set("role", role);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callback.toString(),
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error || !data.url) {
    redirect(`/login?error=${encodeURIComponent(error?.message ?? "Google sign-in failed")}`);
  }

  redirect(data.url);
}

export async function logout() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
