import { prisma } from "@/lib/db";
import { SiteContent } from "@/lib/siteContent";
import { PROGRAMS } from "@/lib/content";

/** Loads all site-content overrides from the database and returns a resolver
 *  that falls back to the registry defaults. Call once per request. */
export async function loadSiteContent(): Promise<SiteContent> {
  const rows = await prisma.siteContent.findMany();
  const map = new Map(rows.map((r) => [r.key, { value: r.value, type: r.type }]));
  return new SiteContent(map);
}

/** PROGRAMS with admin-editable title/description applied. */
export function resolvePrograms(sc: SiteContent) {
  return PROGRAMS.map((p) => {
    const k = p.key.toLowerCase();
    return { ...p, title: sc.get(`program.${k}.title`), description: sc.get(`program.${k}.description`) };
  });
}
