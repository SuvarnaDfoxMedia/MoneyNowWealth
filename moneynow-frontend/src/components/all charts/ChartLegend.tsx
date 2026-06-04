"use client";

interface ChartLegendItem {
  label: string;
  color: string;
  description?: string;
}

interface ChartLegendProps {
  items: ChartLegendItem[];
}

export default function ChartLegend({ items }: ChartLegendProps) {
  return (
    <div className="mt-4 flex flex-wrap gap-4">
      {items.map((item) => (
        <div
          key={`${item.label}-${item.color}`}
          className="flex-1 min-w-[220px] rounded-[8px] border border-slate-200 bg-slate-50 px-5 py-4"
        >
          <div className="flex items-start gap-3">
            <span
              className="mt-[5px] h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            {/* <p className="text-[18px] font-semibold leading-[26px] text-slate-900">
              {item.label}
            </p> */}
            <p className="text-[18px] font-semibold leading-[18px] text-slate-900">
           {item.label}
          </p>

          </div>
          {item.description ? (
            <p className="mt-3 text-[16px] leading-[26px] text-slate-600">
              {item.description}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}