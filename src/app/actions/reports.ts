"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { ROLES } from "@/lib/roles";
import { saveUpload } from "@/lib/uploads";

export type ReportState = { ok?: boolean; error?: string } | null;

const schema = z.object({
  applicationId: z.string().min(1),
  session: z.string().trim().min(2, "Enter the session, e.g. 2025/2026."),
  term: z.string().trim().min(2, "Enter the term."),
  position: z.coerce.number().int().positive().optional(),
  classSize: z.coerce.number().int().positive().optional(),
  performance: z.string().trim().min(10, "Please write a performance report."),
});

export async function submitTermReport(_prev: ReportState, formData: FormData): Promise<ReportState> {
  const me = await getCurrentUser();
  if (!me || me.role !== ROLES.COORDINATOR) redirect("/dashboard");

  const parsed = schema.safeParse({
    applicationId: formData.get("applicationId"),
    session: formData.get("session"),
    term: formData.get("term"),
    position: formData.get("position") || undefined,
    classSize: formData.get("classSize") || undefined,
    performance: formData.get("performance"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const d = parsed.data;

  const app = await prisma.application.findUnique({ where: { id: d.applicationId } });
  if (!app || app.category !== "SCHOLARSHIP") return { error: "This is not a scholarship application." };
  if (app.referredById !== me.id) return { error: "You can only report on beneficiaries you nominated." };

  // Optional uploaded result.
  const file = formData.get("result");
  let saved: { storedName: string; mimeType: string; size: number; originalName: string } | null = null;
  if (file instanceof File && file.size > 0) {
    const res = await saveUpload(file);
    if (!res.ok) return { error: res.error };
    saved = res.file;
  }

  await prisma.termReport.create({
    data: {
      applicationId: d.applicationId,
      coordinatorId: me.id,
      session: d.session,
      term: d.term,
      position: d.position ?? null,
      classSize: d.classSize ?? null,
      performance: d.performance,
      resultStoredName: saved?.storedName ?? null,
      resultMime: saved?.mimeType ?? null,
    },
  });
  if (saved) {
    await prisma.document.create({
      data: { applicationId: d.applicationId, name: `Result — ${d.term} ${d.session}`, type: "Result", storedName: saved.storedName, mimeType: saved.mimeType, size: saved.size },
    });
  }

  // Notify the Board and Executive.
  const recipients = await prisma.user.findMany({ where: { active: true, role: { in: [ROLES.BOARD, ROLES.EXECUTIVE] } }, select: { id: true } });
  if (recipients.length > 0) {
    await prisma.notification.createMany({
      data: recipients.map((r) => ({ userId: r.id, title: "New term report", body: `${me.name} reported on ${app.fullName} (${d.term} ${d.session}).` })),
    });
  }
  await prisma.activityLog.create({ data: { userId: me.id, action: "TERM_REPORT_SUBMITTED", detail: `${app.reference} · ${d.term} ${d.session}` } });

  revalidatePath(`/dashboard/applications/${d.applicationId}`);
  revalidatePath("/dashboard/scholarships");
  return { ok: true };
}
