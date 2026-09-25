import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowDown, ArrowUp } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { ROLES } from "@/lib/roles";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel } from "@/components/dashboard/ui";
import { PartnerCreateForm, PartnerEditForm } from "@/components/dashboard/PartnerForms";
import { togglePartner, deletePartner, movePartner } from "@/app/actions/partners";

export const metadata: Metadata = { title: "Partners & Supporters" };

function Group({ title, emptyText, items }: { title: string; emptyText: string; items: Awaited<ReturnType<typeof prisma.partner.findMany>> }) {
  return (
    <Panel title={`${title} (${items.length})`}>
      {items.length === 0 ? (
        <p className="text-sm text-brand-900/60">{emptyText}</p>
      ) : (
        <ul className="space-y-4">
          {items.map((p, i) => (
            <li key={p.id} className="rounded-2xl border border-brand-100 p-4">
              <div className="flex flex-wrap items-start gap-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-brand-50">
                  {p.storedName ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/api/partners/${p.id}`} alt={p.name} className="h-full w-full object-contain" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-lg font-bold text-brand-700/60">
                      {p.name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("")}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-brand-950">{p.name}</h3>
                    {!p.active && (
                      <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700">Hidden</span>
                    )}
                  </div>
                  {p.url && <p className="mt-1 truncate text-sm text-brand-700">{p.url}</p>}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <form action={movePartner}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="direction" value="up" />
                    <button disabled={i === 0} aria-label={`Move ${p.name} up`} className="grid h-8 w-8 place-items-center rounded-lg border border-brand-200 text-brand-700 transition hover:bg-brand-50 disabled:opacity-40">
                      <ArrowUp className="h-4 w-4" aria-hidden />
                    </button>
                  </form>
                  <form action={movePartner}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="direction" value="down" />
                    <button disabled={i === items.length - 1} aria-label={`Move ${p.name} down`} className="grid h-8 w-8 place-items-center rounded-lg border border-brand-200 text-brand-700 transition hover:bg-brand-50 disabled:opacity-40">
                      <ArrowDown className="h-4 w-4" aria-hidden />
                    </button>
                  </form>

                  <PartnerEditForm partner={{ id: p.id, name: p.name, url: p.url, kind: p.kind, hasLogo: Boolean(p.storedName) }} />

                  <form action={togglePartner}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="active" value={(!p.active).toString()} />
                    <button className="rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-50">
                      {p.active ? "Hide" : "Show"}
                    </button>
                  </form>

                  <form action={deletePartner}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50">Remove</button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export default async function PartnersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/logout");
  if (user.role !== ROLES.ADMIN && user.role !== ROLES.EXECUTIVE) redirect("/dashboard");

  const all = await prisma.partner.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
  const partners = all.filter((p) => p.kind === "PARTNER");
  const supporters = all.filter((p) => p.kind === "SUPPORTER");

  return (
    <>
      <PageHeader
        title="Partners & Supporters"
        subtitle="These logos appear in the Our Partners and Supported By sections of the public Orphanage page."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Panel title="Add an entry">
          <PartnerCreateForm />
        </Panel>

        <div className="space-y-6">
          <Group title="Our Partners" emptyText="No partners yet. Add the first one and it will show up on the Orphanage page." items={partners} />
          <Group title="Supported By" emptyText="No supporters yet. Add the first one and it will show up on the Orphanage page." items={supporters} />
        </div>
      </div>
    </>
  );
}
