import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { ROLES } from "@/lib/roles";
import { getSettings, eligibleCount, clampQuorum } from "@/lib/settings";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel } from "@/components/dashboard/ui";
import { SettingsForm } from "@/components/dashboard/SettingsForm";
import { toggleEmpowerment } from "@/app/actions/workflow";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/logout");
  if (user.role !== ROLES.ADMIN && user.role !== ROLES.EXECUTIVE) redirect("/dashboard");

  const [settings, eligibleBoard, eligibleExec] = await Promise.all([
    getSettings(),
    eligibleCount(ROLES.BOARD),
    eligibleCount(ROLES.EXECUTIVE),
  ]);

  return (
    <>
      <PageHeader title="Approval settings" subtitle="Configure how many approvals are needed at each stage of the workflow." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Quorum">
          <SettingsForm
            boardQuorum={settings.boardQuorum}
            executiveQuorum={settings.executiveQuorum}
            eligibleBoard={eligibleBoard}
            eligibleExec={eligibleExec}
          />
        </Panel>
        <Panel title="Members' empowerment window">
          <p className="text-sm text-brand-900/70">
            When open, members can submit empowerment applications from their dashboard. When closed, the menu item is grayed out for them.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${settings.empowermentOpen ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"}`}>
              Currently {settings.empowermentOpen ? "OPEN" : "CLOSED"}
            </span>
            <form action={toggleEmpowerment}>
              <input type="hidden" name="open" value={(!settings.empowermentOpen).toString()} />
              <button className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${settings.empowermentOpen ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"}`}>
                {settings.empowermentOpen ? "Close window" : "Open window"}
              </button>
            </form>
          </div>
        </Panel>

        <Panel title="How approval works">
          <ul className="space-y-3 text-sm text-brand-900/70">
            <li>• An application needs <strong>{clampQuorum(settings.boardQuorum, eligibleBoard)}</strong> board approval(s) to pass to the Executive, then <strong>{clampQuorum(settings.executiveQuorum, eligibleExec)}</strong> executive approval(s) to be granted.</li>
            <li>• Each member can vote once per stage; the first decision to reach quorum wins.</li>
            <li>• Payments follow the same quorum: Finance enters them → Board approves → Executive gives final approval and the funds are disbursed.</li>
            <li>• A quorum can’t exceed the number of active members in that role.</li>
          </ul>
        </Panel>
      </div>
    </>
  );
}
