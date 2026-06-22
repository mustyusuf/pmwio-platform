"use client";

import Link from "next/link";
import { useActionState, useEffect, useState, useTransition } from "react";
import { ArrowRight, CircleCheckBig } from "lucide-react";
import { submitApplication, validateReferee, type ApplyState } from "@/app/actions/apply";
import {
  PUBLIC_PROGRAMS, SCHOLARSHIP_STATES, SCHOOL_TYPES, SCHOOL_OWNERSHIP,
  STUDENT_CATEGORIES, SCHOLARSHIP_MAX_AWARD, ORPHANAGE_CLASS_TYPES, ORPHANAGE_NEEDS,
} from "@/lib/content";
import { SubmitButton } from "./SubmitButton";

export type CustomField = { id: string; label: string; name: string; type: string; options: string[]; required: boolean; category: string };

const formatNaira = (n: number) => "₦" + n.toLocaleString("en-NG");

const label = "block text-sm font-medium text-brand-900";
const input =
  "mt-1.5 w-full rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-brand-950 outline-none transition placeholder:text-brand-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 disabled:cursor-not-allowed disabled:bg-brand-50/60";

const PUBLIC_KEYS = new Set<string>(PUBLIC_PROGRAMS.map((p) => p.key));

export function ApplyForm({
  initialProgram,
  initialRefereeId,
  collectPassword = true,
  customFields = [],
}: {
  initialProgram?: string;
  initialRefereeId?: string;
  collectPassword?: boolean;
  customFields?: CustomField[];
}) {
  const [state, formAction] = useActionState<ApplyState, FormData>(submitApplication, null);

  const [refereeId, setRefereeId] = useState(initialRefereeId ?? "");
  const [refereeName, setRefereeName] = useState<string | null>(null);
  const [refError, setRefError] = useState<string | null>(null);
  const [validating, startValidating] = useTransition();
  const [category, setCategory] = useState(initialProgram && PUBLIC_KEYS.has(initialProgram) ? initialProgram : "");
  const [coordStates, setCoordStates] = useState<string[] | null>(null);

  function runValidation(value: string) {
    if (!category) { setRefError("Please choose a program first."); return; }
    setRefError(null);
    startValidating(async () => {
      const res = await validateReferee(value, category);
      if (res.ok) { setRefereeId(res.refereeId); setRefereeName(res.name); setCoordStates(res.states ?? null); }
      else { setRefereeName(null); setCoordStates(null); setRefError(res.error); }
    });
  }

  useEffect(() => {
    if (initialRefereeId) runValidation(initialRefereeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isValidated = Boolean(refereeName);
  const formError = state && !state.ok ? state.error : null;

  if (state?.ok) {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-600 text-white">
          <CircleCheckBig className="h-7 w-7" aria-hidden />
        </div>
        <h2 className="mt-4 text-xl font-bold text-emerald-900">Application received!</h2>
        <p className="mt-2 text-sm text-emerald-800">Your application is now awaiting confirmation from your referee. Reference number:</p>
        <p className="mt-3 inline-block rounded-lg bg-white px-4 py-2 font-mono text-lg font-bold tracking-wider text-emerald-900 ring-1 ring-emerald-200">{state.reference}</p>
        {state.createdAccount && state.userId && (
          <div className="mt-4 rounded-xl bg-white p-4 text-sm text-emerald-900 ring-1 ring-emerald-200">
            We created an account so you can track your application. Your <strong>User ID</strong> is <span className="font-mono font-bold">{state.userId}</span> — log in with it (or your email) and the password you chose.
          </div>
        )}
        <div className="mt-6 flex justify-center gap-4">
          <Link href="/login" className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:text-brand-900">
            Log in to track <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link href="/" className="font-semibold text-brand-700 hover:text-brand-900">Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step 1 — program + referee */}
      <div className="rounded-2xl border border-brand-200 bg-brand-50/60 p-5">
        <h3 className="text-sm font-bold text-brand-900">Step 1 · Program &amp; referee</h3>

        <label htmlFor="program" className={`${label} mt-4`}>Which program are you applying for?</label>
        <select
          id="program"
          value={category}
          onChange={(e) => { setCategory(e.target.value); setRefereeName(null); setCoordStates(null); setRefError(null); }}
          className={input}
        >
          <option value="" disabled>Select a program…</option>
          {PUBLIC_PROGRAMS.map((p) => (<option key={p.key} value={p.key}>{p.title}</option>))}
        </select>

        <p className="mt-3 text-xs text-brand-900/60">
          {category === "SCHOLARSHIP"
            ? "Scholarships must be nominated by a State Coordinator. Enter their Coordinator ID and validate it."
            : "Applications must be referred by a member who can vouch for you. Enter their Referee ID and validate it."}
        </p>

        <label htmlFor="refereeId" className={`${label} mt-3`}>{category === "SCHOLARSHIP" ? "State Coordinator ID" : "Referee ID"}</label>
        <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
          <input id="refereeId" value={refereeId} onChange={(e) => { setRefereeId(e.target.value.toUpperCase()); setRefereeName(null); setCoordStates(null); setRefError(null); }} readOnly={isValidated} className={`${input} mt-0 flex-1 uppercase`} placeholder="PMW-XXXXXX" />
          {isValidated ? (
            <button type="button" onClick={() => { setRefereeName(null); setCoordStates(null); setRefError(null); }} className="shrink-0 rounded-xl border border-brand-200 px-5 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-white">Change</button>
          ) : (
            <button type="button" onClick={() => runValidation(refereeId)} disabled={validating || refereeId.trim().length === 0 || !category} className="shrink-0 rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60">{validating ? "Validating…" : "Validate"}</button>
          )}
        </div>
        {isValidated && (
          <p className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200">
            <CircleCheckBig className="h-4 w-4 shrink-0" aria-hidden />
            {category === "SCHOLARSHIP" ? "Nominated by" : "Referred by"} {refereeName}
            {coordStates && coordStates.length > 0 ? ` · covers ${coordStates.join(", ")}` : ""}
          </p>
        )}
        {refError && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 ring-1 ring-red-100">{refError}</p>}
      </div>

      {/* Step 2 — application details */}
      <form action={formAction} className="space-y-4">
        {formError && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-100">{formError}</p>}
        <input type="hidden" name="refereeId" value={refereeId} />

        <fieldset disabled={!isValidated} className={isValidated ? "" : "pointer-events-none opacity-50"}>
          <legend className="sr-only">Application details</legend>
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-brand-900">Step 2 · Applicant details</h3>
            <input type="hidden" name="category" value={category} />

            <div className="grid gap-4 sm:grid-cols-2">
              <div><label htmlFor="firstName" className={label}>First name</label><input id="firstName" name="firstName" required className={input} placeholder="First name" /></div>
              <div><label htmlFor="lastName" className={label}>Last name</label><input id="lastName" name="lastName" required className={input} placeholder="Last name" /></div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div><label htmlFor="email" className={label}>Email address</label><input id="email" name="email" type="email" required autoComplete="email" className={input} placeholder="you@example.com" /></div>
              <div><label htmlFor="contactPhone" className={label}>Contact phone</label><input id="contactPhone" name="contactPhone" className={input} placeholder="+234…" /></div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div><label htmlFor="country" className={label}>Country</label><input id="country" name="country" className={input} placeholder="Nigeria" /></div>
              <div><label htmlFor="nin" className={label}>NIN <span className="text-brand-400">(National ID No.)</span></label><input id="nin" name="nin" className={input} placeholder="National Identification Number" /></div>
            </div>

            <div><label htmlFor="address" className={label}>Residential address</label><input id="address" name="address" className={input} placeholder="House no., street, city, state" /></div>

            <fieldset className="rounded-xl border border-brand-100 p-4">
              <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-brand-600">Guardian / parent details</legend>
              <div className="grid gap-4 sm:grid-cols-3">
                <div><label htmlFor="guardianName" className={label}>Name</label><input id="guardianName" name="guardianName" className={input} placeholder="Guardian's full name" /></div>
                <div><label htmlFor="guardianRelationship" className={label}>Relationship</label><input id="guardianRelationship" name="guardianRelationship" className={input} placeholder="e.g. Mother" /></div>
                <div><label htmlFor="guardianPhone" className={label}>Phone</label><input id="guardianPhone" name="guardianPhone" className={input} placeholder="+234…" /></div>
              </div>
            </fieldset>

            {category === "SCHOLARSHIP" && (
              <fieldset className="rounded-xl border border-brand-100 p-4">
                <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-brand-600">Scholarship details</legend>
                <p className="mb-3 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-900/70">Maximum award for scholarships is <strong>{formatNaira(SCHOLARSHIP_MAX_AWARD)}</strong>. Only public, federal or state schools are eligible — private schools are not.</p>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div><label htmlFor="state" className={label}>State</label>
                    <select id="state" name="state" required className={input}>
                      <option value="">Select state…</option>
                      {(coordStates && coordStates.length > 0 ? coordStates : SCHOLARSHIP_STATES).map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {coordStates && coordStates.length > 0 && <p className="mt-1 text-xs text-brand-900/50">Limited to your coordinator&apos;s states.</p>}
                  </div>
                  <div><label htmlFor="studentCategory" className={label}>Category</label>
                    <select id="studentCategory" name="studentCategory" required className={input}>
                      <option value="">Select…</option>
                      {STUDENT_CATEGORIES.map((s) => <option key={s} value={s}>{s} student</option>)}
                    </select>
                  </div>
                  <div><label htmlFor="term" className={label}>Term applying for</label><input id="term" name="term" className={input} placeholder="e.g. First term 2025/2026" /></div>
                  <div><label htmlFor="schoolType" className={label}>School type</label>
                    <select id="schoolType" name="schoolType" required className={input}>
                      <option value="">Select…</option>
                      {SCHOOL_TYPES.map((s) => <option key={s} value={s}>{s} School</option>)}
                    </select>
                  </div>
                  <div><label htmlFor="schoolOwnership" className={label}>School ownership</label>
                    <select id="schoolOwnership" name="schoolOwnership" required className={input}>
                      <option value="">Select…</option>
                      {SCHOOL_OWNERSHIP.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div><label htmlFor="schoolName" className={label}>School name</label><input id="schoolName" name="schoolName" className={input} placeholder="Name of school" /></div>
                  <div><label htmlFor="schoolClass" className={label}>Class / level</label><input id="schoolClass" name="schoolClass" className={input} placeholder="e.g. JSS2" /></div>
                  <div><label htmlFor="academicYear" className={label}>Academic year</label><input id="academicYear" name="academicYear" className={input} placeholder="e.g. 2025/2026" /></div>
                </div>
              </fieldset>
            )}

            {category === "ORPHANAGE" && (
              <fieldset className="rounded-xl border border-brand-100 p-4">
                <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-brand-600">Orphanage details</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><label htmlFor="classType" className={label}>Class type</label>
                    <select id="classType" name="classType" required className={input}>
                      <option value="">Select…</option>
                      {ORPHANAGE_CLASS_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div><label htmlFor="need" className={label}>Type of need</label>
                    <select id="need" name="need" required className={input}>
                      <option value="">Select…</option>
                      {ORPHANAGE_NEEDS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </fieldset>
            )}

            {/* Admin-defined custom fields for the selected program */}
            {category && customFields.filter((f) => f.category === category || f.category === "ALL").length > 0 && (
              <fieldset className="rounded-xl border border-brand-100 p-4">
                <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-brand-600">Additional information</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  {customFields.filter((f) => f.category === category || f.category === "ALL").map((f) => (
                    <div key={f.id} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
                      <label htmlFor={`cf-${f.name}`} className={label}>{f.label}{f.required ? "" : <span className="text-brand-400"> (optional)</span>}</label>
                      {f.type === "textarea" ? (
                        <textarea id={`cf-${f.name}`} name={f.name} required={f.required} rows={3} className={input} />
                      ) : f.type === "select" ? (
                        <select id={`cf-${f.name}`} name={f.name} required={f.required} className={input}>
                          <option value="">Select…</option>
                          {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input id={`cf-${f.name}`} name={f.name} type={f.type === "number" ? "number" : "text"} required={f.required} className={input} />
                      )}
                    </div>
                  ))}
                </div>
              </fieldset>
            )}

            <div><label htmlFor="details" className={label}>Tell us about your situation</label><textarea id="details" name="details" required rows={5} className={input} placeholder="Describe the need and why you are applying. Include any relevant details that will help us assess your application." /></div>

            <div className="grid gap-4 sm:grid-cols-2">
              {category === "ORPHANAGE" && (
                <div>
                  <label htmlFor="photo" className={label}>Applicant photo</label>
                  <input id="photo" name="photo" type="file" accept="image/*" className="mt-1.5 block w-full text-sm text-brand-900/70 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700" />
                  <p className="mt-1 text-xs text-brand-900/50">A clear photo of the applicant. Image, max 10MB.</p>
                </div>
              )}
              <div>
                <label htmlFor="document" className={label}>Supporting document <span className="text-brand-400">— optional</span></label>
                <input id="document" name="document" type="file" accept="image/*,application/pdf" className="mt-1.5 block w-full text-sm text-brand-900/70 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700" />
                <p className="mt-1 text-xs text-brand-900/50">e.g. result slip, ID, letter. PDF or image, max 10MB.</p>
              </div>
            </div>

            {collectPassword && (
              <div className="grid gap-4 rounded-xl bg-brand-50 p-4 ring-1 ring-brand-100 sm:grid-cols-2">
                <p className="text-xs text-brand-900/60 sm:col-span-2">Set a password to create your account, so you can log in and track this application.</p>
                <div><label htmlFor="password" className={label}>Password</label><input id="password" name="password" type="password" minLength={6} className={input} placeholder="At least 6 characters" /></div>
                <div><label htmlFor="confirmPassword" className={label}>Confirm password</label><input id="confirmPassword" name="confirmPassword" type="password" minLength={6} className={input} placeholder="Re-enter password" /></div>
              </div>
            )}
          </div>
        </fieldset>

        {!isValidated && <p className="text-center text-sm text-brand-900/50">Validate a Referee ID above to unlock the application.</p>}
        <SubmitButton pendingText="Submitting…" disabled={!isValidated}>Submit application</SubmitButton>
      </form>
    </div>
  );
}
