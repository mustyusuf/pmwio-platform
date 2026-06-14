import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ForgotPasswordForm } from "@/components/forms/PasswordResetForms";

export const metadata: Metadata = { title: "Forgot Password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-brand-50/60">
        <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
          <div className="rounded-3xl border border-brand-100 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold tracking-tight text-brand-950">Reset your password</h1>
            <p className="mt-2 text-sm text-brand-900/60">Enter your User ID or email and we&apos;ll generate a reset link.</p>
            <div className="mt-6"><ForgotPasswordForm /></div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
