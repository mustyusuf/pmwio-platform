import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { ROLES } from "@/lib/roles";
import { loadSiteContent } from "@/lib/content-store";
import { CONTENT_FIELDS } from "@/lib/siteContent";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { SiteContentForm, type ContentFieldView } from "@/components/dashboard/SiteContentForm";

export const metadata: Metadata = { title: "Site Content" };

export default async function SiteContentPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/logout");
  if (user.role !== ROLES.ADMIN && user.role !== ROLES.EXECUTIVE) redirect("/dashboard");

  const sc = await loadSiteContent();
  const fields: ContentFieldView[] = CONTENT_FIELDS.map((f) => ({
    key: f.key,
    label: f.label,
    type: f.type,
    section: f.section,
    help: f.help,
    value: f.type === "image" ? "" : sc.get(f.key),
    imageUrl: f.type === "image" ? sc.image(f.key) : null,
  }));

  return (
    <>
      <PageHeader title="Site content" subtitle="Edit the text and images shown across the public website. Changes go live immediately." />
      <SiteContentForm fields={fields} />
    </>
  );
}
