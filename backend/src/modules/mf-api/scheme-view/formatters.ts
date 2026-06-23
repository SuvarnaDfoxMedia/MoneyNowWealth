/**
 * Shared display formatters for the MF API scheme-view components.
 * All functions are pure — no side effects, no imports needed.
 */

export const fmtReturn = (val: number | null | undefined, period?: string): string => {
  if (val === null || val === undefined) return "—";
  if (val === 0 && period && ["3y", "5y", "10y"].includes(period)) return "—";
  return `${val.toFixed(2)}%`;
};

export const returnColorClass = (val: number | null | undefined, period?: string): string => {
  if (val === null || val === undefined) return "text-gray-400";
  if (val === 0 && period && ["3y", "5y", "10y"].includes(period)) return "text-gray-400";
  if (val > 0) return "text-green-600 font-medium";
  if (val < 0) return "text-red-600 font-medium";
  return "text-gray-600";
};

export const fmtCurrency = (val: number | null | undefined): string => {
  if (val === null || val === undefined) return "—";
  if (val >= 1e7) return `₹${(val / 1e7).toFixed(2)} Cr`;
  if (val >= 1e5) return `₹${(val / 1e5).toFixed(2)} L`;
  return `₹${val.toLocaleString("en-IN")}`;
};

export const fmtDate = (d: string | null | undefined): string => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
};

export const fmtPct = (val: number | null | undefined, decimals = 2): string => {
  if (val === null || val === undefined) return "—";
  return `${val.toFixed(decimals)}%`;
};
