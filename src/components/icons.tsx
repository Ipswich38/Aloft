import type { SVGProps } from "react";

/** Minimal line-icon set (stroke = currentColor). Decorative by default (aria-hidden). */
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 24, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...props,
  };
}

export function HomeIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  );
}

export function SendIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M21 3 11 13" />
      <path d="M21 3 14.5 21l-3.5-8-8-3.5L21 3Z" />
    </svg>
  );
}

export function BoxIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="m3.5 7 8.5 4.5L20.5 7" />
      <path d="M12 11.5V21" />
      <path d="M20.5 7v10L12 21.5 3.5 17V7L12 2.5 20.5 7Z" />
    </svg>
  );
}

export function PinIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function ClockIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function CheckIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="m4 12.5 5 5L20 6.5" />
    </svg>
  );
}

export function ChevronRightIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function PlusIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function ShieldIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function DroneIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="M7.7 7.7 10.5 10.5M16.3 7.7 13.5 10.5M7.7 16.3 10.5 13.5M16.3 16.3 13.5 13.5" />
      <rect x="10" y="10" width="4" height="4" rx="1" />
    </svg>
  );
}

export function TruckIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M3 7h11v10H3z" />
      <path d="M14 11h3.5l3.5 3.5V17h-7" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
      <path d="M5 11h5" />
    </svg>
  );
}

export function BellIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function ListIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M8 6h12M8 12h12M8 18h12" />
      <circle cx="4" cy="6" r="1" />
      <circle cx="4" cy="12" r="1" />
      <circle cx="4" cy="18" r="1" />
    </svg>
  );
}

export function UtensilsIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M5 3v7a2 2 0 0 0 4 0V3M7 10v11" />
      <path d="M17 3c-1.7 0-3 1.8-3 4s1.3 4 3 4v10" />
    </svg>
  );
}

export function BagIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M6 8h12l-1 12H7L6 8Z" />
      <path d="M9 8a3 3 0 0 1 6 0" />
    </svg>
  );
}

export function CrossIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7V3Z" />
    </svg>
  );
}

export function StarIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="m12 3 2.7 5.5 6 .9-4.3 4.2 1 6L12 16.8 6.6 19.6l1-6L3.3 9.4l6-.9L12 3Z" />
    </svg>
  );
}

export function CopyIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h8" />
    </svg>
  );
}

export function SignalIcon(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M5 13a8 8 0 0 1 14 0" />
      <path d="M8.5 14.5a4 4 0 0 1 7 0" />
      <circle cx="12" cy="18" r="1.2" />
    </svg>
  );
}
