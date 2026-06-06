import { resolveRoleAccess } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await resolveRoleAccess("customer");
  return (
    <AppShell
      role="customer"
      userName={profile.fullName}
      nav={[
        { href: "/customer", label: "Home", icon: "home" },
        { href: "/customer/new", label: "Send", icon: "send", primary: true },
      ]}
    >
      {children}
    </AppShell>
  );
}
