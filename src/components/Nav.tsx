"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import {
  HomeIcon,
  SendIcon,
  BoxIcon,
  ListIcon,
  ShieldIcon,
  DroneIcon,
  ClockIcon,
  PinIcon,
} from "./icons";

export type IconKey =
  | "home"
  | "send"
  | "box"
  | "list"
  | "shield"
  | "drone"
  | "clock"
  | "pin";

const ICONS: Record<IconKey, ComponentType<SVGProps<SVGSVGElement> & { size?: number }>> = {
  home: HomeIcon,
  send: SendIcon,
  box: BoxIcon,
  list: ListIcon,
  shield: ShieldIcon,
  drone: DroneIcon,
  clock: ClockIcon,
  pin: PinIcon,
};

export interface NavItem {
  href: string;
  label: string;
  icon: IconKey;
  /** Highlights the primary action (e.g. "Send"). */
  primary?: boolean;
}

function useActive(href: string) {
  const pathname = usePathname();
  const segments = href.split("/").filter(Boolean).length;
  return segments > 1 ? pathname.startsWith(href) : pathname === href;
}

/** Scrollable tab row shown under the top bar on larger screens. */
export function TopTabs({ nav }: { nav: NavItem[] }) {
  return (
    <nav className="mx-auto hidden max-w-6xl gap-1 overflow-x-auto px-4 sm:flex">
      {nav.map((item) => (
        <TopTab key={item.href} item={item} />
      ))}
    </nav>
  );
}

function TopTab({ item }: { item: NavItem }) {
  const active = useActive(item.href);
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition ${
        active
          ? "border-brand text-ink"
          : "border-transparent text-ink-soft hover:text-ink"
      }`}
    >
      {item.label}
    </Link>
  );
}

/** Bottom tab bar — the primary navigation on mobile. */
export function BottomNav({ nav }: { nav: NavItem[] }) {
  return (
    <nav
      aria-label="Primary"
      className="pwa-safe-bottom fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-line bg-surface/95 backdrop-blur sm:hidden"
    >
      {nav.map((item) => (
        <BottomTab key={item.href} item={item} />
      ))}
    </nav>
  );
}

function BottomTab({ item }: { item: NavItem }) {
  const active = useActive(item.href);
  const Icon = ICONS[item.icon];

  if (item.primary) {
    return (
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className="flex flex-1 flex-col items-center justify-center gap-1 py-2"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink text-white shadow-[var(--shadow-pop)]">
          <Icon size={22} />
        </span>
        <span className="text-[11px] font-semibold text-ink">{item.label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition ${
        active ? "text-brand-strong" : "text-muted"
      }`}
    >
      <Icon size={22} />
      <span>{item.label}</span>
    </Link>
  );
}
