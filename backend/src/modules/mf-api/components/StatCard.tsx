type StatCardProps = {
  label: string;
  value: string;
  meta?: string;
  tone?: "neutral" | "positive" | "negative";
};

const toneClasses = {
  neutral: "text-gray-900",
  positive: "text-emerald-600",
  negative: "text-red-600",
};

export default function StatCard({
  label,
  value,
  meta,
  tone = "neutral",
}: StatCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`mt-3 text-2xl font-semibold ${toneClasses[tone]}`}>{value}</p>
      {meta ? <p className="mt-2 text-sm text-gray-500">{meta}</p> : null}
    </div>
  );
}
