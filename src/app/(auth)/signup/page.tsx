"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { signup, type AuthState } from "../actions";
import { Button, Field, inputClass } from "@/components/ui";
import { siteConfig } from "@/lib/site-config";
import { SendIcon, BoxIcon, ShieldIcon, CheckIcon } from "@/components/icons";

const ROLE_COPY: Record<
  string,
  { label: string; hint: string; icon: React.ReactNode }
> = {
  customer: { label: "Send packages", hint: "Clinic, business, or individual", icon: <SendIcon size={20} /> },
  merchant: { label: "Run a hub", hint: "Accept orders and load cargo", icon: <BoxIcon size={20} /> },
  operator: { label: "Operate the fleet", hint: "Drones, compliance & dispatch", icon: <ShieldIcon size={20} /> },
};

export default function SignupPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(signup, undefined);
  const [role, setRole] = useState<string>("customer");

  return (
    <main className="flex flex-1 items-center justify-center p-5">
      <div className="w-full max-w-md animate-rise">
        <Link href="/" className="mb-8 flex flex-col items-center gap-3 text-center">
          <Image src="/icons/icon.svg" alt="" width={52} height={52} className="rounded-2xl shadow-[var(--shadow-card)]" />
          <span className="text-xl font-bold tracking-tight text-ink">{siteConfig.name}</span>
        </Link>

        <div className="rounded-3xl border border-line bg-surface p-6 shadow-[var(--shadow-card)]">
          <h1 className="text-xl font-bold tracking-tight text-ink">Create your account</h1>
          <p className="mb-5 mt-1 text-sm text-ink-soft">How will you use Aloft?</p>

          <form action={action} className="space-y-4">
            <div className="grid gap-2.5">
              {siteConfig.roles.map((r) => {
                const selected = role === r;
                return (
                  <label
                    key={r}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3.5 transition ${
                      selected ? "border-ink bg-canvas" : "border-line hover:border-ink/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r}
                      checked={selected}
                      onChange={() => setRole(r)}
                      className="sr-only"
                    />
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        selected ? "bg-ink text-white" : "bg-brand-soft text-brand-strong"
                      }`}
                    >
                      {ROLE_COPY[r].icon}
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-semibold text-ink">{ROLE_COPY[r].label}</span>
                      <span className="block text-xs text-muted">{ROLE_COPY[r].hint}</span>
                    </span>
                    {selected && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink text-white">
                        <CheckIcon size={13} />
                      </span>
                    )}
                  </label>
                );
              })}
            </div>

            <Field label="Full name">
              <input name="fullName" required className={inputClass} />
            </Field>
            {role !== "customer" && (
              <Field label="Organization name">
                <input name="orgName" className={inputClass} />
              </Field>
            )}
            <Field label="Email">
              <input name="email" type="email" autoComplete="email" required className={inputClass} />
            </Field>
            <Field label="Password" hint="At least 6 characters.">
              <input name="password" type="password" autoComplete="new-password" required className={inputClass} />
            </Field>

            {state?.error && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {state.error}
              </div>
            )}
            <Button type="submit" size="lg" disabled={pending} className="w-full">
              {pending ? "Creating account…" : "Create account"}
            </Button>
          </form>
        </div>
        <p className="mt-5 text-center text-sm text-ink-soft">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand-strong">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
