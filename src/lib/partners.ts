import { connection } from "next/server";
import { prisma } from "@/lib/db";

export type PartnerDTO = {
  id: string;
  name: string;
  url: string | null;
  image: string | null;
  initials: string;
};

/** Up to two initials, used when a partner/supporter has no uploaded logo. */
function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

function toDTO(p: { id: string; name: string; url: string | null; storedName: string | null }): PartnerDTO {
  return {
    id: p.id,
    name: p.name,
    url: p.url,
    image: p.storedName ? `/api/partners/${p.id}` : null,
    initials: initialsOf(p.name),
  };
}

/** Visible partners and supporters for the public Orphanage page, in display order. */
export async function getPartners(): Promise<{ partners: PartnerDTO[]; supporters: PartnerDTO[] }> {
  // better-sqlite3 is synchronous, so opt out of prerendering at build time
  // (the runtime database volume does not exist during the Docker build).
  await connection();
  const rows = await prisma.partner.findMany({
    where: { active: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return {
    partners: rows.filter((r) => r.kind === "PARTNER").map(toDTO),
    supporters: rows.filter((r) => r.kind === "SUPPORTER").map(toDTO),
  };
}
