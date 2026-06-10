"use client";

interface MetricItem {
  label: string;
  value: string;
}

interface StartSipMetricsGridProps {
  items: MetricItem[];
}

export default function StartSipMetricsGrid({
  items,
}: StartSipMetricsGridProps) {
  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200"
        >
          <p className="text-sm uppercase tracking-[0.18em] text-slate-400">
            {item.label}
          </p>
          <p className="mt-3 text-2xl font-bold text-slate-900 break-words">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
