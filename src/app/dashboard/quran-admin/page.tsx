import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { ROLES } from "@/lib/roles";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel, formatDate } from "@/components/dashboard/ui";
import { VerseCreateForm } from "@/components/dashboard/VerseForm";
import { togglePublishVerse, deleteVerse } from "@/app/actions/quran";

export const metadata: Metadata = { title: "Weekly Verse" };

export default async function QuranAdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/logout");
  if (user.role !== ROLES.ADMIN && user.role !== ROLES.EXECUTIVE) redirect("/dashboard");

  const verses = await prisma.verse.findMany({
    orderBy: { weekOf: "desc" },
    include: { _count: { select: { recitations: true } } },
  });

  return (
    <>
      <PageHeader
        title="Weekly Verse"
        subtitle="Publish the verse members recite each week — audio, transliteration and translation."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Panel title="Add a verse">
          <VerseCreateForm />
        </Panel>

        <Panel title={`Verses (${verses.length})`}>
          {verses.length === 0 ? (
            <p className="text-sm text-brand-900/60">No verses yet. Add the first one to open the challenge.</p>
          ) : (
            <ul className="space-y-4">
              {verses.map((v) => (
                <li key={v.id} className="rounded-2xl border border-brand-100 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-brand-950">{v.reference}</h3>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            v.publishedAt ? "bg-emerald-100 text-emerald-800" : "bg-brand-100 text-brand-700"
                          }`}
                        >
                          {v.publishedAt ? "Published" : "Draft"}
                        </span>
                      </div>
                      <p className="text-xs text-brand-900/50">
                        Week of {formatDate(v.weekOf)} · {v._count.recitations} recitation{v._count.recitations === 1 ? "" : "s"}
                      </p>
                      <p dir="rtl" lang="ar" className="mt-2 text-right text-lg leading-relaxed text-brand-950">
                        {v.arabicText}
                      </p>
                      <p className="mt-1.5 text-sm text-brand-900/70">{v.transliteration}</p>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <form action={togglePublishVerse}>
                        <input type="hidden" name="id" value={v.id} />
                        <input type="hidden" name="publish" value={(!v.publishedAt).toString()} />
                        <button className="rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-50">
                          {v.publishedAt ? "Unpublish" : "Publish"}
                        </button>
                      </form>
                      {v._count.recitations === 0 ? (
                        <form action={deleteVerse}>
                          <input type="hidden" name="id" value={v.id} />
                          <button className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50">
                            Remove
                          </button>
                        </form>
                      ) : (
                        <span className="text-xs text-brand-900/40" title="Members have already submitted recitations for this verse — unpublish it instead of removing it.">
                          Can&apos;t remove — has recitations
                        </span>
                      )}
                    </div>
                  </div>
                  <audio controls src={`/api/verses/${v.id}/audio`} className="mt-3 w-full" />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
