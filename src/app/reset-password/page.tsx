import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ResetPasswordForm } from "@/components/forms/PasswordResetForms";

export const metadata: Metadata = { title: "Reset Password" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;

  return (
    <>
      <SiteHeader />
      <main className="bg-brand-50/60">
        <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
          <div className="rounded-3xl border border-brand-100 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold tracking-tight text-brand-950">Choose a new password</h1>
            <div className="mt-6">
              {token ? (
                <ResetPasswordForm token={token} />
              ) : (
                <p className="text-sm text-brand-900/60">This reset link is missing its token. <Link href="/forgot-password" className="font-semibold text-brand-700">Request a new one</Link>.</p>
              )}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
