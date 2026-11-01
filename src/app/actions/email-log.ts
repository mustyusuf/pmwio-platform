"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { ROLES } from "@/lib/roles";
import { isEmailConfigured } from "@/lib/email";
import { retryFailedDeliveries } from "@/lib/email-tracking";

export type RetryState = { ok?: boolean; error?: string; message?: string } | null;

/** Resends a campaign's email to everyone it failed for. */
export async function retryEmailCampaign(_prev: RetryState, formData: FormData): Promise<RetryState> {
  const me = await getCurrentUser();
  if (!me || !(me.role === ROLES.ADMIN || me.role === ROLES.EXECUTIVE)) redirect("/dashboard");
  if (!isEmailConfigured()) return { error: "Email isn't set up on this server (SMTP settings are missing), so nothing can be sent." };

  const id = String(formData.get("id"));
  const result = await retryFailedDeliveries(id);
  if (!result) return { error: "That email record no longer exists." };
  if (result.retried === 0) return { error: "Nothing to retry — every recipient already received it." };

  const campaign = await prisma.emailCampaign.findUnique({ where: { id }, select: { kind: true, label: true } });
  await prisma.activityLog.create({
    data: { userId: me.id, action: "EMAIL_RETRIED", detail: `${campaign?.label ?? id}: ${result.sent} of ${result.retried} delivered on retry` },
  });
  revalidatePath(`/dashboard/email-log/${id}`);
  revalidatePath("/dashboard/email-log");
  revalidatePath("/dashboard/quran-admin");
  const stillFailing = result.retried - result.sent;
  return {
    ok: true,
    message: stillFailing === 0
      ? `Delivered to all ${result.sent} recipient${result.sent === 1 ? "" : "s"} that failed.`
      : `Delivered ${result.sent} of ${result.retried}; ${stillFailing} still failing.`,
  };
}
