import type { Request } from "express";

export const getAdminListQuery = (
  req: Request,
  allowedSortFields: readonly string[],
  defaultSortField = "created_at",
) => {
  const search =
    typeof req.query.search === "string" ? req.query.search.trim() : "";
  const page = Math.max(parseInt(req.query.page as string) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit as string) || 10, 1);
  const skip = (page - 1) * limit;

  const requestedSortField =
    typeof req.query.sortField === "string" && req.query.sortField.trim()
      ? req.query.sortField.trim()
      : typeof req.query.sortBy === "string" && req.query.sortBy.trim()
        ? req.query.sortBy.trim()
        : defaultSortField;

  const sortOrder =
    typeof req.query.sortOrder === "string" &&
    req.query.sortOrder.toLowerCase() === "asc"
      ? "asc"
      : "desc";

  const safeSortField = allowedSortFields.includes(requestedSortField)
    ? requestedSortField
    : defaultSortField;

  return {
    search,
    page,
    limit,
    skip,
    sort: { [safeSortField]: sortOrder === "asc" ? 1 : -1 } as Record<
      string,
      1 | -1
    >,
  };
};

export default getAdminListQuery;
