"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { ROLES } from "@/lib/roles";

export async function addDocument(formData: FormData) {
  const me = await getCurrentUser();
  if (!me || me.role !== ROLES.BENEFICIARY) redirect("/dashboard");

  const applicationId = String(formData.get("applicationId"));
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const reference = String(formData.get("reference") ?? "").trim();
  if (!name) redirect("/dashboard");

  const app = await prisma.application.findUnique({ where: { id: applicationId } });
  if (!app || app.beneficiaryId !== me.id) redirect("/dashboard");

  await prisma.document.create({
    data: { applicationId, name, type: type || null, reference: reference || null },
  });
  await prisma.notification.create({
    data: { userId: me.id, title: "Document added", body: `“${name}” was added to application ${app.reference}.` },
  });
  revalidatePath("/dashboard");
}
