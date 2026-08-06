"use client";

import { useState } from "react";
import { DataTable, type Column, type Row } from "@/components/dashboard/DataTable";

export type LeaderboardTab = {
  key: string;
  label: string;
  countLabel: string;
  rows: Row[];
  emptyText: string;
};

const baseColumns: Column[] = [
  { key: "rank", header: "Rank" },
  { key: "name", header: "Member" },
  { key: "userId", header: "User ID", type: "mono" },
];

/** Tab toggle over the three Qur'an Challenge leaderboards — one paginated
 * table visible at a time, instead of cramming them side by side. */
export function QuranLeaderboardTabs({ tabs }: { tabs: LeaderboardTab[] }) {
  const [activeKey, setActiveKey] = useState(tabs[0]?.key);
  const tab = tabs.find((t) => t.key === activeKey) ?? tabs[0];
  if (!tab) return null;

  return (
    <div className="space-y-4">
      <div className="inline-flex flex-wrap gap-1 rounded-xl border border-brand-200 bg-white p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveKey(t.key)}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
              t.key === tab.key ? "bg-brand-700 text-white" : "text-brand-700 hover:bg-brand-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <DataTable
        columns={[...baseColumns, { key: "count", header: tab.countLabel, align: "right" }]}
        rows={tab.rows}
        searchKeys={["name", "userId"]}
        searchPlaceholder="Search members…"
        emptyText={tab.emptyText}
      />
    </div>
  );
}
