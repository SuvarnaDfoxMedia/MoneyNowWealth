export const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export const formatNumber = (value?: number | string | null) => {
  if (value === null || value === undefined || value === "") return "-";
  const numericValue = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(numericValue)
    ? new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(numericValue)
    : String(value);
};

export const toTitleCase = (value?: string | null) => {
  if (!value) return "-";
  return value
    .toString()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const downloadBlob = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
};

export const safeJsonStringify = (value: unknown) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

export const getMfApiSchemeName = (
  scheme?: { schemeName?: string; scheme_name?: string } | null,
) => scheme?.schemeName || scheme?.scheme_name || "Unnamed Scheme";

export const getMfApiAmcName = (
  scheme?: { amcName?: string; amc_name?: string } | null,
) => scheme?.amcName || scheme?.amc_name || "-";

export const getMfApiSyncStatus = (
  scheme?: {
    syncStatus?: string;
    sync_status?: string;
    latest_nav?: number | string | null;
    latestNav?: number | string | null;
  } | null,
) =>
  scheme?.syncStatus ||
  scheme?.sync_status ||
  (scheme?.latest_nav !== null && scheme?.latest_nav !== undefined
    ? "success"
    : scheme?.latestNav !== null && scheme?.latestNav !== undefined
      ? "success"
      : "queued");

export const getMfApiLatestNav = (
  scheme?: { latestNav?: number | string | null; latest_nav?: number | string | null } | null,
) => scheme?.latestNav ?? scheme?.latest_nav ?? null;

export const getMfApiLatestDate = (
  scheme?: { latestDate?: string | null; latest_date?: string | null } | null,
) => scheme?.latestDate ?? scheme?.latest_date ?? null;

export const getMfApiLatestInfo = (
  scheme?: { latestInfo?: any; latest_info?: any; latest_info_raw?: any } | null,
) => scheme?.latestInfo || scheme?.latest_info || scheme?.latest_info_raw || null;
