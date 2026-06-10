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

export interface StackedBarLineChartDatum {
  label: string;
  invested: number;
  growth: number;
  totalValue?: number;
}

interface StackedBarLineChartProps {
  data: StackedBarLineChartDatum[];
  height?: number;
}

const formatAmount = (value: number | string) =>
  `Rs ${Number(value || 0).toLocaleString("en-IN")}`;

export default function StackedBarLineChart({
  data,
  height = 320,
}: StackedBarLineChartProps) {
  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <ComposedChart data={data}>
            <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
            <Tooltip formatter={(value) => formatAmount(value as number | string)} />
            <Bar dataKey="invested" fill="#2563EB" radius={[0, 0, 6, 6]} stackId="a" />
            <Bar dataKey="growth" fill="#34A853" radius={[6, 6, 0, 0]} stackId="a" />
            <Line
              dataKey="totalValue"
              dot={{ r: 3, fill: "#FB923C" }}
              stroke="#FB923C"
              strokeWidth={3}
              type="monotone"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend
        items={[
          {
            label: "Invested Amount",
            color: "#2563EB",
            description:
              "Shows the total contribution built up across the selected time period.",
          },
          {
            label: "Growth",
            color: "#34A853",
            description: "Shows the returns earned on top of the invested SIP amount.",
          },
          {
            label: "Total SIP Value",
            color: "#FB923C",
            description:
              "Shows the combined future value of invested amount plus growth.",
          },
        ]}
      />
    </div>
  );
}
