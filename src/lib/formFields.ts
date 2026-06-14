import { prisma } from "@/lib/db";

export type CustomFieldDTO = {
  id: string;
  label: string;
  name: string;
  type: string;
  options: string[];
  required: boolean;
  category: string;
};

/** Active custom fields for the given program categories (plus "ALL"), ordered. */
export async function getCustomFields(categories: string[]): Promise<CustomFieldDTO[]> {
  const fields = await prisma.formField.findMany({
    where: { active: true, category: { in: [...categories, "ALL"] } },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return fields.map((f) => ({
    id: f.id,
    label: f.label,
    name: f.name,
    type: f.type,
    options: f.options ? safeParse(f.options) : [],
    required: f.required,
    category: f.category,
  }));
}

function safeParse(json: string): string[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}
