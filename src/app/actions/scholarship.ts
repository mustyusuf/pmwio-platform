"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { isStaff, ROLES } from "@/lib/roles";
import { generateReference } from "@/lib/auth";

/** Staff sets/updates a scholarship's award period. */
export async function setScholarshipPeriod(formData: FormData) {
  const me = await getCurrentUser();
  if (!me || !(me.role === ROLES.ADMIN || me.role === ROLES.EXECUTIVE)) redirect("/dashboard");

  const id = String(formData.get("applicationId"));
  const startRaw = String(formData.get("start") ?? "");
  const endRaw = String(formData.get("end") ?? "");
  const app = await prisma.application.findUnique({ where: { id } });
  if (!app || app.category !== "SCHOLARSHIP") redirect("/dashboard");

  await prisma.application.update({
    where: { id },
    data: {
      scholarshipStart: startRaw ? new Date(startRaw) : null,
      scholarshipEnd: endRaw ? new Date(endRaw) : null,
    },
  });
  await prisma.activityLog.create({ data: { userId: me.id, action: "SCHOLARSHIP_PERIOD_SET", detail: `${app.reference}: ${startRaw || "—"} → ${endRaw || "—"}` } });
  revalidatePath(`/dashboard/applications/${id}`);
  revalidatePath("/dashboard/beneficiaries");
}

/** Re-apply / renew a scholarship — clones it into a fresh application for review. */
export async function renewScholarship(formData: FormData) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const id = String(formData.get("applicationId"));
  const app = await prisma.application.findUnique({ where: { id } });
  if (!app || app.category !== "SCHOLARSHIP") redirect("/dashboard");

  // Only the owning beneficiary or staff may renew.
  const allowed = isStaff(me.role) || app.beneficiaryId === me.id;
  if (!allowed) redirect("/dashboard");

  // Avoid duplicate live renewals.
  const existing = await prisma.application.findFirst({
    where: { renewedFromId: id, status: { notIn: ["REJECTED", "REFEREE_REJECTED"] } },
  });
  if (existing) redirect(`/dashboard/applications/${existing.id}`);

  const reference = generateReference();
  const renewal = await prisma.application.create({
    data: {
      reference,
      category: "SCHOLARSHIP",
      status: "PENDING_REFEREE",
      fullName: app.fullName,
      email: app.email,
      phone: app.phone,
      country: app.country,
      details: `Renewal of scholarship ${app.reference}. ${app.details}`,
      formData: app.formData,
      referredByCode: app.referredByCode,
      referredById: app.referredById,
      beneficiaryId: app.beneficiaryId,
      renewedFromId: app.id,
    },
  });

  if (app.referredById) {
    await prisma.notification.create({ data: { userId: app.referredById, title: "Scholarship renewal to confirm", body: `${app.fullName} is renewing scholarship ${app.reference}. Please confirm.` } });
  }
  if (app.beneficiaryId) {
    await prisma.notification.create({ data: { userId: app.beneficiaryId, title: "Renewal submitted", body: `Your scholarship renewal (ref ${reference}) is awaiting referee confirmation.` } });
  }
  await prisma.activityLog.create({ data: { userId: me.id, action: "SCHOLARSHIP_RENEWED", detail: `${app.reference} → ${reference}` } });
  revalidatePath("/dashboard");
  redirect(`/dashboard/applications/${renewal.id}`);
}
