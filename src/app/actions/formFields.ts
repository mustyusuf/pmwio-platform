"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { ROLES } from "@/lib/roles";
import { CUSTOM_FIELD_TYPES } from "@/lib/content";

export type FormFieldState = { ok?: boolean; error?: string; created?: string } | null;

async function requireAdmin() {
  const me = await getCurrentUser();
  if (!me || !(me.role === ROLES.ADMIN || me.role === ROLES.EXECUTIVE)) redirect("/dashboard");
  return me;
}

/** Turns a label into a safe formData key, e.g. "Date of Birth" → "dateOfBirth". */
function toKey(label: string): string {
  const words = label.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "field";
  return words[0] + words.slice(1).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
}

const schema = z.object({
  label: z.string().trim().min(2, "Enter a field label."),
  category: z.enum(["SCHOLARSHIP", "ORPHANAGE", "EMPOWERMENT", "ALL"], { message: "Choose a category." }),
  type: z.enum(CUSTOM_FIELD_TYPES, { message: "Choose a field type." }),
  options: z.string().optional(),
  required: z.string().optional(),
});

export async function createFormField(_prev: FormFieldState, formData: FormData): Promise<FormFieldState> {
  const me = await requireAdmin();
  const parsed = schema.safeParse({
    label: formData.get("label"),
    category: formData.get("category"),
    type: formData.get("type"),
    options: formData.get("options") || undefined,
    required: formData.get("required") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the field." };
  const d = parsed.data;

  let optionsJson: string | null = null;
  if (d.type === "select") {
    const opts = (d.options ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    if (opts.length < 2) return { error: "Select fields need at least two comma-separated options." };
    optionsJson = JSON.stringify(opts);
  }

  // Unique key within the category.
  let base = toKey(d.label);
  let name = base;
  let n = 1;
  while (await prisma.formField.findFirst({ where: { category: d.category, name } })) {
    name = `${base}${n++}`;
  }

  const max = await prisma.formField.aggregate({ where: { category: d.category }, _max: { order: true } });
  const created = await prisma.formField.create({
    data: {
      label: d.label, name, category: d.category, type: d.type,
      options: optionsJson, required: d.required === "on", order: (max._max.order ?? 0) + 1,
    },
  });
  await prisma.activityLog.create({ data: { userId: me.id, action: "FORM_FIELD_ADDED", detail: `${d.category}: ${d.label}` } });
  revalidatePath("/dashboard/form-fields");
  return { ok: true, created: created.label };
}

export async function toggleFormField(formData: FormData) {
  const me = await requireAdmin();
  const id = String(formData.get("id"));
  const active = String(formData.get("active")) === "true";
  await prisma.formField.update({ where: { id }, data: { active } });
  await prisma.activityLog.create({ data: { userId: me.id, action: active ? "FORM_FIELD_ENABLED" : "FORM_FIELD_DISABLED", detail: id } });
  revalidatePath("/dashboard/form-fields");
}

export async function deleteFormField(formData: FormData) {
  const me = await requireAdmin();
  const id = String(formData.get("id"));
  const f = await prisma.formField.findUnique({ where: { id } });
  await prisma.formField.delete({ where: { id } });
  await prisma.activityLog.create({ data: { userId: me.id, action: "FORM_FIELD_DELETED", detail: f?.label ?? id } });
  revalidatePath("/dashboard/form-fields");
}
