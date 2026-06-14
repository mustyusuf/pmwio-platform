import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { RegisterForm } from "@/components/forms/RegisterForm";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Become a Member" };

export default async function RegisterPage() {
  if (await getSession()) redirect("/dashboard");

  return (
    <>
      <SiteHeader />
      <main className="bg-brand-50/60">
        <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
          <div className="rounded-3xl border border-brand-100 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold tracking-tight text-brand-950">
              Become a member
            </h1>
            <p className="mt-2 text-sm text-brand-900/60">
              Create your account to receive a unique User ID and your own
              member dashboard.
            </p>

            <div className="mt-6">
              <RegisterForm />
            </div>

            <p className="mt-6 text-center text-sm text-brand-900/70">
              Already a member?{" "}
              <Link href="/login" className="font-semibold text-brand-700 hover:text-brand-900">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
