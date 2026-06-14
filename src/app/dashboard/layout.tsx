import { redirect } from "next/navigation";
import { getSession, getCurrentUser } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { navForRole } from "@/lib/nav";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await getCurrentUser();
  if (!user) redirect("/logout");

  const settings = await getSettings();

  return (
    <DashboardChrome
      name={user.name}
      code={user.userId}
      role={user.role}
      navItems={navForRole(user.role, { empowermentOpen: settings.empowermentOpen })}
    >
      {children}
    </DashboardChrome>
  );
}
