import { resolveRoleAccess } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

export default async function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await resolveRoleAccess("operator");
  return (
    <AppShell
      role="operator"
      userName={profile.fullName}
      nav={[
        { href: "/operator", label: "Overview", icon: "home" },
        { href: "/operator/flights", label: "Flights", icon: "send" },
        { href: "/operator/fleet", label: "Fleet", icon: "drone" },
        { href: "/operator/compliance", label: "Compliance", icon: "shield" },
        { href: "/operator/readiness", label: "Readiness", icon: "list" },
      ]}
    >
      {children}
    </AppShell>
  );
}
