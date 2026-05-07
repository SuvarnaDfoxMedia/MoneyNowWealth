import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { axiosApi } from "../../api/axios";

type MainCategoryOption = { _id: string; name: string };
type CategoryOption = { _id: string; name: string; main_category_id?: string };
type FundOption = {
  _id: string;
  fund_name: string;
  category_id?: string | null;
  category_name?: string;
  main_category_id?: string | null;
  benchmark_id?: string;
};
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
  return_1d?: number | null;
  return_1w?: number | null;
  return_1m?: number | null;
  return_3m?: number | null;
  return_6m?: number | null;
  return_ytd?: number | null;
  return_1y?: number | null;
  return_3y?: number | null;
  return_5y?: number | null;
  return_10y?: number | null;
  annual?: Record<string, number | null>;
  return_since_inception?: number | null;
};

export default function MFBenchmarkReturnsManager() {
  const { role = "admin" } = useParams();
  const [mainCategories, setMainCategories] = useState<MainCategoryOption[]>(
    [],
  );
  const [benchmarks, setBenchmarks] = useState<BenchmarkOption[]>([]);
  const [selectedMainCategory, setSelectedMainCategory] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedFund, setSelectedFund] = useState("");
  const [selectedBenchmark, setSelectedBenchmark] = useState("");
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [funds, setFunds] = useState<FundOption[]>([]);
  const [rows, setRows] = useState<ReturnRow[]>([]);
  const [allMainCategories, setAllMainCategories] = useState<
    MainCategoryOption[]
  >([]);
  const [allCategories, setAllCategories] = useState<CategoryOption[]>([]);
  const [allFunds, setAllFunds] = useState<FundOption[]>([]);
  const [allBenchmarks, setAllBenchmarks] = useState<BenchmarkOption[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [loadingRows, setLoadingRows] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const response: any = await axiosApi.get(`/${role}/mf/benchmark/filters`);
      if (cancelled) return;
      const payload = response?.data || {};
      setAllMainCategories(
        Array.isArray(payload?.mainCategories) ? payload.mainCategories : [],
      );
      setAllCategories(
        Array.isArray(payload?.categories) ? payload.categories : [],
      );
      setAllFunds(Array.isArray(payload?.funds) ? payload.funds : []);
      setAllBenchmarks(
        Array.isArray(payload?.benchmarks) ? payload.benchmarks : [],
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [role]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingFilters(true);
      try {
        const response: any = await axiosApi.get(
          `/${role}/mf/benchmark/filters`,
          {
            main_category_id: selectedMainCategory || undefined,
            category_id: selectedCategory || undefined,
            fund_id: selectedFund || undefined,
          },
        );
        if (cancelled) return;
        const payload = response?.data || {};
        setMainCategories(
          Array.isArray(payload?.mainCategories) ? payload.mainCategories : [],
        );
        setCategories(
          Array.isArray(payload?.categories) ? payload.categories : [],
        );
        setFunds(Array.isArray(payload?.funds) ? payload.funds : []);
        setBenchmarks(
          Array.isArray(payload?.benchmarks) ? payload.benchmarks : [],
        );
      } finally {
        if (!cancelled) setLoadingFilters(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [role, selectedMainCategory, selectedCategory, selectedFund]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingRows(true);
      try {
        const response: any = await axiosApi.get(
          `/${role}/mf/benchmark/returns`,
          {
            main_category_id: selectedMainCategory || undefined,
            category_id: selectedCategory || undefined,
            fund_id: selectedFund || undefined,
            benchmark_id: selectedBenchmark || undefined,
          },
        );
        if (cancelled) return;
        setRows(Array.isArray(response?.data) ? response.data : []);
      } finally {
        if (!cancelled) setLoadingRows(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    role,
    selectedMainCategory,
    selectedCategory,
    selectedFund,
    selectedBenchmark,
  ]);

  useEffect(() => {
    setSelectedCategory("");
    setSelectedFund("");
    setSelectedBenchmark("");
  }, [selectedMainCategory]);

  useEffect(() => {
    setSelectedFund("");
    setSelectedBenchmark("");
  }, [selectedCategory]);

  useEffect(() => {
    setSelectedBenchmark("");
  }, [selectedFund]);

  const filteredCategories = selectedMainCategory
    ? categories.filter(
        (item) => String(item.main_category_id || "") === selectedMainCategory,
      )
    : categories;

  const filteredFunds = selectedCategory
    ? funds.filter(
        (item) => String(item.category_id || "") === selectedCategory,
      )
    : selectedMainCategory
      ? funds.filter(
          (item) =>
            String(item.main_category_id || "") === selectedMainCategory,
        )
      : funds;

  const filteredBenchmarks = selectedFund
    ? benchmarks.filter(
        (item) =>
          item._id ===
          (funds.find((f) => f._id === selectedFund)?.benchmark_id || ""),
      )
    : selectedCategory
      ? benchmarks.filter(
          (item) => String(item.category_id || "") === selectedCategory,
        )
      : selectedMainCategory
        ? benchmarks.filter(
            (item) =>
              String(item.main_category_id || "") === selectedMainCategory,
          )
        : benchmarks;

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="mb-5 rounded-lg border border-gray-200 bg-white px-5 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-800">
          Benchmark Returns
        </h1>
      </div>

      <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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
              {(allBenchmarks.length > 0 ? allBenchmarks : filteredBenchmarks).map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Main Category
            </label>
            <select
              className="h-11 w-full rounded-md border border-gray-300 px-3"
              value={selectedMainCategory}
              onChange={(event) => setSelectedMainCategory(event.target.value)}
              disabled={loadingFilters}
            >
              <option value="">All Main Categories</option>
              {(allMainCategories.length > 0 ? allMainCategories : mainCategories).map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              className="h-11 w-full rounded-md border border-gray-300 px-3"
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              disabled={loadingFilters}
            >
              <option value="">All Categories</option>
              {(allCategories.length > 0 ? allCategories : filteredCategories).map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Fund
            </label>
            <select
              className="h-11 w-full rounded-md border border-gray-300 px-3"
              value={selectedFund}
              onChange={(event) => setSelectedFund(event.target.value)}
              disabled={loadingFilters}
            >
              <option value="">All Funds</option>
              {(allFunds.length > 0 ? allFunds : filteredFunds).map((item) => (
                <option key={item._id} value={item._id}>
                  {item.fund_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="min-w-full">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-sm">
              <th className="px-4 py-3">Benchmark</th>
              <th className="px-4 py-3">Scheme</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">1D</th>
              <th className="px-4 py-3">1W</th>
              <th className="px-4 py-3">1M</th>
              <th className="px-4 py-3">3M</th>
              <th className="px-4 py-3">6M</th>
              <th className="px-4 py-3">YTD</th>
              <th className="px-4 py-3">1Y</th>
              <th className="px-4 py-3">3Y</th>
              <th className="px-4 py-3">5Y</th>
              <th className="px-4 py-3">10Y</th>
              <th className="px-4 py-3">Since Inception</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row._id} className="border-b text-sm">
                <td className="px-4 py-3">{row.benchmark_name || "-"}</td>
                <td className="px-4 py-3">{row.fund_name || "-"}</td>
                <td className="px-4 py-3">{row.category_name || "-"}</td>
                <td className="px-4 py-3">
                  {new Date(row.date).toLocaleDateString("en-GB")}
                </td>
                <td className="px-4 py-3">{row.return_1d ?? "-"}</td>
                <td className="px-4 py-3">{row.return_1w ?? "-"}</td>
                <td className="px-4 py-3">{row.return_1m ?? "-"}</td>
                <td className="px-4 py-3">{row.return_3m ?? "-"}</td>
                <td className="px-4 py-3">{row.return_6m ?? "-"}</td>
                <td className="px-4 py-3">{row.return_ytd ?? "-"}</td>
                <td className="px-4 py-3">{row.return_1y ?? "-"}</td>
                <td className="px-4 py-3">{row.return_3y ?? "-"}</td>
                <td className="px-4 py-3">{row.return_5y ?? "-"}</td>
                <td className="px-4 py-3">{row.return_10y ?? "-"}</td>
                <td className="px-4 py-3">
                  {row.return_since_inception ?? "-"}
                </td>
              </tr>
            ))}
            {!loadingRows && rows.length === 0 && (
              <tr>
                <td
                  colSpan={15}
                  className="px-4 py-12 text-center text-sm text-gray-500"
                >
                  No benchmark data available for selected filters
                </td>
              </tr>
            )}
            {loadingRows && (
              <tr>
                <td
                  colSpan={15}
                  className="px-4 py-10 text-center text-sm text-gray-500"
                >
                  Loading benchmark data...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
