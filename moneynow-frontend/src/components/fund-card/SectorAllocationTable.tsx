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
    <div>
      <h2 className="text-base font-bold tracking-tight text-slate-800 mb-4">
        Sector Allocation
      </h2>

      {sectorList.length === 0 ? (
        <p className="py-4 text-xs text-slate-400 text-center italic">
          No sector allocation available
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <th className="py-2 px-3 text-left w-6">
                  #
                </th>
                <th className="py-2 px-3 text-left">
                  Sector
                </th>
                <th className="py-2 px-3 text-right w-28">
                  Assets %
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sectorList.map((item, i) => (
                <tr
                  key={item.sector}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="py-2 px-3 text-xs text-slate-400 font-medium">{i + 1}</td>
                  <td
                    className="py-2 px-3 text-xs font-medium text-slate-800 max-w-[200px] truncate"
                    title={item.sector}
                  >
                    {item.sector}
                  </td>
                  <td className="py-2 px-3 text-right text-xs font-bold text-slate-900">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-12 bg-slate-100 h-1 rounded-full overflow-hidden hidden sm:block">
                        <div
                          className="bg-[#043f79] h-full rounded-full"
                          style={{ width: `${Math.min(100, Math.max(0, item.pct))}%` }}
                        />
                      </div>
                      <span className="tabular-nums">
                        {`${item.pct.toFixed(2)}%`}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
