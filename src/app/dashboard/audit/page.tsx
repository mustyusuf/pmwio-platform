import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { ROLES, ROLE_LABEL } from "@/lib/roles";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DataTable, type Column, type Filter, type Row } from "@/components/dashboard/DataTable";

export const metadata: Metadata = { title: "Audit Logs" };

const pretty = (a: string) => a.replaceAll("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

export default async function AuditPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/logout");
  if (user.role !== ROLES.EXECUTIVE && user.role !== ROLES.ADMIN) redirect("/dashboard");

  const logs = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    include: { user: { select: { name: true, role: true } } },
  });

  const rows: Row[] = logs.map((l) => ({
    id: l.id,
    action: pretty(l.action),
    rawAction: l.action,
    detail: l.detail ?? "",
    actor: l.user?.name ?? "System",
    role: l.user ? ROLE_LABEL[l.user.role] ?? l.user.role : "—",
    createdAt: l.createdAt.toISOString(),
  }));

  const columns: Column[] = [
    { key: "action", header: "Action" },
    { key: "detail", header: "Detail", type: "muted" },
    { key: "actor", header: "Actor" },
    { key: "role", header: "Role", type: "muted" },
    { key: "createdAt", header: "When", type: "date" },
  ];

  const actions = [...new Set(logs.map((l) => l.action))];
  const filters: Filter[] = [
    { key: "rawAction", label: "Action", options: actions.map((a) => ({ value: a, label: pretty(a) })) },
  ];

  return (
    <>
      <PageHeader title="Audit logs" count={logs.length} subtitle="A trail of every significant action taken on the system." />
      <DataTable columns={columns} rows={rows} searchKeys={["action", "detail", "actor"]} filters={filters} searchPlaceholder="Search audit logs…" />
    </>
  );
}
