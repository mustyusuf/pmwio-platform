"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingText,
  disabled = false,
}: {
  children: React.ReactNode;
  pendingText?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="w-full rounded-xl bg-brand-700 px-5 py-3 text-center font-semibold text-white shadow-sm transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? pendingText ?? "Please wait…" : children}
    </button>
  );
}
