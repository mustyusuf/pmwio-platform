import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { ROLES } from "@/lib/roles";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ExecutiveDashboard } from "@/components/dashboard/roles/ExecutiveDashboard";
import { BoardDashboard } from "@/components/dashboard/roles/BoardDashboard";
import { AdminDashboard } from "@/components/dashboard/roles/AdminDashboard";
import { FinanceDashboard } from "@/components/dashboard/roles/FinanceDashboard";
import { CoordinatorDashboard } from "@/components/dashboard/roles/CoordinatorDashboard";
import { MemberDashboard } from "@/components/dashboard/roles/MemberDashboard";
import { BeneficiaryDashboard } from "@/components/dashboard/roles/BeneficiaryDashboard";

export const metadata: Metadata = { title: "Overview" };

export default async function DashboardOverviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/logout");

  let content: React.ReactNode;
  switch (user.role) {
    case ROLES.EXECUTIVE:
      content = await ExecutiveDashboard({ userId: user.id });
      break;
    case ROLES.BOARD:
      content = await BoardDashboard({ userId: user.id });
      break;
    case ROLES.ADMIN:
      content = await AdminDashboard({ selfId: user.id });
      break;
    case ROLES.FINANCE:
      content = await FinanceDashboard();
      break;
    case ROLES.COORDINATOR:
      content = await CoordinatorDashboard({ userId: user.id, statesJson: user.states });
      break;
    case ROLES.BENEFICIARY:
      content = await BeneficiaryDashboard({ userId: user.id });
      break;
    default:
      content = await MemberDashboard({ userId: user.id, code: user.userId });
  }

  return (
    <>
      <PageHeader title={`Welcome back, ${user.name.split(" ")[0]}`} subtitle="Here's an overview of your activity." />
      {content}
    </>
  );
}
