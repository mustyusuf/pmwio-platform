import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { ROLES, parseStates } from "@/lib/roles";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel, EmptyState, formatDate } from "@/components/dashboard/ui";
import { CreateUserForm } from "@/components/dashboard/CreateUserForm";
import { UsersManagementTable } from "@/components/dashboard/UsersManagementTable";
import { MemberApprovalActions } from "@/components/dashboard/MemberApprovalActions";
import { ChangeRoleButton } from "@/components/dashboard/ChangeRoleButton";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/logout");
  if (user.role !== ROLES.ADMIN && user.role !== ROLES.EXECUTIVE) redirect("/dashboard");

  const [users, pending, unverifiedCount] = await Promise.all([
    prisma.user.findMany({ where: { approved: true }, orderBy: { createdAt: "desc" } }),
    // Only members who have confirmed their email are ready for admin approval.
    prisma.user.findMany({ where: { approved: false, emailVerified: true }, orderBy: { createdAt: "desc" } }),
    prisma.user.count({ where: { approved: false, emailVerified: false } }),
  ]);
  const rows = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    userId: u.userId,
    role: u.role,
    active: u.active,
    states: parseStates(u.states),
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <>
      <PageHeader
        title="Users"
        count={users.length}
        subtitle="Validate new members, manage accounts and create staff users."
        action={<CreateUserForm />}
      />

      {/* Members awaiting an administrator's validation. They can already log in. */}
      <Panel title="Members to validate" className="mb-6" action={pending.length > 0 ? <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">{pending.length} waiting</span> : undefined}>
        <p className="mb-3 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-900/70 ring-1 ring-brand-100">
          These members have confirmed their email address and already have access to their dashboard.
          Validating them is a record of your sign-off, not a gate on their account.
          {unverifiedCount > 0 && (
            <>
              {" "}
              {unverifiedCount} other {unverifiedCount === 1 ? "registrant has" : "registrants have"} not confirmed their email yet, so they aren&apos;t shown here.
            </>
          )}
        </p>
        {pending.length === 0 ? (
          <EmptyState>No members are awaiting validation.</EmptyState>
        ) : (
          <ul className="divide-y divide-brand-100">
            {pending.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium text-brand-900">{p.name}</p>
                  <p className="text-xs text-brand-900/50">{p.email}{p.country ? ` · ${p.country}` : ""} · registered {formatDate(p.createdAt)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {/* Staff who self-registered land here as Members — promoting
                      them from this list also validates the account. */}
                  <ChangeRoleButton userId={p.id} name={p.name} currentRole={p.role} currentStates={parseStates(p.states)} />
                  <MemberApprovalActions userId={p.id} name={p.name} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <UsersManagementTable rows={rows} selfId={user.id} />
    </>
  );
}
