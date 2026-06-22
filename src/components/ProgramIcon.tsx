import { GraduationCap, HandHeart, Sprout } from "lucide-react";
import type { ProgramKey } from "@/lib/content";

const ICONS = {
  EMPOWERMENT: Sprout,
  ORPHANAGE: HandHeart,
  SCHOLARSHIP: GraduationCap,
} satisfies Record<ProgramKey, typeof Sprout>;

export function ProgramIcon({ program, className = "h-7 w-7" }: { program: ProgramKey; className?: string }) {
  const Icon = ICONS[program];
  return <Icon className={className} aria-hidden strokeWidth={1.8} />;
}
