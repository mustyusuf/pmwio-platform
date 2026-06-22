import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { ROLES } from "@/lib/roles";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel, EmptyState, formatDate } from "@/components/dashboard/ui";
import { CreateUserForm } from "@/components/dashboard/CreateUserForm";
import { UsersManagementTable } from "@/components/dashboard/UsersManagementTable";
import { MemberApprovalActions } from "@/components/dashboard/MemberApprovalActions";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/logout");
  if (user.role !== ROLES.ADMIN && user.role !== ROLES.EXECUTIVE) redirect("/dashboard");

  const [users, pending] = await Promise.all([
    prisma.user.findMany({ where: { approved: true }, orderBy: { createdAt: "desc" } }),
    prisma.user.findMany({ where: { approved: false }, orderBy: { createdAt: "desc" } }),
  ]);
  const rows = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    userId: u.userId,
    role: u.role,
    active: u.active,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <>
      <PageHeader
        title="Users"
        count={users.length}
        subtitle="Approve new members, manage accounts and create staff users."
        action={<CreateUserForm />}
      />

      {/* Pending member approvals */}
      <Panel title="Pending member approvals" className="mb-6" action={pending.length > 0 ? <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">{pending.length} waiting</span> : undefined}>
        {pending.length === 0 ? (
          <EmptyState>No members are awaiting approval.</EmptyState>
        ) : (
          <ul className="divide-y divide-brand-100">
            {pending.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium text-brand-900">{p.name}</p>
                  <p className="text-xs text-brand-900/50">{p.email}{p.country ? ` · ${p.country}` : ""} · registered {formatDate(p.createdAt)}</p>
                </div>
                <MemberApprovalActions userId={p.id} name={p.name} />
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <UsersManagementTable rows={rows} selfId={user.id} />
    </>
  );
}
