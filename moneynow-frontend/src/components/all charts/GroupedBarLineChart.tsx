"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartLegend from "./ChartLegend";

export interface GroupedBarLineChartDatum {
  label: string;
  principalOutstanding: number;
  interestPaid?: number;
  principalPaid?: number;
}

interface GroupedBarLineChartProps {
  data: GroupedBarLineChartDatum[];
  height?: number;
}

const formatAmount = (value: number | string) =>
  `Rs ${Number(value || 0).toLocaleString("en-IN")}`;

export default function GroupedBarLineChart({
  data,
  height = 320,
}: GroupedBarLineChartProps) {
  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <ComposedChart data={data}>
            <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
            <Tooltip formatter={(value) => formatAmount(value as number | string)} />
            <Bar dataKey="interestPaid" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            <Bar dataKey="principalPaid" fill="#2563EB" radius={[4, 4, 0, 0]} />
            <Line
              dataKey="principalOutstanding"
              dot={false}
              stroke="#0F172A"
              strokeWidth={3}
              type="monotone"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend
        items={[
          {
            label: "Interest Paid",
            color: "#F59E0B",
            description:
              "Shows the interest portion paid during each stage of the loan journey.",
          },
          {
            label: "Principal Paid",
            color: "#2563EB",
            description: "Shows how much principal is repaid over time.",
          },
          {
            label: "Principal Outstanding",
            color: "#0F172A",
            description: "The line tracks the remaining loan balance still outstanding.",
          },
        ]}
      />
    </div>
  );
}
