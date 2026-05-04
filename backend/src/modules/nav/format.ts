export const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatNav = (value?: number | null) =>
  value === null || value === undefined || !Number.isFinite(value)
    ? "-"
    : value.toFixed(3);

export const formatNumber = (value?: number | null) =>
  value === null || value === undefined || !Number.isFinite(value)
    ? "-"
    : new Intl.NumberFormat("en-IN", { maximumFractionDigits: 3 }).format(value);

export const formatPercent = (value?: number | null) =>
  value === null || value === undefined || !Number.isFinite(value)
    ? "-"
    : `${(value * 100).toFixed(2)}%`;

export const toneClassForReturn = (value?: number | null) => {
  if (value === null || value === undefined) return "text-gray-600";
  if (value < 0) return "text-red-600";
  if (value > 0) return "text-emerald-600";
  return "text-gray-700";
};
