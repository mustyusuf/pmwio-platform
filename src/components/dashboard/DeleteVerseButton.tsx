"use client";

import { deleteVerse } from "@/app/actions/quran";

/** Removing a verse with recitations cascades — those Recitation rows (and
 * the affected members' leaderboard credit for them) are deleted too. Warn
 * before that happens; deletion with zero recitations needs no confirmation. */
export function DeleteVerseButton({ id, recitationCount }: { id: string; recitationCount: number }) {
  return (
    <form
      action={deleteVerse}
      onSubmit={(e) => {
        if (recitationCount === 0) return;
        const ok = window.confirm(
          `${recitationCount} member${recitationCount === 1 ? "" : "s"} already recited this verse. Removing it permanently deletes ${recitationCount === 1 ? "that recitation" : "those recitations"} too, lowering their leaderboard totals. Remove anyway?`,
        );
        if (!ok) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50">
        Remove
      </button>
    </form>
  );
}
