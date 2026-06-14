"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const BRAND = "#b01a57";
const BRAND_LIGHT = "#e84a86";
const GOLD = "#d4a017";
const PIE_COLORS = ["#b01a57", "#e84a86", "#d4a017", "#0f766e", "#7a1a42", "#f9a8c7"];

function ChartFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-brand-100 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-bold text-brand-950">{title}</h3>
      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

type Series = { name: string; value: number }[];
type MultiSeries = Record<string, string | number>[];

export function LineChartCard({
  title,
  data,
  dataKey = "value",
}: {
  title: string;
  data: Series | MultiSeries;
  dataKey?: string;
}) {
  return (
    <ChartFrame title={title}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3e3ec" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#9b8a93" />
        <YAxis tick={{ fontSize: 11 }} stroke="#9b8a93" allowDecimals={false} />
        <Tooltip />
        <Line type="monotone" dataKey={dataKey} stroke={BRAND} strokeWidth={2.5} dot={{ r: 3 }} />
      </LineChart>
    </ChartFrame>
  );
}

export function BarChartCard({
  title,
  data,
  dataKey = "value",
}: {
  title: string;
  data: Series | MultiSeries;
  dataKey?: string;
}) {
  return (
    <ChartFrame title={title}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3e3ec" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#9b8a93" />
        <YAxis tick={{ fontSize: 11 }} stroke="#9b8a93" allowDecimals={false} />
        <Tooltip />
        <Bar dataKey={dataKey} fill={BRAND_LIGHT} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartFrame>
  );
}

export function PaymentTrendCard({ title, data }: { title: string; data: MultiSeries }) {
  return (
    <ChartFrame title={title}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3e3ec" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#9b8a93" />
        <YAxis tick={{ fontSize: 11 }} stroke="#9b8a93" />
        <Tooltip />
        <Bar dataKey="disbursed" fill={GOLD} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartFrame>
  );
}

export function PieChartCard({ title, data }: { title: string; data: Series }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <ChartFrame title={title}>
      {total === 0 ? (
        <div className="grid h-full place-items-center text-sm text-brand-900/40">No data yet</div>
      ) : (
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e) => `${e.name}`}>
            {data.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      )}
    </ChartFrame>
  );
}
