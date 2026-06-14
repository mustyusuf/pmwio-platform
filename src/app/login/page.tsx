import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { LoginForm } from "@/components/forms/LoginForm";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Member Login" };

export default async function LoginPage() {
  if (await getSession()) redirect("/dashboard");

  return (
    <>
      <SiteHeader />
      <main className="bg-brand-50/60">
        <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
          <div className="rounded-3xl border border-brand-100 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold tracking-tight text-brand-950">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-brand-900/60">
              Log in to access your member dashboard.
            </p>

            <div className="mt-6">
              <LoginForm />
            </div>

            <p className="mt-4 text-center text-sm">
              <Link href="/forgot-password" className="font-semibold text-brand-700 hover:text-brand-900">Forgot password?</Link>
            </p>

            <p className="mt-2 text-center text-sm text-brand-900/70">
              New here?{" "}
              <Link href="/register" className="font-semibold text-brand-700 hover:text-brand-900">
                Become a member
              </Link>
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
