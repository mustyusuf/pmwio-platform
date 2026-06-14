import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { isStaff } from "@/lib/roles";
import { prisma } from "@/lib/db";
import { PROGRAMS, PROGRAM_LABEL } from "@/lib/content";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DataTable, type Column, type Filter, type Row } from "@/components/dashboard/DataTable";

export const metadata: Metadata = { title: "Beneficiaries" };

const VALID = new Set<string>(PROGRAMS.map((p) => p.key));

export default async function BeneficiariesPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/logout");
  if (!isStaff(user.role)) redirect("/dashboard");

  const { program } = await searchParams;
  const activeProgram = program && VALID.has(program) ? program : undefined;

  const apps = await prisma.application.findMany({
    where: { beneficiaryId: { not: null } },
    orderBy: { createdAt: "desc" },
    include: {
      beneficiary: { select: { userId: true, phone: true } },
      payments: { where: { status: "COMPLETED" }, select: { amount: true } },
    },
  });

  const parse = (s: string | null): Record<string, string> => { try { return s ? JSON.parse(s) : {}; } catch { return {}; } };
  const rows: Row[] = apps.map((a) => {
    const fd = parse(a.formData);
    return {
      id: a.id,
      name: a.fullName,
      userId: a.beneficiary?.userId ?? "",
      program: a.category,
      country: a.country ?? "",
      state: fd.state ?? "",
      studentCategory: fd.studentCategory ?? fd.need ?? "",
      referee: a.referredByCode,
      received: a.payments.reduce((s, p) => s + p.amount, 0),
      status: a.status,
      scholarshipStart: a.scholarshipStart ? a.scholarshipStart.toISOString() : "",
      scholarshipEnd: a.scholarshipEnd ? a.scholarshipEnd.toISOString() : "",
      createdAt: a.createdAt.toISOString(),
    };
  });

  const showScholarship = activeProgram === "SCHOLARSHIP";
  const columns: Column[] = [
    { key: "name", header: "Beneficiary" },
    { key: "userId", header: "User ID", type: "mono" },
    { key: "program", header: "Program", type: "program" },
    { key: "country", header: "Country" },
    ...(showScholarship
      ? ([{ key: "state", header: "State" }, { key: "studentCategory", header: "Category" }] as Column[])
      : []),
    { key: "referee", header: "Referred by", type: "mono" },
    { key: "received", header: "Received", type: "money", align: "right" },
    { key: "status", header: "Status", type: "status" },
    ...(showScholarship
      ? ([{ key: "scholarshipStart", header: "Start", type: "date" }, { key: "scholarshipEnd", header: "End", type: "date" }] as Column[])
      : []),
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

  const title = activeProgram ? `${PROGRAM_LABEL[activeProgram]} beneficiaries` : "All beneficiaries";

  return (
    <>
      <PageHeader title={title} subtitle="Applicants in our programs and the support they've received." />
      <DataTable
        key={activeProgram ?? "all"}
        columns={columns}
        rows={rows}
        searchKeys={["name", "userId", "referee", "country"]}
        filters={filters}
        initialFilters={activeProgram ? { program: activeProgram } : {}}
        searchPlaceholder="Search beneficiaries…"
        linkBase="/dashboard/applications"
      />
    </>
  );
}
