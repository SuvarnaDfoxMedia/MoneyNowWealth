import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { axiosApi } from "../../api/axios";

type CategoryOption = {
  _id: string;
  name: string;
  category_returns?: {
    trailing?: Record<string, number | null>;
    annual?: { ytd?: number | null; yearly_returns?: Record<string, number | null> };
    ytd?: number | null;
    ytd_return?: number | null;
    since_launch?: number | null;
    inception_year_return?: number | null;
  };
  category_average_returns?: {
    trailing?: Record<string, number | null>;
    annual?: { ytd?: number | null; yearly_returns?: Record<string, number | null> };
    ytd?: number | null;
    ytd_return?: number | null;
    since_launch?: number | null;
    inception_year_return?: number | null;
  };
};
type FundOption = {
  _id: string;
  fund_name: string;
  category_id?: string | null;
  benchmark_id?: string;
  returns?: {
    trailing?: Record<string, number | null>;
    annual?: { ytd?: number | null; yearly_returns?: Record<string, number | null> };
    d1?: number | null;
    w1?: number | null;
    m1?: number | null;
    m3?: number | null;
    m6?: number | null;
    ytd?: number | null;
    y1?: number | null;
    y2?: number | null;
    y3_cagr?: number | null;
    y5_cagr?: number | null;
    y10_cagr?: number | null;
    since_inception?: number | null;
  };
};
type BenchmarkOption = { _id: string; name: string; category_id?: string };
type BenchmarkReturnRow = {
  benchmark_id?: string;
  benchmark_name?: string;
  category_id?: string;
  date: string;
  trailing?: Record<string, number | null>;
  annual?: { ytd?: number | null; yearly_returns?: Record<string, number | null> };
  return_1d?: number | null;
  return_1w?: number | null;
  return_1m?: number | null;
  return_3m?: number | null;
  return_6m?: number | null;
  return_ytd?: number | null;
  return_1y?: number | null;
  return_2y?: number | null;
  return_3y?: number | null;
  return_5y?: number | null;
  return_10y?: number | null;
  return_since_inception?: number | null;
  ytd?: number | null;
  ytd_return?: number | null;
  since_launch?: number | null;
  inception_year_return?: number | null;
};

type ComparisonMode =
  | "benchmark-vs-benchmark"
  | "benchmark-vs-category"
  | "benchmark-vs-funds"
  | "category-vs-category"
  | "category-vs-fund"
  | "funds-vs-funds";

type SeriesPoint = {
  label: string;
  d1: number | null;
  w1: number | null;
  m1: number | null;
  m3: number | null;
  m6: number | null;
  ytd: number | null;
  y1: number | null;
  y2: number | null;
  y3: number | null;
  y5: number | null;
  y10: number | null;
  si: number | null;
};

const PERIODS: Array<{ key: keyof Omit<SeriesPoint, "label">; label: string }> = [
  { key: "d1", label: "1D" },
  { key: "w1", label: "1W" },
  { key: "m1", label: "1M" },
  { key: "m3", label: "3M" },
  { key: "m6", label: "6M" },
  { key: "ytd", label: "YTD" },
  { key: "y1", label: "1Y" },
  { key: "y2", label: "2Y" },
  { key: "y3", label: "3Y" },
  { key: "y5", label: "5Y" },
  { key: "y10", label: "10Y" },
  { key: "si", label: "SI" },
];

const emptySeries = (label: string): SeriesPoint => ({
  label,
  d1: null,
  w1: null,
  m1: null,
  m3: null,
  m6: null,
  ytd: null,
  y1: null,
  y2: null,
  y3: null,
  y5: null,
  y10: null,
  si: null,
});

const asNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const extractId = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const maybe = value as { _id?: unknown; id?: unknown; $oid?: unknown };
    if (typeof maybe._id === "string") return maybe._id;
    if (typeof maybe.id === "string") return maybe.id;
    if (typeof maybe.$oid === "string") return maybe.$oid;
  }
  return String(value);
};

const fromBenchmarkRow = (label: string, row?: BenchmarkReturnRow): SeriesPoint => ({
  label,
  d1: asNumber(row?.return_1d),
  w1: asNumber(row?.trailing?.["1w"] ?? row?.return_1w),
  m1: asNumber(row?.trailing?.["1m"] ?? row?.return_1m),
  m3: asNumber(row?.trailing?.["3m"] ?? row?.return_3m),
  m6: asNumber(row?.trailing?.["6m"] ?? row?.return_6m),
  ytd: asNumber(row?.annual?.ytd ?? row?.trailing?.ytd ?? row?.return_ytd ?? row?.ytd ?? row?.ytd_return),
  y1: asNumber(row?.trailing?.["1y"] ?? row?.return_1y),
  y2: asNumber(row?.trailing?.["2y"] ?? row?.return_2y),
  y3: asNumber(row?.trailing?.["3y"] ?? row?.return_3y),
  y5: asNumber(row?.trailing?.["5y"] ?? row?.return_5y),
  y10: asNumber(row?.trailing?.["10y"] ?? row?.return_10y),
  si: asNumber(row?.trailing?.since_launch ?? row?.return_since_inception),
});

const fromFund = (label: string, fund?: FundOption): SeriesPoint => ({
  label,
  d1: asNumber(fund?.returns?.d1),
  w1: asNumber(fund?.returns?.trailing?.["1w"] ?? fund?.returns?.w1),
  m1: asNumber(fund?.returns?.trailing?.["1m"] ?? fund?.returns?.m1),
  m3: asNumber(fund?.returns?.trailing?.["3m"] ?? fund?.returns?.m3),
  m6: asNumber(fund?.returns?.trailing?.["6m"] ?? fund?.returns?.m6),
  ytd: asNumber(fund?.returns?.annual?.ytd ?? fund?.returns?.ytd),
  y1: asNumber(fund?.returns?.trailing?.["1y"] ?? fund?.returns?.y1),
  y2: asNumber(fund?.returns?.trailing?.["2y"] ?? fund?.returns?.y2),
  y3: asNumber(fund?.returns?.trailing?.["3y"] ?? fund?.returns?.y3_cagr),
  y5: asNumber(fund?.returns?.trailing?.["5y"] ?? fund?.returns?.y5_cagr),
  y10: asNumber(fund?.returns?.trailing?.["10y"] ?? fund?.returns?.y10_cagr),
  si: asNumber(fund?.returns?.trailing?.since_launch ?? fund?.returns?.since_inception),
});

const fromCategory = (label: string, category?: CategoryOption): SeriesPoint => {
  const source = category?.category_returns || category?.category_average_returns || {};
  return {
    label,
    d1: null,
    w1: asNumber(source?.trailing?.["1w"]),
    m1: asNumber(source?.trailing?.["1m"]),
    m3: asNumber(source?.trailing?.["3m"]),
    m6: asNumber(source?.trailing?.["6m"]),
    ytd: asNumber(source?.annual?.ytd ?? source?.trailing?.ytd ?? source?.ytd ?? source?.ytd_return),
    y1: asNumber(source?.trailing?.["1y"]),
    y2: asNumber(source?.trailing?.["2y"]),
    y3: asNumber(source?.trailing?.["3y"]),
    y5: asNumber(source?.trailing?.["5y"]),
    y10: asNumber(source?.trailing?.["10y"]),
    si: asNumber(source?.trailing?.since_launch ?? source?.since_launch ?? source?.inception_year_return),
  };
};

const latestByBenchmark = (rows: BenchmarkReturnRow[]) => {
  const map = new Map<string, BenchmarkReturnRow>();
  rows.forEach((row) => {
    const id = extractId(row.benchmark_id);
    if (!id) return;
    const previous = map.get(id);
    if (!previous || new Date(row.date).getTime() > new Date(previous.date).getTime()) {
      map.set(id, row);
    }
  });
  return [...map.values()];
};

const normalize = (value: string) => value.trim().toLowerCase();

const averageSeries = (label: string, rows: SeriesPoint[]): SeriesPoint => {
  const output = emptySeries(label);
  PERIODS.forEach(({ key }) => {
    const values = rows.map((row) => row[key]).filter((value): value is number => value !== null);
    output[key] = values.length ? Number((values.reduce((sum, item) => sum + item, 0) / values.length).toFixed(2)) : null;
  });
  return output;
};

export default function MFBenchmarkViewComparisonPage() {
  const { role = "admin" } = useParams();
  const [mode, setMode] = useState<ComparisonMode>("benchmark-vs-benchmark");
  const [loading, setLoading] = useState(false);
  const [benchmarks, setBenchmarks] = useState<BenchmarkOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [funds, setFunds] = useState<FundOption[]>([]);
  const [returnsRows, setReturnsRows] = useState<BenchmarkReturnRow[]>([]);
  const [categoryDetailsById, setCategoryDetailsById] = useState<Record<string, CategoryOption>>({});

  const [benchmarkA, setBenchmarkA] = useState("");
  const [benchmarkB, setBenchmarkB] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [categoryA, setCategoryA] = useState("");
  const [categoryB, setCategoryB] = useState("");
  const [categoryForFund, setCategoryForFund] = useState("");
  const [fundId, setFundId] = useState("");
  const [fundA, setFundA] = useState("");
  const [fundB, setFundB] = useState("");
  const [fundDetailsById, setFundDetailsById] = useState<Record<string, FundOption>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [filterRes, categoriesRes, fundsRes, returnsRes] = await Promise.all([
          axiosApi.get<any>(`/${role}/mf/benchmark/filters`),
          axiosApi.get<any>(`/${role}/mf/categories`, { page: 1, limit: 5000 }),
          axiosApi.get<any>(`/${role}/mf/funds`, { page: 1, limit: 5000 }),
          axiosApi.get<any>(`/${role}/mf/benchmark/returns`, { page: 1, limit: 5000 }),
        ]);
        if (cancelled) return;
        const filterData = filterRes?.data || {};
        setBenchmarks(Array.isArray(filterData.benchmarks) ? filterData.benchmarks : []);
        setCategories(Array.isArray(categoriesRes?.data) ? categoriesRes.data : []);
        setFunds(Array.isArray(fundsRes?.data) ? fundsRes.data : []);
        const returnsPayload = returnsRes?.data || {};
        setReturnsRows(
          Array.isArray(returnsPayload?.data) ? returnsPayload.data : [],
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [role]);

  const tabItems: Array<{ id: ComparisonMode; label: string }> = [
    { id: "benchmark-vs-benchmark", label: "Benchmark vs Benchmark" },
    { id: "benchmark-vs-category", label: "Benchmark vs Category" },
    { id: "benchmark-vs-funds", label: "Benchmark vs Funds" },
    { id: "category-vs-category", label: "Category vs Category" },
    { id: "category-vs-fund", label: "Category vs Fund" },
    { id: "funds-vs-funds", label: "Funds vs Funds" },
  ];

  const benchmarkById = useMemo(
    () => new Map(benchmarks.map((item) => [item._id, item])),
    [benchmarks],
  );
  const categoryById = useMemo(
    () => new Map(categories.map((item) => [item._id, item])),
    [categories],
  );
  const fundById = useMemo(() => new Map(funds.map((item) => [item._id, item])), [funds]);

  const latestRows = useMemo(() => latestByBenchmark(returnsRows), [returnsRows]);

  useEffect(() => {
    const ids = [fundId, fundA, fundB].filter(Boolean);
    const missingIds = ids.filter((id) => !fundDetailsById[id]);
    if (missingIds.length === 0) return;
    let cancelled = false;
    (async () => {
      const results = await Promise.all(
        missingIds.map(async (id) => {
          try {
            const res: any = await axiosApi.get(`/${role}/mf/funds/${id}`);
            return [id, (res?.data || null) as FundOption | null] as const;
          } catch {
            return [id, null] as const;
          }
        }),
      );
      if (cancelled) return;
      setFundDetailsById((prev) => {
        const next = { ...prev };
        results.forEach(([id, detail]) => {
          if (detail) next[id] = detail;
        });
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [role, fundId, fundA, fundB, fundDetailsById]);

  useEffect(() => {
    const ids = [categoryName, categoryA, categoryB, categoryForFund].filter(Boolean);
    const missingIds = ids.filter((id) => !categoryDetailsById[id]);
    if (missingIds.length === 0) return;

    let cancelled = false;
    (async () => {
      const results = await Promise.all(
        missingIds.map(async (id) => {
          try {
            const res: any = await axiosApi.get(`/${role}/mf/categories/${id}`);
            return [id, (res?.data || null) as CategoryOption | null] as const;
          } catch {
            return [id, null] as const;
          }
        }),
      );
      if (cancelled) return;
      setCategoryDetailsById((prev) => {
        const next = { ...prev };
        results.forEach(([id, detail]) => {
          if (detail) next[id] = detail;
        });
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [role, categoryName, categoryA, categoryB, categoryForFund, categoryDetailsById]);

  const findBenchmarkRow = (benchmarkId: string) => {
    const byId = latestRows.find((item) => extractId(item.benchmark_id) === benchmarkId);
    if (byId) return byId;
    const selectedBenchmarkName = benchmarkById.get(benchmarkId)?.name || "";
    if (!selectedBenchmarkName) return undefined;
    return latestRows.find(
      (item) => normalize(item.benchmark_name || "") === normalize(selectedBenchmarkName),
    );
  };

  const leftRightSeries = useMemo((): { left: SeriesPoint; right: SeriesPoint } => {
    if (mode === "benchmark-vs-benchmark") {
      const rowA = findBenchmarkRow(benchmarkA);
      const rowB = findBenchmarkRow(benchmarkB);
      return {
        left: fromBenchmarkRow(benchmarkById.get(benchmarkA)?.name || "Benchmark A", rowA),
        right: fromBenchmarkRow(benchmarkById.get(benchmarkB)?.name || "Benchmark B", rowB),
      };
    }
    if (mode === "benchmark-vs-category") {
      const rowA = findBenchmarkRow(benchmarkA);
      const selectedCategory = categoryDetailsById[categoryName] || categoryById.get(categoryName);
      return {
        left: fromBenchmarkRow(benchmarkById.get(benchmarkA)?.name || "Benchmark", rowA),
        right: fromCategory(selectedCategory?.name || "Category", selectedCategory),
      };
    }
    if (mode === "benchmark-vs-funds") {
      const rowA = findBenchmarkRow(benchmarkA);
      const rightFund = fundDetailsById[fundId] || fundById.get(fundId);
      return {
        left: fromBenchmarkRow(benchmarkById.get(benchmarkA)?.name || "Benchmark", rowA),
        right: fromFund(rightFund?.fund_name || "Fund", rightFund),
      };
    }
    if (mode === "category-vs-category") {
      const leftCategory = categoryDetailsById[categoryA] || categoryById.get(categoryA);
      const rightCategory = categoryDetailsById[categoryB] || categoryById.get(categoryB);
      return {
        left: fromCategory(leftCategory?.name || "Category A", leftCategory),
        right: fromCategory(rightCategory?.name || "Category B", rightCategory),
      };
    }
    if (mode === "category-vs-fund") {
      const leftCategory = categoryDetailsById[categoryForFund] || categoryById.get(categoryForFund);
      const rightFund = fundDetailsById[fundId] || fundById.get(fundId);
      return {
        left: fromCategory(leftCategory?.name || "Category", leftCategory),
        right: fromFund(rightFund?.fund_name || "Fund", rightFund),
      };
    }
    const leftFund = fundDetailsById[fundA] || fundById.get(fundA);
    const rightFund = fundDetailsById[fundB] || fundById.get(fundB);
    return {
      left: fromFund(leftFund?.fund_name || "Fund A", leftFund),
      right: fromFund(rightFund?.fund_name || "Fund B", rightFund),
    };
  }, [mode, latestRows, benchmarkA, benchmarkB, categoryName, fundId, fundA, fundB, categoryA, categoryB, categoryForFund, benchmarkById, categoryById, fundById, fundDetailsById, benchmarks, funds]);

  const chartOptions: ApexOptions = useMemo(
    () => ({
      chart: { type: "bar", toolbar: { show: false }, fontFamily: "Outfit, sans-serif" },
      colors: ["#043f79", "#0ea5e9"],
      plotOptions: { bar: { horizontal: false, borderRadius: 4, columnWidth: "50%" } },
      dataLabels: { enabled: false },
      xaxis: { categories: PERIODS.map((item) => item.label) },
      yaxis: { labels: { formatter: (value) => `${value.toFixed(2)}%` } },
      tooltip: { y: { formatter: (value) => `${value.toFixed(2)}%` } },
      legend: { position: "top" },
      grid: { borderColor: "#eef2f7" },
    }),
    [],
  );

  const chartSeries = useMemo(
    () => [
      {
        name: leftRightSeries.left.label,
        data: PERIODS.map(({ key }) => leftRightSeries.left[key]),
      },
      {
        name: leftRightSeries.right.label,
        data: PERIODS.map(({ key }) => leftRightSeries.right[key]),
      },
    ],
    [leftRightSeries],
  );

  const hasChartData = useMemo(
    () =>
      chartSeries.some((series) =>
        series.data.some((value) => typeof value === "number" && Number.isFinite(value)),
      ),
    [chartSeries],
  );

  const leftOneYear = leftRightSeries.left.y1;
  const rightOneYear = leftRightSeries.right.y1;
  const deltaOneYear =
    leftOneYear !== null && rightOneYear !== null
      ? Number((leftOneYear - rightOneYear).toFixed(2))
      : null;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mb-5 rounded-lg border border-gray-200 bg-white px-5 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-800">Benchmark View Comparison</h1>
      </div>

      <section className="rounded-lg bg-white p-4 shadow-sm">
        <div className="grid items-start gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="overflow-hidden rounded-[10px] border border-[#D8D8D8] bg-white">
            {tabItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setMode(item.id)}
                className={`block w-full border-b border-[#E1E1E1] p-[14px] text-left text-[15px] leading-[24px] transition-colors ${
                  mode === item.id
                    ? "bg-[#0B3B6E] text-white"
                    : "bg-white text-[#1A1A1A] hover:bg-slate-50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </aside>

          <div className="min-h-[520px]">
            <h2 className="text-[22px] font-medium text-gray-900">
              {tabItems.find((item) => item.id === mode)?.label}
            </h2>

            <div className="mt-5 rounded-[8px] border border-[#D8D8D8] bg-[#FAFAFA] p-5">
              {mode === "benchmark-vs-benchmark" && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <SelectField label="Benchmark A" value={benchmarkA} onChange={setBenchmarkA} options={benchmarks.map((item) => ({ value: item._id, label: item.name }))} />
                  <SelectField label="Benchmark B" value={benchmarkB} onChange={setBenchmarkB} options={benchmarks.map((item) => ({ value: item._id, label: item.name }))} />
                </div>
              )}
              {mode === "benchmark-vs-category" && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <SelectField label="Benchmark" value={benchmarkA} onChange={setBenchmarkA} options={benchmarks.map((item) => ({ value: item._id, label: item.name }))} />
                  <SelectField label="Category" value={categoryName} onChange={setCategoryName} options={categories.map((item) => ({ value: item._id, label: item.name }))} />
                </div>
              )}
              {mode === "benchmark-vs-funds" && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <SelectField label="Benchmark" value={benchmarkA} onChange={setBenchmarkA} options={benchmarks.map((item) => ({ value: item._id, label: item.name }))} />
                  <SelectField label="Fund" value={fundId} onChange={setFundId} options={funds.map((item) => ({ value: item._id, label: item.fund_name }))} />
                </div>
              )}
              {mode === "category-vs-category" && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <SelectField
                    label="Category A"
                    value={categoryA}
                    onChange={setCategoryA}
                    options={categories.map((item) => ({
                      value: item._id,
                      label: item.name,
                    }))}
                  />
                  <SelectField
                    label="Category B"
                    value={categoryB}
                    onChange={setCategoryB}
                    options={categories.map((item) => ({
                      value: item._id,
                      label: item.name,
                    }))}
                  />
                </div>
              )}
              {mode === "category-vs-fund" && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <SelectField
                    label="Category"
                    value={categoryForFund}
                    onChange={setCategoryForFund}
                    options={categories.map((item) => ({
                      value: item._id,
                      label: item.name,
                    }))}
                  />
                  <SelectField
                    label="Fund"
                    value={fundId}
                    onChange={setFundId}
                    options={funds.map((item) => ({
                      value: item._id,
                      label: item.fund_name,
                    }))}
                  />
                </div>
              )}
              {mode === "funds-vs-funds" && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <SelectField label="Fund A" value={fundA} onChange={setFundA} options={funds.map((item) => ({ value: item._id, label: item.fund_name }))} />
                  <SelectField label="Fund B" value={fundB} onChange={setFundB} options={funds.map((item) => ({ value: item._id, label: item.fund_name }))} />
                </div>
              )}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <StatCard label="Left (1Y)" value={leftOneYear === null ? "—" : `${leftOneYear.toFixed(2)}%`} />
              <StatCard label="Right (1Y)" value={rightOneYear === null ? "—" : `${rightOneYear.toFixed(2)}%`} />
              <StatCard label="Delta (Left-Right)" value={deltaOneYear === null ? "—" : `${deltaOneYear.toFixed(2)}%`} />
            </div>

            <div className="mt-5 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              {loading ? (
                <div className="flex h-[360px] items-center justify-center text-sm text-gray-500">
                  Loading comparison data...
                </div>
              ) : !hasChartData ? (
                <div className="flex h-[360px] items-center justify-center text-sm text-gray-500">
                  No comparable return data found for the current selection.
                </div>
              ) : (
                <Chart options={chartOptions} series={chartSeries as any} type="bar" height={360} />
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">{label}</label>
      <select
        className="h-11 w-full rounded-md border border-gray-300 bg-white px-3"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Select {label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}
