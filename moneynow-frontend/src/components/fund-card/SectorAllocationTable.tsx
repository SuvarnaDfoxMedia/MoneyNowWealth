import type { MfApiTopHoldingEntry } from "./MfApiSchemeViewTypes";

interface SectorAllocationTableProps {
  holdings: MfApiTopHoldingEntry[];
}

export default function SectorAllocationTable({
  holdings,
}: SectorAllocationTableProps) {
  // Aggregate net_assets_pct by sector
  const sectorMap: Record<string, number> = {};
  holdings.forEach((h) => {
    const sector = (h.sector || "").trim();
    if (sector && h.net_assets_pct != null) {
      sectorMap[sector] = (sectorMap[sector] || 0) + h.net_assets_pct;
    }
  });

  // Convert to array, sort descending, take top 10
  const sectorList = Object.entries(sectorMap)
    .map(([sector, pct]) => ({ sector, pct }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 10);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="bg-[#043f79] px-4 py-2.5">
        <h3 className="text-xs font-bold text-white uppercase tracking-wide">
          Sector Allocation (Top 10)
        </h3>
      </div>

      {sectorList.length === 0 ? (
        <p className="p-4 text-xs text-gray-400 text-center italic">
          No sector allocation available
        </p>
      ) : (
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="py-2 px-3 text-left text-xs text-gray-400 font-medium w-6">
                #
              </th>
              <th className="py-2 px-3 text-left text-xs text-gray-400 font-medium">
                Sector
              </th>
              <th className="py-2 px-3 text-right text-xs text-gray-400 font-medium w-16">
                Assets %
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sectorList.map((item, i) => (
              <tr
                key={item.sector}
                className={i % 2 === 1 ? "bg-gray-50/60" : "bg-white"}
              >
                <td className="py-2.5 px-3 text-xs text-gray-300">{i + 1}</td>
                <td
                  className="py-2.5 px-3 text-xs font-medium text-gray-800 max-w-[200px] truncate"
                  title={item.sector}
                >
                  {item.sector}
                </td>
                <td className="py-2.5 px-3 text-right text-xs font-bold text-gray-900">
                  {`${item.pct.toFixed(2)}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
