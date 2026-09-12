import { prisma } from "@/lib/db";
import { parseVideoEmbed } from "@/lib/video-embed";
import { type ArchiveItemDTO } from "@/lib/archive-constants";

export { CATEGORY_LABEL, MEDIA_TYPE_LABEL, type ArchiveItemDTO } from "@/lib/archive-constants";

/** Published archive items, most recent event first — for the public page. */
export async function getArchiveData(): Promise<ArchiveItemDTO[]> {
  const items = await prisma.archiveItem.findMany({
    where: { publishedAt: { not: null } },
    orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }],
  });

  return items.map((item) => ({
    id: item.id,
    title: item.title,
    topic: item.topic,
    lecturer: item.lecturer,
    description: item.description,
    category: item.category,
    mediaType: item.mediaType,
    url: item.url,
    audioSrc: item.mediaType === "AUDIO_FILE" ? `/api/archive/${item.id}/audio` : null,
    embedUrl: item.mediaType === "VIDEO_LINK" && item.url ? parseVideoEmbed(item.url).embedUrl : null,
    imageSrc: item.imageStoredName ? `/api/archive/${item.id}/image` : null,
    eventDate: item.eventDate ? item.eventDate.toISOString() : null,
  }));
}
