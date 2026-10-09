"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { ROLES } from "@/lib/roles";
import { broadcastSchema, buildBroadcastMail, deliverBroadcast, sendBroadcastTest, type BroadcastInput } from "@/lib/broadcast";

export type BroadcastPreview = { ok: true; html: string; subject: string } | { ok: false; error: string };
export type BroadcastResult = { ok: true; message: string } | { ok: false; error: string };

async function requireAdmin() {
  const me = await getCurrentUser();
  if (!me || !(me.role === ROLES.ADMIN || me.role === ROLES.EXECUTIVE)) redirect("/dashboard");
  return me;
}

/** Renders the exact email recipients would receive, for the on-page preview. */
export async function previewBroadcast(input: BroadcastInput): Promise<BroadcastPreview> {
  await requireAdmin();
  // The preview only needs the content; recipients aren't validated until sending.
  const parsed = broadcastSchema.safeParse({ ...input, roles: input.roles?.length ? input.roles : ["MEMBER"] });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the message." };
  const mail = buildBroadcastMail(parsed.data);
  return { ok: true, html: mail.html, subject: mail.subject };
}

export async function sendBroadcastTestAction(input: BroadcastInput): Promise<BroadcastResult> {
  const me = await requireAdmin();
  const parsed = broadcastSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the message." };
  const result = await sendBroadcastTest(parsed.data, me.email);
  return result.ok ? { ok: true, message: `A test email was sent to ${me.email}.` } : result;
}

export async function sendBroadcastAction(input: BroadcastInput): Promise<BroadcastResult> {
  const me = await requireAdmin();
  const parsed = broadcastSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the message." };

  const result = await deliverBroadcast(parsed.data, { id: me.id, name: me.name });
  if (!result.ok) return result;

  revalidatePath("/dashboard/broadcast");
  return {
    ok: true,
    message: result.delivered
      ? `Sent to ${result.count} recipient${result.count === 1 ? "" : "s"}.`
      : `The mail server rejected part of this broadcast (${result.count} intended recipients). Check the SMTP settings, then send again if needed.`,
  };
}
