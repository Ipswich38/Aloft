import { resolveRoleAccess } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

export default async function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await resolveRoleAccess("merchant");
  return (
    <AppShell
      role="merchant"
      userName={profile.fullName}
      nav={[
        { href: "/merchant", label: "Queue", icon: "box" },
        { href: "/merchant/dispatched", label: "Dispatched", icon: "clock" },
      ]}
    >
      {children}
    </AppShell>
  );
}
