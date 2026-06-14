import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { isStaff, ROLES } from "@/lib/roles";
import { prisma } from "@/lib/db";
import { PROGRAMS } from "@/lib/content";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DataTable, type Column, type Filter, type Row } from "@/components/dashboard/DataTable";

export const metadata: Metadata = { title: "Applications" };

export default async function ApplicationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/logout");

  // Scope the list to the viewer's role.
  let where = {};
  let title = "Applications";
  let subtitle = "Every application and its position in the workflow.";
  if (user.role === ROLES.MEMBER) {
    where = { referredById: user.id };
    title = "My referrals";
    subtitle = "Applications submitted under your User ID.";
  } else if (user.role === ROLES.BENEFICIARY) {
    where = { beneficiaryId: user.id };
    title = "My applications";
    subtitle = "Your applications and their current status.";
  } else if (!isStaff(user.role)) {
    redirect("/dashboard");
  }

  const apps = await prisma.application.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { referredBy: { select: { name: true } } },
  });

  const rows: Row[] = apps.map((a) => ({
    id: a.id,
    reference: a.reference,
    name: a.fullName,
    program: a.category,
    referee: a.referredByCode,
    country: a.country ?? "",
    status: a.status,
    createdAt: a.createdAt.toISOString(),
  }));

  const columns: Column[] = [
    { key: "reference", header: "Ref", type: "mono" },
    { key: "name", header: "Applicant" },
    { key: "program", header: "Program", type: "program" },
    ...(isStaff(user.role) ? [{ key: "referee", header: "Referee", type: "mono" } as Column, { key: "country", header: "Country" } as Column] : []),
    { key: "status", header: "Status", type: "status" },
    { key: "createdAt", header: "Applied", type: "date" },
  ];

  const filters: Filter[] = [
    { key: "program", label: "Program", options: PROGRAMS.map((p) => ({ value: p.key, label: p.title })) },
    {
      key: "status",
      label: "Status",
      options: [
        { value: "PENDING_REFEREE", label: "Awaiting referee" },
        { value: "PENDING_BOARD", label: "Board review" },
        { value: "PENDING_EXECUTIVE", label: "Executive decision" },
        { value: "APPROVED", label: "Approved" },
        { value: "REJECTED", label: "Rejected" },
        { value: "REFEREE_REJECTED", label: "Declined by referee" },
      ],
    },
  ];

  return (
    <>
      <PageHeader title={title} count={apps.length} subtitle={subtitle} />
      <DataTable columns={columns} rows={rows} searchKeys={["reference", "name", "referee"]} filters={filters} searchPlaceholder="Search by reference, applicant or referee…" linkBase="/dashboard/applications" />
    </>
  );
}
