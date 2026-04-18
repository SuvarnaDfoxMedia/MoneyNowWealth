"use client";

import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartLegend from "./ChartLegend";

export interface AreaChartDatum {
  label: string;
  currentSpending: number;
  projectedSavings: number;
}

interface AreaChartProps {
  data: AreaChartDatum[];
  height?: number;
}

const formatAmount = (value: number | string) =>
  `Rs ${Number(value || 0).toLocaleString("en-IN")}`;

export default function AreaChart({
  data,
  height = 320,
}: AreaChartProps) {
  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <RechartsAreaChart data={data}>
            <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
            <Tooltip formatter={(value) => formatAmount(value as number | string)} />
            <Area
              dataKey="currentSpending"
              fill="#FDBA74"
              stackId="1"
              stroke="#F97316"
              type="monotone"
            />
            <Area
              dataKey="projectedSavings"
              fill="#5EEAD4"
              stackId="1"
              stroke="#0F766E"
              type="monotone"
            />
          </RechartsAreaChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend
        items={[
          {
            label: "Current Spending",
            color: "#F97316",
            description: "Shows the spending outflow being tracked in the scenario.",
          },
          {
            label: "Projected Savings",
            color: "#0F766E",
            description:
              "Shows the savings that can build over time from reduced spending.",
          },
        ]}
      />
    </div>
  );
}
