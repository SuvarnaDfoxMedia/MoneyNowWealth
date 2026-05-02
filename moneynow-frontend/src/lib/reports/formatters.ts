export const formatCurrency = (value?: number) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

export const formatPercent = (value?: number) =>
  `${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}%`;

export const formatValue = (value?: number, isPercent = false) => {
  if (typeof value !== "number") return "—";
  return isPercent ? `${value}%` : `₹${value.toLocaleString("en-IN")}`;
};

export const formatNullable = (value: unknown, fallback = "—") =>
  value === null || value === undefined || value === "" ? fallback : String(value);
