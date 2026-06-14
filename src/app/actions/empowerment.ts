"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { generateReference } from "@/lib/auth";
import { ROLES } from "@/lib/roles";
import { sanitizeRichText, htmlToText } from "@/lib/sanitize";
import { saveUpload } from "@/lib/uploads";

export type EmpowermentState = { ok?: boolean; error?: string; reference?: string } | null;

const schema = z.object({
  purpose: z.string().trim().min(3, "Please enter the purpose of your application."),
  desiredAmount: z.coerce.number().positive("Enter a valid desired amount."),
  coverLetter: z.string().default(""),
  whyNeeded: z.string().default(""),
  sustainabilityPlan: z.string().default(""),
  refereeId: z.string().trim().optional(),
});

export async function submitEmpowerment(_prev: EmpowermentState, formData: FormData): Promise<EmpowermentState> {
  const me = await getCurrentUser();
  if (!me || me.role !== ROLES.MEMBER) return { error: "Only members can apply for empowerment." };

  const settings = await getSettings();
  if (!settings.empowermentOpen) return { error: "The empowerment application window is currently closed." };

  const parsed = schema.safeParse({
    purpose: formData.get("purpose"),
    desiredAmount: formData.get("desiredAmount"),
    coverLetter: formData.get("coverLetter"),
    whyNeeded: formData.get("whyNeeded"),
    sustainabilityPlan: formData.get("sustainabilityPlan"),
    refereeId: formData.get("refereeId") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const d = parsed.data;

  // Sanitize the WYSIWYG fields and validate their real (text) length.
  const coverLetter = sanitizeRichText(d.coverLetter);
  const whyNeeded = sanitizeRichText(d.whyNeeded);
  const sustainabilityPlan = sanitizeRichText(d.sustainabilityPlan);
  if (htmlToText(coverLetter).length < 10) return { error: "Please write a short cover letter." };
  if (htmlToText(whyNeeded).length < 10) return { error: "Please explain why you need the empowerment." };
  if (htmlToText(sustainabilityPlan).length < 10) return { error: "Please describe your sustainability plan." };

  // Optional member referee.
  let referredById: string | undefined;
  let referredByCode = me.userId;
  if (d.refereeId) {
    const ref = await prisma.user.findFirst({ where: { userId: d.refereeId.toUpperCase(), role: ROLES.MEMBER } });
    if (!ref) return { error: "The referee ID you entered is not a valid member." };
    if (ref.id === me.id) return { error: "You can't list yourself as your own referee." };
    referredById = ref.id;
    referredByCode = ref.userId;
  }

  // Optional supporting document — validate before creating anything.
  const file = formData.get("document");
  let saved: { storedName: string; mimeType: string; size: number; originalName: string } | null = null;
  if (file instanceof File && file.size > 0) {
    const res = await saveUpload(file);
    if (!res.ok) return { error: res.error };
    saved = res.file;
  }

  // Admin-defined custom fields (form builder).
  const customFields = await prisma.formField.findMany({
    where: { active: true, category: { in: ["EMPOWERMENT", "ALL"] } },
  });
  const custom: Record<string, string> = {};
  for (const f of customFields) {
    const v = formData.get(f.name);
    if (typeof v === "string" && v.trim()) custom[f.name] = v.trim();
  }

  const reference = generateReference();
  const app = await prisma.application.create({
    data: {
      reference,
      category: "EMPOWERMENT",
      status: "PENDING_BOARD", // members are trusted; empowerment skips the referee gate
      fullName: me.name,
      email: me.email,
      phone: me.phone,
      country: me.country,
      details: d.purpose,
      amountRequested: d.desiredAmount,
      formData: JSON.stringify({
        purpose: d.purpose,
        coverLetter,
        whyNeeded,
        sustainabilityPlan,
        ...custom,
      }),
      referredByCode,
      referredById,
      beneficiaryId: me.id,
    },
  });

  if (saved) {
    await prisma.document.create({
      data: {
        applicationId: app.id,
        name: saved.originalName,
        type: "Supporting document",
        storedName: saved.storedName,
        mimeType: saved.mimeType,
        size: saved.size,
      },
    });
  }

  if (referredById) {
    await prisma.notification.create({ data: { userId: referredById, title: "Named as a referee", body: `${me.name} listed you as a referee on an empowerment application.` } });
  }
  await prisma.notification.create({ data: { userId: me.id, title: "Empowerment application submitted", body: `Your empowerment application (ref ${reference}) is now with the Board for review.` } });
  await prisma.activityLog.create({ data: { userId: me.id, action: "EMPOWERMENT_APPLIED", detail: `ref ${reference} · ₦${d.desiredAmount}` } });

  revalidatePath("/dashboard");
  return { ok: true, reference };
}
