import Link from "next/link";
import type { ReactNode } from "react";
import Image from "next/image";
import { siteConfig } from "@/lib/site-config";
import { logout } from "@/app/(auth)/actions";
import { BottomNav, TopTabs, type NavItem } from "./Nav";

export type { NavItem };

export function AppShell({
  role,
  nav,
  userName,
  children,
}: {
  role: string;
  nav: NavItem[];
  userName: string | null;
  children: ReactNode;
}) {
  const initial = (userName ?? role).charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar */}
      <header className="pwa-safe-top sticky top-0 z-20 border-b border-line bg-canvas/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href={`/${role}`} className="flex items-center gap-2.5">
            <Image src="/icons/icon.svg" alt="" width={32} height={32} className="rounded-xl" />
            <span className="text-base font-bold tracking-tight text-ink">{siteConfig.name}</span>
            <span className="hidden rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold capitalize text-brand-strong sm:inline">
              {role}
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <form action={logout}>
              <button className="text-sm font-medium text-ink-soft transition hover:text-ink">
                Sign out
              </button>
            </form>
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white"
              title={userName ?? undefined}
              aria-hidden
            >
              {initial}
            </span>
          </div>
        </div>
        <TopTabs nav={nav} />
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-28 sm:pb-10">{children}</main>

      <BottomNav nav={nav} />
    </div>
  );
}
