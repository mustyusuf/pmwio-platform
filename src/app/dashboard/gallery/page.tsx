import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { ROLES } from "@/lib/roles";
import { prisma } from "@/lib/db";
import { GALLERY_CATEGORIES } from "@/lib/content";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel, EmptyState } from "@/components/dashboard/ui";
import { AlbumCreateForm } from "@/components/dashboard/GalleryUploadForm";
import { deleteAlbum, deleteGalleryImage, importLegacyGalleryImages, toggleAlbumDraft, toggleGalleryImage } from "@/app/actions/gallery";

export const metadata: Metadata = { title: "Gallery" };

const CAT_LABEL: Record<string, string> = Object.fromEntries(GALLERY_CATEGORIES.map((c) => [c.key, c.label]));

export default async function GalleryAdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/logout");
  if (user.role !== ROLES.ADMIN && user.role !== ROLES.EXECUTIVE) redirect("/dashboard");

  const [albums, images] = await Promise.all([
    prisma.album.findMany({
      orderBy: [{ draft: "asc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
      include: { images: { orderBy: [{ order: "asc" }, { createdAt: "desc" }] } },
    }),
    prisma.galleryImage.findMany({
      where: { albumId: null },
      orderBy: [{ category: "asc" }, { order: "asc" }],
    }),
  ]);

  const formatDate = (date: Date | null) =>
    date
      ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date)
      : "Not set";

  return (
    <>
      <PageHeader
        title="Gallery"
        count={albums.length + images.length}
        subtitle="Upload related photos together under one album title and category, with a caption for each photo."
        action={<AlbumCreateForm />}
      />
      <div className="space-y-6">
        <Panel title="Albums">
          {albums.length === 0 ? (
            <EmptyState>No albums yet. Use the Create album button to add the first one.</EmptyState>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {albums.map((album) => (
                <article key={album.id} className="overflow-hidden rounded-xl border border-brand-100 bg-white">
                  <div className="relative aspect-[4/3] bg-brand-100">
                    {album.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`/api/gallery/${album.images[0].id}`} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center text-sm text-brand-900/40">No photos</div>
                    )}
                    <span className="absolute left-2 top-2 rounded-full bg-brand-900/80 px-2 py-0.5 text-[10px] font-semibold text-white">
                      {CAT_LABEL[album.category] ?? album.category}
                    </span>
                    <span className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white ${album.draft ? "bg-amber-600/90" : "bg-emerald-700/90"}`}>
                      {album.draft ? "Draft" : "Published"}
                    </span>
                  </div>
                  <div className="p-3">
                    <h2 className="truncate text-sm font-semibold text-brand-950">{album.title}</h2>
                    <p className="mt-1 text-xs text-brand-900/55">
                      {album.images.length} {album.images.length === 1 ? "photo" : "photos"} · Published {formatDate(album.publishedAt)}
                    </p>
                    <div className="mt-3 flex items-center gap-3 border-t border-brand-100 pt-3">
                      <form action={toggleAlbumDraft}>
                        <input type="hidden" name="id" value={album.id} />
                        <input type="hidden" name="draft" value={(!album.draft).toString()} />
                        <button className="text-xs font-semibold text-brand-700 hover:text-brand-900">
                          {album.draft ? "Publish" : "Move to draft"}
                        </button>
                      </form>
                      <form action={deleteAlbum} className="ml-auto">
                        <input type="hidden" name="id" value={album.id} />
                        <button className="text-xs font-semibold text-red-600 hover:text-red-800">Delete</button>
                      </form>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Panel>

        {images.length > 0 && (
          <Panel title="Legacy individual photos">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {images.map((g) => (
                <figure key={g.id} className="overflow-hidden rounded-xl border border-brand-100">
                  <div className="relative aspect-[4/3] bg-brand-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/gallery/${g.id}`} alt={g.caption} className={`h-full w-full object-cover ${g.active ? "" : "opacity-40"}`} />
                    <span className="absolute left-2 top-2 rounded-full bg-brand-900/80 px-2 py-0.5 text-[10px] font-semibold text-white">{CAT_LABEL[g.category] ?? g.category}</span>
                    {!g.active && <span className="absolute right-2 top-2 rounded-full bg-red-600/90 px-2 py-0.5 text-[10px] font-semibold text-white">hidden</span>}
                  </div>
                  <figcaption className="flex items-center justify-between gap-2 p-2">
                    <span className="truncate text-xs text-brand-900/70">{g.caption}</span>
                    <span className="flex shrink-0 gap-2">
                      <form action={toggleGalleryImage}>
                        <input type="hidden" name="id" value={g.id} />
                        <input type="hidden" name="active" value={(!g.active).toString()} />
                        <button className="text-[11px] font-semibold text-brand-700 hover:text-brand-900">{g.active ? "Hide" : "Show"}</button>
                      </form>
                      <form action={deleteGalleryImage}>
                        <input type="hidden" name="id" value={g.id} />
                        <button className="text-[11px] font-semibold text-red-600 hover:text-red-800">Delete</button>
                      </form>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </Panel>
        )}

        <Panel title="Import website images">
          <p className="text-sm leading-relaxed text-brand-900/65">
            Add the images extracted from the old website as individual legacy photos. New gallery uploads should use albums.
          </p>
          <form action={importLegacyGalleryImages} className="mt-4">
            <button className="rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800">
              Import website images
            </button>
          </form>
        </Panel>
      </div>
    </>
  );
}
