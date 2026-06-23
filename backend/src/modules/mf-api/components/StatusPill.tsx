type StatusPillProps = {
  status?: string;
};

const statusClasses: Record<string, string> = {
  success: "bg-emerald-50 text-emerald-700",
  failed: "bg-red-50 text-red-700",
  running: "bg-amber-50 text-amber-700",
  queued: "bg-sky-50 text-sky-700",
  partial_success: "bg-indigo-50 text-indigo-700",
};

export default function StatusPill({ status }: StatusPillProps) {
  if (!status) return <span className="text-sm text-gray-400">-</span>;
  const normalized = status.toLowerCase();
  const classes = statusClasses[normalized] ?? "bg-gray-100 text-gray-700";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${classes}`}>
      {status}
    </span>
  );
}
