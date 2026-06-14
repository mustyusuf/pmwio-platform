import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/ui";
import { markNotificationsRead } from "@/app/actions/workflow";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/logout");

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <>
      <PageHeader
        title="Notifications"
        count={notifications.length}
        subtitle={unread > 0 ? `${unread} unread` : "You're all caught up."}
        action={
          unread > 0 ? (
            <form action={markNotificationsRead}>
              <button className="rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50">Mark all read</button>
            </form>
          ) : undefined
        }
      />
      {notifications.length === 0 ? (
        <EmptyState>No notifications yet.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {notifications.map((n) => (
            <li key={n.id} className={`rounded-2xl border p-4 ${n.read ? "border-brand-100 bg-white" : "border-brand-200 bg-brand-50"}`}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-brand-900">{n.title}</p>
                {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-600" />}
              </div>
              {n.body && <p className="mt-1 text-sm text-brand-900/65">{n.body}</p>}
              <p className="mt-1.5 text-[11px] text-brand-900/40">{formatDate(n.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
