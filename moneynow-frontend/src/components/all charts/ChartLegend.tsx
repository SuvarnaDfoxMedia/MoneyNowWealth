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
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={`${item.label}-${item.color}`}
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <p className="text-sm font-semibold text-slate-900">{item.label}</p>
          </div>
          {item.description ? (
            <p className="mt-2 text-xs leading-5 text-slate-600">{item.description}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
