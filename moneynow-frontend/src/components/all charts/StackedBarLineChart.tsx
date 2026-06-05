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
  xAxisDataKey?: string;
  xAxisLabel?: string;
  xAxisTickFormatter?: (value: number | string) => string;
  yAxisTickFormatter?: (value: number | string) => string;
  tooltipLabelFormatter?: (label: number | string) => string;
}

const formatAmount = (value: number | string) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

export default function StackedBarLineChart({
  data,
  height = 440,
  xAxisDataKey = "label",
  xAxisLabel,
  xAxisTickFormatter,
  yAxisTickFormatter,
  tooltipLabelFormatter,
}: StackedBarLineChartProps) {
  return (
    <div className="w-full bg-white p-4">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h3 className="text-[18px] font-semibold ">  
          Systematic Investment Plan (SIP) Growth Chart
        </h3>

        <div className="flex flex-wrap items-center gap-6 text-[16px] text-slate-600">  {/* ← was 12px */}
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#2898C2]" />
            <span>SIP Investment</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#36B056]" />
            <span>Growth</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <span className="h-[2px] w-4 bg-[#F79932]" />
              <span className="ml-[-6px] h-2 w-2 rounded-full bg-[#F79932]" />
            </div>
            <span>Total SIP Value</span>
          </div>
        </div>
      </div>

      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 10, right: 5, left: -10, bottom: 5 }}>
            <CartesianGrid stroke="#E2E8F0" strokeDasharray="0 0" vertical={false} />

            <XAxis
              dataKey={xAxisDataKey}
              axisLine={{ stroke: "#94A3B8" }}
              tickLine={{ stroke: "#94A3B8" }}
              tick={{ fontSize: 11, fill: "#475569" }}
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
              axisLine={{ stroke: "#94A3B8" }}
              tickLine={{ stroke: "#94A3B8" }}
              tick={{ fontSize: 11, fill: "#475569" }}
              tickFormatter={
                yAxisTickFormatter ||
                ((value) => {
                  const numericValue = Number(value || 0);
                  if (numericValue === 0) return "0";
                  if (numericValue >= 1000000) {
                    return `${(numericValue / 1000000).toFixed(0)}M`;
                  }
                  if (numericValue >= 1000) {
                    return `${(numericValue / 1000).toFixed(0)}k`;
                  }
                  return String(numericValue);
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
              fill="#2898C2"
              radius={[0, 0, 0, 0]}
              stackId="sipStack"
              maxBarSize={30}
            />

            <Bar
              dataKey="growth"
              fill="#36B056"
              radius={[0, 0, 0, 0]}
              stackId="sipStack"
              maxBarSize={30}
            />

            <Line
              dataKey="totalValue"
              stroke="#F79932"
              strokeWidth={2}
              dot={{ fill: "#F79932", stroke: "#F79932", r: 3 }}
              activeDot={{ r: 5 }}
              type="monotone"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ↓ mt-12 (was mt-8), font sizes bumped to 18px/16px */}
      <div className="mt-12 w-full max-w-none [&_div]:!max-w-none [&_ul]:!max-w-none [&_li]:!max-w-none [&_h4]:!text-[18px] [&_h4]:!leading-[28px] [&_strong]:!text-[18px] [&_strong]:!leading-[28px] [&_p]:!text-[18px] [&_p]:!leading-[28px] [&_span]:!text-[18px] [&_span]:!leading-[28px]">
        <ChartLegend
          items={[
            {
              label: "SIP Investment",
              color: "#2898C2",
              description: "Total principal amount systematically allocated over the chosen timeline.",
            },
            {
              label: "Growth",
              color: "#36B056",
              description: "The estimated compound interest gains realized on your capital pools.",
            },
            {
              label: "Total SIP Value",
              color: "#F79932",
              description: "The targeted comprehensive maturity projection of your asset holdings.",
            },
          ]}
        />
      </div>
    </div>
  );
}