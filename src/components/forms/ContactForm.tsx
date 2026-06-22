"use client";

import { useActionState } from "react";
import { CircleCheckBig, Send } from "lucide-react";
import { submitContact, type ContactState } from "@/app/actions/contact";

const label = "block text-sm font-medium text-brand-900";
const input = "mt-1.5 w-full rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm text-brand-950 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

export function ContactForm() {
  const [state, action] = useActionState<ContactState, FormData>(submitContact, null);

  if (state?.ok) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <CircleCheckBig className="mx-auto h-9 w-9 text-emerald-700" aria-hidden />
        <h3 className="mt-2 text-lg font-bold text-emerald-900">Message sent</h3>
        <p className="mt-1 text-sm text-emerald-800">Thank you for reaching out — we&apos;ll get back to you soon.</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      {state?.error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{state.error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label htmlFor="name" className={label}>Your name</label><input id="name" name="name" required className={input} /></div>
        <div><label htmlFor="email" className={label}>Email</label><input id="email" name="email" type="email" required className={input} /></div>
      </div>
      <div><label htmlFor="subject" className={label}>Subject <span className="text-brand-400">(optional)</span></label><input id="subject" name="subject" className={input} /></div>
      <div><label htmlFor="message" className={label}>Message</label><textarea id="message" name="message" required rows={5} className={input} /></div>
      <button className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-6 py-3 font-semibold text-white hover:bg-brand-800">
        <Send className="h-4 w-4" aria-hidden />
        Send message
      </button>
    </form>
  );
}
