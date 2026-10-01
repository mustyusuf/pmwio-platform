"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { ROLES } from "@/lib/roles";
import { sendMonthlyRecap } from "@/lib/monthly-email";

export type ResendRecapState = { ok?: boolean; error?: string; count?: number; label?: string } | null;

async function requireAdmin() {
  const me = await getCurrentUser();
  if (!me || !(me.role === ROLES.ADMIN || me.role === ROLES.EXECUTIVE)) redirect("/dashboard");
  return me;
}

/**
 * Manually (re)sends the monthly recap + individual congratulations emails
 * for an admin-chosen month. Unlike the automatic nightly check, this is
 * never blocked by Settings.lastLeaderboardEmailMonth — it exists precisely
 * so an admin can retry a month the automatic job silently marked "done"
 * without actually delivering email (e.g. SMTP was briefly misconfigured).
 */
export async function resendMonthlyRecap(_prev: ResendRecapState, formData: FormData): Promise<ResendRecapState> {
  const me = await requireAdmin();
  const monthValue = String(formData.get("month") ?? "");
  const match = /^(\d{4})-(\d{2})$/.exec(monthValue);
  if (!match) return { error: "Pick a month to resend." };

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 1);
  const label = start.toLocaleString("en-GB", { month: "long", year: "numeric" });

  const count = await sendMonthlyRecap(start, end);
  await prisma.activityLog.create({
    data: {
      userId: me.id,
      action: "MONTHLY_RECAP_RESENT",
      detail: count > 0 ? `${label} (${count} member${count === 1 ? "" : "s"})` : `${label} — nothing to send`,
    },
  });

  if (count === 0) return { error: `No recitations found for ${label} — nothing to send.` };
  return { ok: true, count, label };
}
