"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartLegend from "./ChartLegend";

export interface ComparisonBarChartDatum {
  label: string;
  target?: number;
  savings?: number;
  currentCost?: number;
  futureCost?: number;
}

interface ComparisonBarChartProps {
  data: ComparisonBarChartDatum[];
  height?: number;
}

const formatAmount = (value: number | string) =>
  `Rs ${Number(value || 0).toLocaleString("en-IN")}`;

const resolveConfig = (data: ComparisonBarChartDatum[]) => {
  const hasGoalShape = data.some(
    (item) => item.target !== undefined || item.savings !== undefined,
  );

  if (hasGoalShape) {
    return {
      leftKey: "target" as const,
      rightKey: "savings" as const,
      leftLabel: "Target Amount",
      rightLabel: "Savings Progress",
      leftColor: "#1D4ED8",
      rightColor: "#14B8A6",
      leftDescription:
        "Represents the required future amount for the selected goal.",
      rightDescription:
        "Represents projected savings or accumulation against the goal.",
    };
  }

  return {
    leftKey: "currentCost" as const,
    rightKey: "futureCost" as const,
    leftLabel: "Current Education Cost",
    rightLabel: "Future Education Cost",
    leftColor: "#3B82F6",
    rightColor: "#8B5CF6",
    leftDescription:
      "Shows the present-day education amount entered for each child.",
    rightDescription:
      "Shows the inflation-adjusted education amount projected for each child.",
  };
};

export default function ComparisonBarChart({
  data,
  height = 320,
}: ComparisonBarChartProps) {
  const config = resolveConfig(data);

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <BarChart barGap={12} data={data}>
            <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
            <Tooltip formatter={(value) => formatAmount(value as number | string)} />
            <Bar dataKey={config.leftKey} fill={config.leftColor} radius={[6, 6, 0, 0]} />
            <Bar dataKey={config.rightKey} fill={config.rightColor} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend
        items={[
          {
            label: config.leftLabel,
            color: config.leftColor,
            description: config.leftDescription,
          },
          {
            label: config.rightLabel,
            color: config.rightColor,
            description: config.rightDescription,
          },
        ]}
      />
    </div>
  );
}
