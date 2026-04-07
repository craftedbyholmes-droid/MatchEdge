"use client";

import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export function PerformanceChart({
  rows,
}: {
  rows: Array<{
    label: string;
    stakedTotal: number;
    returnedTotal: number;
  }>;
}) {
  return (
    <div className="h-[320px] rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-3 text-lg font-semibold">Performance Overview</div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="stakedTotal" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="returnedTotal" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}