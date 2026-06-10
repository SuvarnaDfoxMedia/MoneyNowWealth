"use client";

import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartLegend from "./ChartLegend";

export interface LineChartDatum {
  label: string;
  withdrawal: number;
  balance: number;
}

interface LineChartProps {
  data: LineChartDatum[];
  height?: number;
}

const formatAmount = (value: number | string) =>
  `Rs ${Number(value || 0).toLocaleString("en-IN")}`;

export default function LineChart({
  data,
  height = 340,
}: LineChartProps) {
  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <RechartsLineChart data={data}>
            <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
            <Tooltip formatter={(value) => formatAmount(value as number | string)} />
            <Line
              dataKey="withdrawal"
              dot={false}
              stroke="#DC2626"
              strokeWidth={3}
              type="monotone"
            />
            <Line
              dataKey="balance"
              dot={false}
              stroke="#16A34A"
              strokeWidth={3}
              type="monotone"
            />
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend
        items={[
          {
            label: "Withdrawal",
            color: "#DC2626",
            description:
              "Shows the cumulative withdrawal movement across the selected SWP period.",
          },
          {
            label: "Remaining Balance",
            color: "#16A34A",
            description: "Shows the projected corpus balance left after withdrawals.",
          },
        ]}
      />
    </div>
  );
}
