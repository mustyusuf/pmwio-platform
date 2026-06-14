import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { isStaff, ROLES } from "@/lib/roles";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DataTable, type Column, type Filter, type Row } from "@/components/dashboard/DataTable";

export const metadata: Metadata = { title: "Members" };

export default async function MembersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/logout");
  if (!isStaff(user.role)) redirect("/dashboard");

  const members = await prisma.user.findMany({
    where: { role: ROLES.MEMBER },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { referred: true } } },
  });

  const rows: Row[] = members.map((m) => ({
    id: m.id,
    name: m.name,
    userId: m.userId,
    email: m.email,
    country: m.country ?? "",
    phone: m.phone ?? "",
    referrals: m._count.referred,
    active: m.active,
    createdAt: m.createdAt.toISOString(),
  }));

  const columns: Column[] = [
    { key: "name", header: "Name" },
    { key: "userId", header: "User ID", type: "mono" },
    { key: "email", header: "Email", type: "muted" },
    { key: "country", header: "Country" },
    { key: "phone", header: "Phone", type: "muted" },
    { key: "referrals", header: "Referrals", align: "right" },
    { key: "active", header: "Status", type: "active" },
    { key: "createdAt", header: "Joined", type: "date" },
  ];

  const countries = [...new Set(members.map((m) => m.country).filter(Boolean))] as string[];
  const filters: Filter[] = [
    { key: "country", label: "Country", options: countries.map((c) => ({ value: c, label: c })) },
    { key: "active", label: "Status", options: [{ value: "true", label: "Active" }, { value: "false", label: "Disabled" }] },
  ];

  return (
    <>
      <PageHeader title="Members" count={members.length} subtitle="All members who can refer and vouch for beneficiaries." />
      <DataTable columns={columns} rows={rows} searchKeys={["name", "email", "userId"]} filters={filters} searchPlaceholder="Search members by name, email or User ID…" />
    </>
  );
}
