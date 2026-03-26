import React from "react";
import { FiArrowUp, FiArrowDown } from "react-icons/fi";

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  isFetching?: boolean;
  customFilters?: {
    key: keyof T | string;
    label: string;
    options: { value: string; label: string }[];
  }[];

  // Pagination
  page: number;
  totalPages: number;
  totalRecords?: number; // made optional
  recordsPerPage: number;
  onPageChange: (page: number) => void;
  onRecordsPerPageChange: (value: number) => void;

  // Search & Sort
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  sortField?: string;
  sortOrder?: "asc" | "desc";
  onSortChange?: (field: string, order: "asc" | "desc") => void;
}

function DataTableComponent<T = Record<string, unknown>>({
  columns,
  data,
  loading = false,
  isFetching = false,
  page,
  totalPages,
  totalRecords = 0, // default value
  recordsPerPage,
  onPageChange,
  onRecordsPerPageChange,
  searchValue = "",
  onSearchChange,
  sortField = "",
  sortOrder = "asc",
  onSortChange,
}: DataTableProps<T>) {
  React.useEffect(() => {
    if (loading || isFetching) return;
    if (totalPages < 1) return;
    if (page > totalPages) onPageChange(totalPages);
    if (page < 1) onPageChange(1);
  }, [page, totalPages, onPageChange, loading, isFetching]);

  const startIdx = totalRecords === 0 ? 0 : (page - 1) * recordsPerPage + 1;
  const endIdx = Math.min(startIdx + recordsPerPage - 1, totalRecords);
  const renderFallbackCell = (row: T, key: string): React.ReactNode => {
    const value = (row as Record<string, unknown>)[key];
    if (value == null) return "";
    if (React.isValidElement(value)) return value;
    if (typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch {
        return "[object]";
      }
    }
    return String(value);
  };

  const handleSort = (col: TableColumn<T>) => {
    if (!col.sortable || !onSortChange) return;
    const newOrder =
      sortField === col.key && sortOrder === "asc" ? "desc" : "asc";
    onSortChange(col.key as string, newOrder);
  };

  return (
    <div className="w-full rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
      <div className="mb-6 flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
        {/* Records Per Page */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Show</label>
          <select
            value={recordsPerPage}
            onChange={(e) => onRecordsPerPageChange(Number(e.target.value))}
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 focus:border-[#043f79] focus:outline-none"
          >
            {[5, 10, 25, 50, 100].map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-700">entries</span>
        </div>

        {/* Search */}
        {onSearchChange && (
          <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:flex-nowrap">
            <label className="whitespace-nowrap text-sm font-medium text-gray-700">
              Search:
            </label>
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Type to search..."
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-700 focus:border-[#043f79] focus:outline-none md:w-64"
            />
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-gray-700">
            <tr>
              {columns.map((col) => {
                const isSorted = sortField === col.key;
                return (
                  <th
                    key={col.key as string}
                    onClick={() => handleSort(col)}
                    className={`whitespace-nowrap border-r border-gray-200 px-4 py-3.5 text-sm font-semibold last:border-r-0
                      ${col.sortable ? "cursor-pointer hover:bg-gray-100" : "cursor-default"}
                      ${isSorted ? "bg-gray-100" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{col.label}</span>
                      {col.sortable && (
                        <span className="flex flex-col ml-2">
                          <FiArrowUp
                            className={`text-xs ${
                              isSorted && sortOrder === "asc"
                                ? "text-blue-500"
                                : "text-gray-400"
                            }`}
                          />
                          <FiArrowDown
                            className={`text-xs  ${
                              isSorted && sortOrder === "desc"
                                ? "text-blue-500"
                                : "text-gray-400"
                            }`}
                          />
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-6 text-center text-sm text-gray-500"
                >
                  Loading...
                </td>
              </tr>
            )}
            {!loading && data.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-6 text-center text-sm text-gray-500"
                >
                  No records found
                </td>
              </tr>
            )}
            {!loading &&
              data.map((row, idx) => (
                <tr
                  key={idx}
                  className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/60"} transition hover:bg-gray-100/80`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key as string}
                      className="whitespace-nowrap border-r border-gray-100 px-4 py-3 text-sm text-gray-700 last:border-r-0"
                    >
                      {col.render
                        ? col.render(row, idx)
                        : renderFallbackCell(row, col.key as string)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-5 flex flex-col items-start justify-between gap-3 text-sm text-gray-700 md:flex-row md:items-center">
        <p>
          Showing <strong>{startIdx}</strong> to <strong>{endIdx}</strong> of{" "}
          <strong>{totalRecords}</strong> entries
        </p>

        <div className="mt-1 w-full overflow-x-auto md:mt-0 md:w-auto">
          <div className="flex min-w-max items-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
            className="h-9 rounded-lg border border-gray-300 px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-100"
          >
            Prev
          </button>

          {(() => {
            const pages: (number | string)[] = [];
            if (totalPages <= 7) {
              for (let i = 1; i <= totalPages; i++) pages.push(i);
            } else {
              if (page <= 4) {
                pages.push(1, 2, 3, 4, 5, "...", totalPages);
              } else if (page >= totalPages - 3) {
                pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
              } else {
                pages.push(1, "...", page - 1, page, page + 1, "...", totalPages);
              }
            }
            return pages.map((p, i) => (
              <button
                key={i}
                disabled={p === "..."}
                onClick={() => p !== "..." && onPageChange(Number(p))}
                className={`h-9 min-w-[38px] rounded-lg border px-3 text-sm flex items-center justify-center ${
                  p === "..." 
                    ? "cursor-default border-transparent text-gray-500 bg-transparent font-bold" :
                  page === p
                    ? "border-[#043f79] bg-[#043f79] text-white"
                    : "border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
              >
                {p}
              </button>
            ));
          })()}

          <button
            disabled={page === totalPages}
            onClick={() => onPageChange(page + 1)}
            className="h-9 rounded-lg border border-gray-300 px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-100"
          >
            Next
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export const DataTable = React.memo(
  DataTableComponent,
) as typeof DataTableComponent;
