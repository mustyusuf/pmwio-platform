import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheckBig, MailWarning } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ResendVerificationForm } from "@/components/forms/ResendVerificationForm";
import { verifyEmailToken } from "@/app/actions/auth";

export const metadata: Metadata = { title: "Confirm your email" };

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const result = token ? await verifyEmailToken(token) : null;

  return (
    <>
      <SiteHeader />
      <main className="bg-brand-50/60">
        <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
          <div className="rounded-3xl border border-brand-100 bg-white p-8 shadow-sm">
            {result?.ok ? (
              <div className="text-center">
                <CircleCheckBig className="mx-auto h-10 w-10 text-emerald-600" aria-hidden />
                <h1 className="mt-3 text-2xl font-bold tracking-tight text-brand-950">
                  {result.alreadyVerified ? "Email already confirmed" : "Email confirmed"}
                </h1>
                <p className="mt-2 text-sm text-brand-900/70">
                  {result.alreadyVerified
                    ? "Your email address is already confirmed."
                    : "Thank you — your email address has been confirmed. An administrator will review your membership and you'll be notified once your account is approved."}
                </p>
                <Link href="/login" className="mt-6 inline-block rounded-xl bg-brand-700 px-5 py-3 font-semibold text-white hover:bg-brand-800">
                  Go to login
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <MailWarning className="mx-auto h-10 w-10 text-amber-500" aria-hidden />
                  <h1 className="mt-3 text-2xl font-bold tracking-tight text-brand-950">Confirm your email</h1>
                  <p className="mt-2 text-sm text-brand-900/70">
                    {result?.error ?? "Enter your User ID or email and we'll send you a new confirmation link."}
                  </p>
                </div>
                <div className="mt-6">
                  <ResendVerificationForm />
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
