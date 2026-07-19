import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowDown, ArrowUp } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { ROLES } from "@/lib/roles";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel } from "@/components/dashboard/ui";
import { TeamMemberCreateForm, TeamMemberEditForm } from "@/components/dashboard/TeamMemberForms";
import { toggleTeamMember, deleteTeamMember, moveTeamMember } from "@/app/actions/team";

export const metadata: Metadata = { title: "Management Team" };

export default async function TeamPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/logout");
  if (user.role !== ROLES.ADMIN && user.role !== ROLES.EXECUTIVE) redirect("/dashboard");

  const members = await prisma.teamMember.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] });

  return (
    <>
      <PageHeader
        title="Management team"
        subtitle="These cards appear in the management section of the public About page."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Panel title="Add a team member">
          <TeamMemberCreateForm />
        </Panel>

        <Panel title={`Team members (${members.length})`}>
          {members.length === 0 ? (
            <p className="text-sm text-brand-900/60">
              No team members yet. Add the first one and it will show up on the About page.
            </p>
          ) : (
            <ul className="space-y-4">
              {members.map((m, i) => (
                <li key={m.id} className="rounded-2xl border border-brand-100 p-4">
                  <div className="flex flex-wrap items-start gap-4">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-brand-100">
                      {m.storedName ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`/api/team/${m.id}`} alt={m.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-lg font-bold text-brand-700/60">
                          {m.name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("")}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-brand-950">{m.name}</h3>
                        {!m.active && (
                          <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700">
                            Hidden
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-brand-700">{m.role}</p>
                      {m.bio && <p className="mt-1.5 text-sm text-brand-900/65">{m.bio}</p>}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Reorder — the public page renders members in this order. */}
                      <form action={moveTeamMember}>
                        <input type="hidden" name="id" value={m.id} />
                        <input type="hidden" name="direction" value="up" />
                        <button
                          disabled={i === 0}
                          aria-label={`Move ${m.name} up`}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-brand-200 text-brand-700 transition hover:bg-brand-50 disabled:opacity-40"
                        >
                          <ArrowUp className="h-4 w-4" aria-hidden />
                        </button>
                      </form>
                      <form action={moveTeamMember}>
                        <input type="hidden" name="id" value={m.id} />
                        <input type="hidden" name="direction" value="down" />
                        <button
                          disabled={i === members.length - 1}
                          aria-label={`Move ${m.name} down`}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-brand-200 text-brand-700 transition hover:bg-brand-50 disabled:opacity-40"
                        >
                          <ArrowDown className="h-4 w-4" aria-hidden />
                        </button>
                      </form>

                      <TeamMemberEditForm
                        member={{ id: m.id, name: m.name, role: m.role, bio: m.bio, hasImage: Boolean(m.storedName) }}
                      />

                      <form action={toggleTeamMember}>
                        <input type="hidden" name="id" value={m.id} />
                        <input type="hidden" name="active" value={(!m.active).toString()} />
                        <button className="rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-50">
                          {m.active ? "Hide" : "Show"}
                        </button>
                      </form>

                      <form action={deleteTeamMember}>
                        <input type="hidden" name="id" value={m.id} />
                        <button className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50">
                          Remove
                        </button>
                      </form>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
