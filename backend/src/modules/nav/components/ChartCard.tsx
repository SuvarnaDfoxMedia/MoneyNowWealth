import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import type { NavHistoryItem } from "../types";
import { formatDate } from "../format";

type ChartCardProps = {
  title: string;
  data: NavHistoryItem[];
  loading?: boolean;
};

export default function ChartCard({ title, data, loading = false }: ChartCardProps) {
  const sorted = [...data].sort(
    (left, right) => new Date(left.date).getTime() - new Date(right.date).getTime(),
  );

  const options: ApexOptions = {
    chart: {
      type: "line",
      toolbar: { show: false },
      fontFamily: "Outfit, sans-serif",
    },
    colors: ["#043f79"],
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 3 },
    markers: { size: 0, hover: { size: 5 } },
    grid: { borderColor: "#eef2f7" },
    xaxis: {
      categories: sorted.map((item) => formatDate(item.date)),
      labels: { rotate: -35, style: { fontSize: "11px" } },
    },
    yaxis: {
      labels: {
        formatter: (value) => value.toFixed(3),
        style: { colors: ["#6b7280"], fontSize: "12px" },
      },
    },
    tooltip: {
      y: { formatter: (value) => value.toFixed(3) },
    },
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      </div>
      {loading ? (
        <div className="flex h-[320px] items-center justify-center text-sm text-gray-500">
          Loading chart...
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex h-[320px] items-center justify-center text-sm text-gray-500">
          No NAV data available
        </div>
      ) : (
        <Chart
          options={options}
          series={[{ name: "NAV", data: sorted.map((item) => item.nav) }]}
          type="line"
          height={320}
        />
      )}
    </div>
  );
}
