import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { ROLES } from "@/lib/roles";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel, StatusBadge, EmptyState, formatDate, formatMoney } from "@/components/dashboard/ui";
import { EmpowermentForm } from "@/components/dashboard/EmpowermentForm";
import { getCustomFields } from "@/lib/formFields";

export const metadata: Metadata = { title: "Empowerment" };

export default async function EmpowermentPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/logout");
  if (user.role !== ROLES.MEMBER) redirect("/dashboard");

  const settings = await getSettings();
  const customFields = await getCustomFields(["EMPOWERMENT"]);
  const mine = await prisma.application.findMany({
    where: { category: "EMPOWERMENT", beneficiaryId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader
        title="Empowerment application"
        subtitle="Apply for empowerment support as a member."
        action={
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${settings.empowermentOpen ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"}`}>
            {settings.empowermentOpen ? "Window open" : "Window closed"}
          </span>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Panel title="New application">
          {settings.empowermentOpen ? (
            <EmpowermentForm prefill={{ name: user.name, email: user.email, userId: user.userId, phone: user.phone }} customFields={customFields} />
          ) : (
            <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/60 p-8 text-center">
              <p className="text-3xl">🔒</p>
              <h3 className="mt-2 font-bold text-brand-900">The empowerment window is currently closed</h3>
              <p className="mt-1 text-sm text-brand-900/60">Applications are only accepted while the window is open. Please check back later.</p>
            </div>
          )}
        </Panel>

        <Panel title="My empowerment applications">
          {mine.length === 0 ? (
            <EmptyState>You haven&apos;t submitted an empowerment application yet.</EmptyState>
          ) : (
            <ul className="space-y-3">
              {mine.map((a) => (
                <li key={a.id} className="rounded-xl border border-brand-100 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Link href={`/dashboard/applications/${a.id}`} className="font-mono text-xs font-semibold text-brand-700 hover:underline">{a.reference}</Link>
                    <StatusBadge status={a.status} />
                  </div>
                  <p className="mt-1 text-sm text-brand-900/70">{a.amountRequested ? formatMoney(a.amountRequested) : ""} · {formatDate(a.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
