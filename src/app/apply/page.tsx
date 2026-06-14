import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ApplyForm, type CustomField } from "@/components/forms/ApplyForm";
import { PUBLIC_PROGRAMS } from "@/lib/content";
import { getSession } from "@/lib/session";
import { getCustomFields } from "@/lib/formFields";

export const metadata: Metadata = { title: "Apply for a Program" };

const VALID = new Set<string>(PUBLIC_PROGRAMS.map((p) => p.key));

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string; ref?: string }>;
}) {
  const { program, ref } = await searchParams;
  const initialProgram = program && VALID.has(program) ? program : undefined;
  const initialRefereeId = ref?.toUpperCase();
  // Only collect a new password (create an account) for logged-out applicants.
  const session = await getSession();
  const collectPassword = !session;
  const customFields: CustomField[] = await getCustomFields(["ORPHANAGE", "SCHOLARSHIP"]);

  return (
    <>
      <SiteHeader />
      <main className="bg-brand-50/60">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-brand-950 sm:text-4xl">
              Apply for support
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-brand-900/70">
              Open to everyone — you don&apos;t need to be a member, but you do
              need a member&apos;s Referee ID. Validate it below, then tell us
              how we can help.
            </p>
          </div>

          <div className="mt-10 rounded-3xl border border-brand-100 bg-white p-6 shadow-sm sm:p-8">
            <ApplyForm initialProgram={initialProgram} initialRefereeId={initialRefereeId} collectPassword={collectPassword} customFields={customFields} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
