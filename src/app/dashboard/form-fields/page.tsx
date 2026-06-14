import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { ROLES } from "@/lib/roles";
import { prisma } from "@/lib/db";
import { PROGRAM_LABEL } from "@/lib/content";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel, EmptyState } from "@/components/dashboard/ui";
import { FormFieldBuilder } from "@/components/dashboard/FormFieldBuilder";
import { toggleFormField, deleteFormField } from "@/app/actions/formFields";

export const metadata: Metadata = { title: "Form Builder" };

const CAT_LABEL: Record<string, string> = { ...PROGRAM_LABEL, ALL: "All programs" };

export default async function FormFieldsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/logout");
  if (user.role !== ROLES.ADMIN && user.role !== ROLES.EXECUTIVE) redirect("/dashboard");

  const fields = await prisma.formField.findMany({ orderBy: [{ category: "asc" }, { order: "asc" }] });
  const byCat = ["SCHOLARSHIP", "ORPHANAGE", "EMPOWERMENT", "ALL"].map((c) => ({ cat: c, items: fields.filter((f) => f.category === c) }));

  return (
    <>
      <PageHeader title="Form builder" count={fields.length} subtitle="Add custom fields to application forms. They appear on the matching program's form and are captured with each application." />
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          {byCat.map(({ cat, items }) => (
            <Panel key={cat} title={CAT_LABEL[cat] ?? cat}>
              {items.length === 0 ? (
                <EmptyState>No custom fields for {CAT_LABEL[cat] ?? cat} yet.</EmptyState>
              ) : (
                <ul className="divide-y divide-brand-100">
                  {items.map((f) => (
                    <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                      <div>
                        <p className="text-sm font-semibold text-brand-900">
                          {f.label}
                          {f.required && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">required</span>}
                          {!f.active && <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">disabled</span>}
                        </p>
                        <p className="text-xs text-brand-900/50">
                          <span className="font-mono">{f.name}</span> · {f.type}
                          {f.options ? ` · ${(JSON.parse(f.options) as string[]).join(", ")}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <form action={toggleFormField}>
                          <input type="hidden" name="id" value={f.id} />
                          <input type="hidden" name="active" value={(!f.active).toString()} />
                          <button className="text-xs font-semibold text-brand-700 hover:text-brand-900">{f.active ? "Disable" : "Enable"}</button>
                        </form>
                        <form action={deleteFormField}>
                          <input type="hidden" name="id" value={f.id} />
                          <button className="text-xs font-semibold text-red-600 hover:text-red-800">Delete</button>
                        </form>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          ))}
        </div>

        <Panel title="Add a field">
          <FormFieldBuilder />
        </Panel>
      </div>
    </>
  );
}
