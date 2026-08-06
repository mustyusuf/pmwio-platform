import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { ROLES } from "@/lib/roles";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel, formatDate } from "@/components/dashboard/ui";
import { ArchiveCreateForm } from "@/components/dashboard/ArchiveForm";
import { CATEGORY_LABEL, MEDIA_TYPE_LABEL } from "@/lib/archive";
import { parseVideoEmbed } from "@/lib/video-embed";
import { toggleArchivePublish, deleteArchiveItem } from "@/app/actions/archive";

export const metadata: Metadata = { title: "Archive" };

export default async function ArchiveAdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/logout");
  if (user.role !== ROLES.ADMIN && user.role !== ROLES.EXECUTIVE) redirect("/dashboard");

  const items = await prisma.archiveItem.findMany({
    orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }],
  });

  return (
    <>
      <PageHeader
        title="Archive"
        subtitle="Past lectures, sermons and events for the public Archive page."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Panel title="Add to archive">
          <ArchiveCreateForm />
        </Panel>

        <Panel title={`Items (${items.length})`}>
          {items.length === 0 ? (
            <p className="text-sm text-brand-900/60">Nothing archived yet. Add the first item above.</p>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => {
                const embed = item.mediaType === "VIDEO_LINK" && item.url ? parseVideoEmbed(item.url) : null;
                return (
                  <li key={item.id} className="rounded-2xl border border-brand-100 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-brand-950">{item.title}</h3>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                              item.publishedAt ? "bg-emerald-100 text-emerald-800" : "bg-brand-100 text-brand-700"
                            }`}
                          >
                            {item.publishedAt ? "Published" : "Draft"}
                          </span>
                        </div>
                        <p className="text-xs text-brand-900/50">
                          {CATEGORY_LABEL[item.category] ?? item.category} · {MEDIA_TYPE_LABEL[item.mediaType] ?? item.mediaType}
                          {item.eventDate ? ` · ${formatDate(item.eventDate)}` : ""}
                        </p>
                        {item.description && <p className="mt-1.5 text-sm text-brand-900/70">{item.description}</p>}
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <form action={toggleArchivePublish}>
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="publish" value={(!item.publishedAt).toString()} />
                          <button className="rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-50">
                            {item.publishedAt ? "Unpublish" : "Publish"}
                          </button>
                        </form>
                        <form action={deleteArchiveItem}>
                          <input type="hidden" name="id" value={item.id} />
                          <button className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50">
                            Remove
                          </button>
                        </form>
                      </div>
                    </div>

                    <div className="mt-3">
                      {item.mediaType === "AUDIO_FILE" ? (
                        <audio controls src={`/api/archive/${item.id}/audio`} className="w-full" />
                      ) : embed?.embedUrl ? (
                        <iframe src={embed.embedUrl} className="aspect-video w-full rounded-lg" allow="autoplay; fullscreen" />
                      ) : item.url ? (
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">
                          Open link <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        </a>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
