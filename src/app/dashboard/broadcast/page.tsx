import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { ROLES, ROLE_LABEL } from "@/lib/roles";
import { AUDIENCE_ROLES, audienceCounts } from "@/lib/broadcast";
import { isEmailConfigured } from "@/lib/email";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel, EmptyState } from "@/components/dashboard/ui";
import { BroadcastComposer } from "@/components/dashboard/BroadcastComposer";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Broadcast" };

export default async function BroadcastPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== ROLES.ADMIN && user.role !== ROLES.EXECUTIVE)) redirect("/dashboard");

  const [counts, history] = await Promise.all([
    audienceCounts(),
    prisma.broadcast.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { sentBy: { select: { name: true } } },
    }),
  ]);
  const audiences = AUDIENCE_ROLES.map((role) => ({ role, label: ROLE_LABEL[role] ?? role, count: counts[role] ?? 0 }));

  return (
    <>
      <PageHeader title="Broadcast" subtitle="Email an announcement to any group of users. Write it, choose who gets it, preview, then send." />
      {!isEmailConfigured() && (
        <p className="mb-5 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          Email isn&apos;t set up on this server yet (the SMTP settings are missing), so broadcasts can be previewed but not sent.
        </p>
      )}
      <Panel>
        <BroadcastComposer audiences={audiences} />
      </Panel>

      <Panel title="Recent broadcasts" className="mt-6">
        {history.length === 0 ? (
          <EmptyState>No broadcasts have been sent yet.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-brand-100 text-xs uppercase tracking-wider text-brand-900/50">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Subject</th>
                  <th className="py-2 pr-3">Sent to</th>
                  <th className="py-2 pr-3">Sent by</th>
                  <th className="py-2 text-right">Recipients</th>
                </tr>
              </thead>
              <tbody>
                {history.map((b) => (
                  <tr key={b.id} className="border-b border-brand-50 align-top">
                    <td className="whitespace-nowrap py-3 pr-3">{formatDate(b.createdAt)}</td>
                    <td className="py-3 pr-3 font-medium text-brand-900">
                      {b.subject}
                      {!b.delivered && <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">Partly failed</span>}
                    </td>
                    <td className="py-3 pr-3 text-brand-900/70">{b.audience.split(",").map((r) => ROLE_LABEL[r] ?? r).join(", ")}</td>
                    <td className="py-3 pr-3 text-brand-900/70">{b.sentBy?.name ?? "—"}</td>
                    <td className="py-3 text-right font-semibold tabular-nums">{b.recipientCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
