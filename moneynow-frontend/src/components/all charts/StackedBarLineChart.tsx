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
  showLegend?: boolean;
  xAxisDataKey?: string;
  xAxisLabel?: string;
  xAxisTickFormatter?: (value: number | string) => string;
  yAxisTickFormatter?: (value: number | string) => string;
  tooltipLabelFormatter?: (label: number | string) => string;
}

const formatAmount = (value: number | string) =>
  `Rs ${Number(value || 0).toLocaleString("en-IN")}`;

export default function StackedBarLineChart({
  data,
  height = 320,
  showLegend = true,
  xAxisDataKey = "label",
  xAxisLabel,
  xAxisTickFormatter,
  yAxisTickFormatter,
  tooltipLabelFormatter,
}: StackedBarLineChartProps) {
  return (
    <div className="w-full bg-white">
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 12, right: 8, left: -10, bottom: 6 }}>
            <CartesianGrid stroke="#E8EDF3" strokeDasharray="2 3" vertical={false} />
            <XAxis
              dataKey={xAxisDataKey}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#667085" }}
              tickFormatter={xAxisTickFormatter}
              label={
                xAxisLabel
                  ? {
                      value: xAxisLabel,
                      position: "insideBottom",
                      offset: -4,
                      style: { fontSize: 12, fill: "#475569" },
                    }
                  : undefined
              }
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#667085" }}
              tickFormatter={
                yAxisTickFormatter ||
                ((value) => {
                  const numericValue = Number(value || 0);
                  if (numericValue >= 10000000) {
                    return `${(numericValue / 10000000).toFixed(1)}Cr`;
                  }
                  if (numericValue >= 100000) {
                    return `${Math.round(numericValue / 100000)}L`;
                  }
                  return `${Math.round(numericValue / 1000)}k`;
                })
              }
            />
            <Tooltip
              formatter={(value) => formatAmount(value as number | string)}
              labelFormatter={
                tooltipLabelFormatter
                  ? (label) => tooltipLabelFormatter(label)
                  : undefined
              }
            />
            <Bar
              dataKey="invested"
              fill="#2D6AE3"
              radius={[0, 0, 0, 0]}
              stackId="a"
              barSize={22}
            />
            <Bar
              dataKey="growth"
              fill="#5AB85C"
              radius={[0, 0, 0, 0]}
              stackId="a"
              barSize={22}
            />
            <Line
              dataKey="totalValue"
              dot={{ r: 2.5, fill: "#F59E0B", strokeWidth: 0 }}
              stroke="#FB923C"
              strokeWidth={2}
              type="monotone"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {showLegend ? (
        <ChartLegend
          items={[
            {
              label: "Invested Amount",
              color: "#2563EB",
            },
            {
              label: "Growth",
              color: "#34A853",
            },
            {
              label: "Total SIP Value",
              color: "#FB923C",
            },
          ]}
        />
      ) : null}
    </div>
  );
}
