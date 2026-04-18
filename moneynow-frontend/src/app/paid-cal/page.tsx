"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type FundRow = {
  fundName: string;
  oneYear: number;
  threeYear: number;
  fiveYear: number;
  inception: number;
  rank: string;
};

const useMutualFund = () => {
  const [data, setData] = useState<FundRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFund = useCallback(async ({ scheme }: { scheme: string }) => {
    setLoading(true);
    try {
      const response = await fetch(
        "https://mfapi.advisorkhoj.com/getSchemeInfoLatest" +
          "?key=42842c3f-57f9-4444-8dc8-953c1183e99b" +
          `&scheme=${encodeURIComponent(scheme)}`,
        { method: "POST" },
      );
      const json = await response.json();
      const perf = json?.scheme_performance_list?.[0];
      if (!perf) {
        setData([]);
        return;
      }

      setData([
        {
          fundName: scheme,
          oneYear: Number(perf.one_year_return ?? 0),
          threeYear: Number(perf.three_year_return ?? 0),
          fiveYear: Number(perf.five_year_return ?? 0),
          inception: Number(perf.inception_year_return ?? 0),
          rank: String(perf.category_rank_1yr ?? "N/A"),
        },
      ]);
    } catch (error) {
      console.error("Failed to fetch mutual fund data", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchFund, data, loading };
};

function MFInputs({
  scheme,
  setScheme,
}: {
  scheme: string;
  setScheme: (value: string) => void;
}) {
  return (
    <div className="mb-6">
      <label
        htmlFor="scheme"
        className="block text-sm font-medium text-gray-700"
      >
        Scheme
      </label>
      <input
        id="scheme"
        value={scheme}
        onChange={(e) => setScheme(e.target.value)}
        className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
        placeholder="Enter scheme name"
      />
    </div>
  );
}

function MFResults({ data, loading }: { data: FundRow[]; loading: boolean }) {
  if (loading) return <div className="text-gray-500">Loading data...</div>;
  if (!data.length) return <div className="text-gray-500">No data found.</div>;

  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="min-w-full border-collapse">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              Fund Name
            </th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
              1Y Return (%)
            </th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
              3Y CAGR (%)
            </th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
              5Y CAGR (%)
            </th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
              Since Inception (%)
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
              Category Rank (1Y)
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((fund, index) => (
            <tr key={index} className="border-t hover:bg-gray-50 transition">
              <td className="px-4 py-3 text-sm text-gray-800">
                {fund.fundName}
              </td>
              <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                {fund.oneYear.toFixed(2)}%
              </td>
              <td className="px-4 py-3 text-sm text-right">
                {fund.threeYear.toFixed(2)}%
              </td>
              <td className="px-4 py-3 text-sm text-right">
                {fund.fiveYear.toFixed(2)}%
              </td>
              <td className="px-4 py-3 text-sm text-right">
                {fund.inception.toFixed(2)}%
              </td>
              <td className="px-4 py-3 text-sm text-center font-semibold">
                {fund.rank}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MutualFundPage() {
  const [scheme, setScheme] = useState(
    "HDFC Balanced Advantage Fund - Growth Plan - Direct Plan",
  );

  const { fetchFund, data, loading } = useMutualFund();
  const debounceRef = useRef<number | null>(null);

  const runFetch = useCallback(() => {
    fetchFund({ scheme });
  }, [scheme, fetchFund]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(() => {
      runFetch();
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [runFetch]);

  return (
    <section className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-6">Mutual Fund Performance</h1>

      <MFInputs scheme={scheme} setScheme={setScheme} />
      <MFResults data={data} loading={loading} />
    </section>
  );
}
