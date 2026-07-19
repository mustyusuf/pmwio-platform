import { connection } from "next/server";
import { prisma } from "@/lib/db";

export type TeamMemberDTO = {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  image: string | null;
  initials: string;
};

/** Up to two initials, used when a member has no uploaded portrait. */
function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

function toDTO(m: { id: string; name: string; role: string; bio: string | null; storedName: string | null }): TeamMemberDTO {
  return {
    id: m.id,
    name: m.name,
    role: m.role,
    bio: m.bio,
    image: m.storedName ? `/api/team/${m.id}` : null,
    initials: initialsOf(m.name),
  };
}

/** Visible management team for the public About page, in display order. */
export async function getTeamMembers(): Promise<TeamMemberDTO[]> {
  // better-sqlite3 is synchronous, so opt out of prerendering at build time
  // (the runtime database volume does not exist during the Docker build).
  await connection();
  const rows = await prisma.teamMember.findMany({
    where: { active: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(toDTO);
}
