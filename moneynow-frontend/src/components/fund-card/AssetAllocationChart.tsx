import { useMemo } from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";

interface AssetAllocationChartProps {
  assetAllocation?: {
    domestic_equity_pct?: number | null;
    international_equity_pct?: number | null;
    debt_pct?: number | null;
    other_pct?: number | null;
    gold_pct?: number | null;
    cash_pct?: number | null;
  } | null;
}

const ASSET_CONFIG = [
  { key: "domestic_equity_pct",      label: "Equity",       color: "#3b82f6" },
  { key: "international_equity_pct", label: "Intl. Equity", color: "#6366f1" },
  { key: "debt_pct",                 label: "Debt",         color: "#8b5cf6" },
  { key: "cash_pct",                 label: "Cash",         color: "#10b981" },
  { key: "gold_pct",                 label: "Gold",         color: "#f59e0b" },
  { key: "other_pct",                label: "Others",       color: "#9ca3af" },
] as const;

export default function AssetAllocationChart({
  assetAllocation,
}: AssetAllocationChartProps) {
  const items = useMemo(() => {
    if (!assetAllocation) return [];
    return ASSET_CONFIG.flatMap(({ key, label, color }) => {
      const val = (assetAllocation as any)[key];
      return val != null ? [{ label, val: val as number, color }] : [];
    });
  }, [assetAllocation]);

  const chartOptions: ApexOptions = useMemo(
    () => ({
      chart: {
        type: "donut",
        fontFamily: "Inter, sans-serif",
        toolbar: { show: false },
        animations: { enabled: true, easing: "easeinout", speed: 400 },
      },
      colors: items.map((i) => i.color),
      labels: items.map((i) => i.label),
      legend: {
        position: "bottom",
        fontSize: "12px",
        fontFamily: "Inter, sans-serif",
        labels: { colors: "#374151" },
        itemMargin: { horizontal: 8, vertical: 4 },
      },
      plotOptions: {
        pie: {
          donut: {
            size: "65%",
            labels: {
              show: true,
              total: {
                show: true,
                label: "Allocation",
                fontSize: "11px",
                color: "#6b7280",
                formatter: () => "100%",
              },
            },
          },
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => `${val.toFixed(1)}%`,
        style: { fontSize: "11px", fontWeight: "600", colors: ["#fff"] },
        dropShadow: { enabled: false },
      },
      stroke: { width: 2, colors: ["#fff"] },
      tooltip: {
        y: { formatter: (val: number) => `${val.toFixed(2)}%` },
      },
    }),
    [items]
  );

  return (
    <div>
      <h2 className="text-base font-bold tracking-tight text-slate-800 mb-4">
        Asset Allocation
      </h2>

      {items.length === 0 ? (
        <p className="text-xs text-slate-400 italic py-8 text-center px-4">
          Asset allocation data is available after importing Top Holdings.
        </p>
      ) : (
        <div className="p-2">
          <Chart
            options={chartOptions}
            series={items.map((i) => i.val)}
            type="donut"
            height={260}
          />
        </div>
      )}
    </div>
  );
}
