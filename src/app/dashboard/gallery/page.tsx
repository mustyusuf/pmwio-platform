import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { ROLES } from "@/lib/roles";
import { prisma } from "@/lib/db";
import { GALLERY_CATEGORIES } from "@/lib/content";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel, EmptyState } from "@/components/dashboard/ui";
import { GalleryUploadForm } from "@/components/dashboard/GalleryUploadForm";
import { deleteGalleryImage, toggleGalleryImage } from "@/app/actions/gallery";

export const metadata: Metadata = { title: "Gallery" };

const CAT_LABEL: Record<string, string> = Object.fromEntries(GALLERY_CATEGORIES.map((c) => [c.key, c.label]));

export default async function GalleryAdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/logout");
  if (user.role !== ROLES.ADMIN && user.role !== ROLES.EXECUTIVE) redirect("/dashboard");

  const images = await prisma.galleryImage.findMany({ orderBy: [{ category: "asc" }, { order: "asc" }] });

  return (
    <>
      <PageHeader title="Gallery" count={images.length} subtitle="Upload photos and assign them to a category. They appear, filtered by category, on the public gallery." />
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Panel title="Photos">
          {images.length === 0 ? (
            <EmptyState>No images yet. Upload your first photo on the right.</EmptyState>
          ) : (
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
          )}
        </Panel>

        <Panel title="Upload an image">
          <GalleryUploadForm />
        </Panel>
      </div>
    </>
  );
}
