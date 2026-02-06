"use client";

import { MFRow } from "@/hooks/useMutualFund";

export default function MFResults({
  data,
  loading,
}: {
  data: MFRow[];
  loading: boolean;
}) {
  if (loading) return <p>Loading mutual fund data...</p>;
  if (!data.length) return null;

  return (
    <div className="overflow-x-auto border rounded-lg mt-6">
      <table className="min-w-full">
        <thead className="bg-gray-100 text-sm">
          <tr>
            <th className="px-4 py-3 text-left">Fund Name</th>
            <th className="px-4 py-3 text-right">1Y Return (%)</th>
            <th className="px-4 py-3 text-right">3Y CAGR (%)</th>
            <th className="px-4 py-3 text-right">5Y CAGR (%)</th>
            <th className="px-4 py-3 text-right">Since Inception (%)</th>
            <th className="px-4 py-3 text-center">Rank</th>
          </tr>
        </thead>

        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-t">
              <td className="px-4 py-3">{row.fundName}</td>
              <td className="px-4 py-3 text-right text-green-600">
                {row.oneYear.toFixed(2)}%
              </td>
              <td className="px-4 py-3 text-right">
                {row.threeYear.toFixed(2)}%
              </td>
              <td className="px-4 py-3 text-right">
                {row.fiveYear.toFixed(2)}%
              </td>
              <td className="px-4 py-3 text-right">
                {row.inception.toFixed(2)}%
              </td>
              <td className="px-4 py-3 text-center">{row.rank}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
