"use client";

import { useActionState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { login, type AuthState } from "../actions";
import { Button, Field, inputClass } from "@/components/ui";
import { siteConfig } from "@/lib/site-config";

function LoginForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(login, undefined);
  const next = useSearchParams().get("next") ?? "/";

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field label="Email">
        <input name="email" type="email" autoComplete="email" required className={inputClass} />
      </Field>
      <Field label="Password">
        <input name="password" type="password" autoComplete="current-password" required className={inputClass} />
      </Field>
      {state?.error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-5">
      <div className="w-full max-w-sm animate-rise">
        <Link href="/" className="mb-8 flex flex-col items-center gap-3 text-center">
          <Image src="/icons/icon.svg" alt="" width={52} height={52} className="rounded-2xl shadow-[var(--shadow-card)]" />
          <span className="text-xl font-bold tracking-tight text-ink">{siteConfig.name}</span>
        </Link>
        <div className="rounded-3xl border border-line bg-surface p-6 shadow-[var(--shadow-card)]">
          <h1 className="text-xl font-bold tracking-tight text-ink">Welcome back</h1>
          <p className="mb-5 mt-1 text-sm text-ink-soft">Sign in to send or manage deliveries.</p>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
        <p className="mt-5 text-center text-sm text-ink-soft">
          New here?{" "}
          <Link href="/signup" className="font-semibold text-brand-strong">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
