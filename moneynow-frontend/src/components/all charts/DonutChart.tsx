"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import ChartLegend from "./ChartLegend";

export interface DonutChartDatum {
  label: string;
  value: number;
  color?: string;
}

interface DonutChartProps {
  data: DonutChartDatum[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
}

const DEFAULT_COLORS = ["#0F766E", "#F59E0B", "#1D4ED8", "#7C3AED"];

const formatAmount = (value: number | string) =>
  `Rs ${Number(value || 0).toLocaleString("en-IN")}`;

const getDescription = (label: string, value: number) => {
  if (label === "Principal") {
    return "This color shows the actual loan amount being repaid.";
  }
  if (label === "Interest") {
    return "This color shows the interest cost paid over the loan tenure.";
  }
  return `${label} contributes ${formatAmount(value)} to the total corpus.`;
};

export default function DonutChart({
  data,
  height = 320,
  innerRadius = 72,
  outerRadius = 108,
}: DonutChartProps) {
  const chartData = data.filter((item) => Number(item.value) > 0).map((item) => ({
    label: item.label,
    value: item.value,
    color: item.color,
  }));

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              innerRadius={innerRadius}
              nameKey="label"
              outerRadius={outerRadius}
              paddingAngle={3}
              stroke="#ffffff"
              strokeWidth={2}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`${entry.label}-${index}`}
                  fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatAmount(value as number | string)} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend
        items={chartData.map((item, index) => ({
          label: item.label,
          color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
          description: getDescription(item.label, item.value),
        }))}
      />
    </div>
  );
}
