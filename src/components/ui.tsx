import Link from "next/link";
import type { ReactNode } from "react";

/** Shared UI kit — premium, approachable, mobile-first, accessible. */

export function Card({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
}) {
  return (
    <Tag
      className={`rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-card)] ${className}`}
    >
      {children}
    </Tag>
  );
}

export function Badge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "slate" | "green" | "amber" | "red" | "sky";
}) {
  const tones: Record<string, string> = {
    slate: "bg-black/[0.06] text-ink-soft",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    sky: "bg-brand-soft text-brand-strong",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

type Variant = "primary" | "brand" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const sizes: Record<Size, string> = {
  sm: "h-10 px-3.5 text-sm",
  md: "h-12 px-5 text-sm",
  lg: "h-14 px-6 text-base",
};

const variants: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-ink/90",
  brand: "bg-brand-strong text-white hover:bg-brand",
  secondary: "bg-surface text-ink border border-line hover:bg-canvas",
  ghost: "text-ink-soft hover:bg-black/5",
};

const buttonClasses = (variant: Variant = "primary", size: Size = "md") =>
  `inline-flex select-none items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ${sizes[size]} ${variants[variant]}`;

export function Button({
  children,
  variant = "primary",
  size = "md",
  type = "button",
  className = "",
  disabled,
}: {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button type={type} disabled={disabled} className={`${buttonClasses(variant, size)} ${className}`}>
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
  size = "md",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
}) {
  return (
    <Link href={href} className={`${buttonClasses(variant, size)} ${className}`}>
      {children}
    </Link>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full h-12 rounded-xl border border-line bg-surface px-4 text-base text-ink placeholder:text-muted outline-none transition focus:border-brand focus:ring-4 focus:ring-brand-soft";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** Sticky bottom action bar for mobile (e.g. the booking quote + confirm). */
export function StickyBar({ children }: { children: ReactNode }) {
  return (
    <div className="pwa-safe-bottom sticky bottom-0 z-20 -mx-4 mt-6 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:rounded-2xl sm:border sm:shadow-[var(--shadow-pop)]">
      {children}
    </div>
  );
}
