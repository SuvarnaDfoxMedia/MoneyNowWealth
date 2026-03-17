import slugify from "slugify";

export const toNumberOrNull = (value: any): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export const toDateOrNull = (value: any): Date | null => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const toBoolean = (value: any, defaultValue = false): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (["yes", "true", "1"].includes(v)) return true;
    if (["no", "false", "0"].includes(v)) return false;
  }
  if (typeof value === "number") return value === 1;
  return defaultValue;
};

export const parsePagination = (query: any) => {
  const page = Math.max(Number(query?.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query?.limit) || 10, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const buildSort = (
  sortBy: any,
  sortOrder: any,
  fallback: Record<string, 1 | -1> = { created_at: -1 },
) => {
  if (!sortBy) return fallback;
  return { [String(sortBy)]: sortOrder === "asc" ? 1 : -1 } as Record<string, 1 | -1>;
};

export const baseSlug = (value: string) =>
  slugify(value || "", { lower: true, strict: true, trim: true });
