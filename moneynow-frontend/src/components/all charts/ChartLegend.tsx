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
    <div className="mt-4 flex flex-wrap gap-3">
      {items.map((item) => (
        <div
          key={`${item.label}-${item.color}`}
          className="rounded-[8px] border border-slate-200 bg-slate-50 px-3 py-2"
        >
          <div className="flex items-center gap-3">
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <p className="text-xs font-semibold text-slate-900">{item.label}</p>
          </div>
          {item.description ? (
            <p className="mt-2 max-w-[190px] text-[11px] leading-4 text-slate-600">
              {item.description}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
