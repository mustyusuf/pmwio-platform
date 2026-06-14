import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { ROLE_LABEL } from "@/lib/roles";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel } from "@/components/dashboard/ui";
import { ProfileForm, ChangePasswordForm } from "@/components/dashboard/ProfileForms";

export const metadata: Metadata = { title: "My Profile" };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/logout");

  return (
    <>
      <PageHeader title="My profile" subtitle={`${ROLE_LABEL[user.role] ?? user.role} · ${user.userId}`} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Profile details">
          <ProfileForm
            user={{ id: user.id, name: user.name, email: user.email, userId: user.userId, phone: user.phone, country: user.country }}
            hasImage={Boolean(user.imagePath)}
          />
        </Panel>
        <Panel title="Change password">
          <ChangePasswordForm />
        </Panel>
      </div>
    </>
  );
}
