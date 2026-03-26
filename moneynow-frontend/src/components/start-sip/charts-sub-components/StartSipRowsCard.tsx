"use client";

interface RowItem {
  label: string;
  value: string;
}

interface StartSipRowsCardProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  rows: RowItem[];
}

export default function StartSipRowsCard({
  eyebrow,
  title,
  subtitle,
  rows,
}: StartSipRowsCardProps) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-[#0A4A86]">
            {eyebrow}
          </p>
          <h3 className="text-2xl font-bold text-slate-900 mt-2 font-poppins">
            {title}
          </h3>
        </div>
        {subtitle ? (
          <span className="text-sm text-slate-500">{subtitle}</span>
        ) : null}
      </div>

      <div className="divide-y divide-slate-100">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[1fr_auto] gap-4 py-4 text-sm"
          >
            <span className="text-slate-600">{row.label}</span>
            <span className="font-semibold text-slate-900 text-right break-words">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
