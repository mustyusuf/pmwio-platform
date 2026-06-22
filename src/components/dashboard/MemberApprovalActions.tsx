"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Check, X } from "lucide-react";
import { approveMember, rejectMember } from "@/app/actions/workflow";

type Decision = "approve" | "decline";

export function MemberApprovalActions({ userId, name }: { userId: string; name: string }) {
  const [decision, setDecision] = useState<Decision | null>(null);
  const approving = decision === "approve";

  useEffect(() => {
    if (!decision) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDecision(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [decision]);

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setDecision("approve")}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <Check className="h-4 w-4" aria-hidden />
          Approve
        </button>
        <button
          type="button"
          onClick={() => setDecision("decline")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
        >
          <X className="h-4 w-4" aria-hidden />
          Decline
        </button>
      </div>

      {decision && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setDecision(null);
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="member-decision-title"
            aria-describedby="member-decision-description"
            className="w-full max-w-md rounded-2xl border border-brand-100 bg-white p-6 shadow-2xl"
          >
            <div className={`grid h-11 w-11 place-items-center rounded-full ${approving ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
              {approving ? <Check className="h-5 w-5" aria-hidden /> : <AlertTriangle className="h-5 w-5" aria-hidden />}
            </div>
            <h2 id="member-decision-title" className="mt-4 text-lg font-bold text-brand-950">
              {approving ? "Approve member?" : "Decline member?"}
            </h2>
            <p id="member-decision-description" className="mt-2 text-sm leading-relaxed text-brand-900/65">
              {approving
                ? `${name} will be granted access to log in and use the member dashboard.`
                : `${name}'s pending registration will be permanently deleted. This action cannot be undone.`}
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDecision(null)}
                className="rounded-lg border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
              >
                Cancel
              </button>
              <form action={approving ? approveMember : rejectMember}>
                <input type="hidden" name="userId" value={userId} />
                <button
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                    approving ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {approving ? <Check className="h-4 w-4" aria-hidden /> : <X className="h-4 w-4" aria-hidden />}
                  {approving ? "Yes, approve" : "Yes, decline"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
