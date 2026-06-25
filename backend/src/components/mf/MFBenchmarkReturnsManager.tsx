import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { axiosApi } from "../../api/axios";
import { DataTable, TableColumn } from "../PagesComponent/DataTable";
import { useDataTableStore } from "../../store/dataTableStore";

type BenchmarkOption = {
  _id: string;
  name: string;
  category?: string;
  category_id?: string;
  main_category_id?: string;
};
type ReturnRow = {
  _id: string;
  benchmark_name?: string;
  date: string;
  category_name?: string;
  fund_name?: string;
  trailing?: Record<string, number | null>;
  annual?: { ytd?: number | null; yearly_returns?: Record<string, number | null> };
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
};

export default function MFBenchmarkReturnsManager() {
  const { role = "admin" } = useParams();
  const MODULE_KEY = `${role}-benchmark-returns`;
  const [benchmarks, setBenchmarks] = useState<BenchmarkOption[]>([]);
  const [selectedBenchmark, setSelectedBenchmark] = useState("");
  const [rows, setRows] = useState<ReturnRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [loadingRows, setLoadingRows] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const {
    page,
    recordsPerPage,
    setPage,
    setRecordsPerPage,
    setCurrentModule,
    cacheModuleState,
    restoreModuleState,
    markTabSwitch,
    lastAction,
  } = useDataTableStore();

  useEffect(() => {
    setCurrentModule(MODULE_KEY);
    if (lastAction === "tab-switch") setPage(1);
    else restoreModuleState(MODULE_KEY);
    setIsMounted(true);
    return () => cacheModuleState(MODULE_KEY);
  }, [
    MODULE_KEY,
    cacheModuleState,
    lastAction,
    restoreModuleState,
    setCurrentModule,
    setPage,
  ]);

  useEffect(() => {
    const currentPath = window.location.pathname;
    const storedPath = sessionStorage.getItem("lastPath");
    if (
      storedPath &&
      !storedPath.includes("/benchmark/returns") &&
      currentPath.includes("/benchmark/returns")
    ) {
      markTabSwitch();
    }
    sessionStorage.setItem("lastPath", currentPath);
  }, [markTabSwitch]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingFilters(true);
      const response: any = await axiosApi.get(`/${role}/mf/benchmark/filters`);
      if (cancelled) return;
      const payload = response?.data || {};
      setBenchmarks(Array.isArray(payload?.benchmarks) ? payload.benchmarks : []);
      setLoadingFilters(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [role]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingRows(true);
      try {
        const response: any = await axiosApi.get(
          `/${role}/mf/benchmark/returns`,
          {
            benchmark_id: selectedBenchmark || undefined,
            page,
            limit: recordsPerPage,
          },
        );
        if (cancelled) return;
        const payload = response?.data || {};
        setRows(Array.isArray(payload?.data) ? payload.data : []);
        setTotal(Number(payload?.total || 0));
        setTotalPages(Math.max(Number(payload?.totalPages || 1), 1));
      } finally {
        if (!cancelled) setLoadingRows(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    role,
    isMounted,
    selectedBenchmark,
    page,
    recordsPerPage,
  ]);

  useEffect(() => {
    setPage(1);
  }, [selectedBenchmark, recordsPerPage, setPage]);

  const annualYears = React.useMemo(() => [
    "2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017"
  ], []);

  const columns: TableColumn<ReturnRow>[] = useMemo(() => {
    const base: TableColumn<ReturnRow>[] = [
      {
        key: "benchmark_name",
        label: "Benchmark",
        render: (row) => (
          <span className="inline-block min-w-[420px]">{row.benchmark_name || "-"}</span>
        ),
      },
      {
        key: "date",
        label: "Date",
        render: (row) => new Date(row.date).toLocaleDateString("en-GB"),
      },
      { key: "1w", label: "1W", render: (row) => row?.trailing?.["1w"] ?? row.return_1w ?? "-" },
      { key: "1m", label: "1M", render: (row) => row?.trailing?.["1m"] ?? row.return_1m ?? "-" },
      { key: "3m", label: "3M", render: (row) => row?.trailing?.["3m"] ?? row.return_3m ?? "-" },
      { key: "6m", label: "6M", render: (row) => row?.trailing?.["6m"] ?? row.return_6m ?? "-" },
      { key: "ytd", label: "YTD", render: (row) => row?.annual?.ytd ?? row?.trailing?.ytd ?? row.return_ytd ?? "-" },
      { key: "1y", label: "1Y", render: (row) => row?.trailing?.["1y"] ?? row.return_1y ?? "-" },
      { key: "2y", label: "2Y", render: (row) => row?.trailing?.["2y"] ?? row.return_2y ?? "-" },
      { key: "3y", label: "3Y", render: (row) => row?.trailing?.["3y"] ?? row.return_3y ?? "-" },
      { key: "5y", label: "5Y", render: (row) => row?.trailing?.["5y"] ?? row.return_5y ?? "-" },
      { key: "10y", label: "10Y", render: (row) => row?.trailing?.["10y"] ?? row.return_10y ?? "-" },
      {
        key: "since_launch",
        label: "Since Launch",
        render: (row) => row?.trailing?.since_launch ?? row.return_since_inception ?? "-",
      },
    ];
    const yearCols = annualYears.map(
      (year): TableColumn<ReturnRow> => ({
        key: `year_${year}`,
        label: year,
        render: (row) => row?.annual?.yearly_returns?.[year] ?? "-",
      }),
    );
    return [...base, ...yearCols];
  }, [annualYears]);

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="mb-5 rounded-lg border border-gray-200 bg-white px-5 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-800">
          Benchmark Returns
        </h1>
      </div>

      <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Benchmark
            </label>
            <select
              className="h-11 w-full rounded-md border border-gray-300 px-3"
              value={selectedBenchmark}
              onChange={(event) => setSelectedBenchmark(event.target.value)}
              disabled={loadingFilters}
            >
              <option value="">All Benchmarks</option>
              {benchmarks.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        loading={loadingRows}
        page={page}
        totalPages={Math.max(totalPages, 1)}
        totalRecords={total}
        recordsPerPage={recordsPerPage}
        onPageChange={(value) => setPage(value)}
        onRecordsPerPageChange={(value) => setRecordsPerPage(value)}
      />
    </div>
  );
}
