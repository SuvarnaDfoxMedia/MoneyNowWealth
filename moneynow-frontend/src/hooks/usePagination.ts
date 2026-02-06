"use client";

import { useState, useMemo, useCallback } from "react";

interface UsePaginationProps {
  totalItems?: number;
  initialPage?: number;
  initialLimit?: number;
}

interface PaginationState {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  offset: number;
}

export const usePagination = (props: UsePaginationProps = {}) => {
  const { totalItems = 0, initialPage = 1, initialLimit = 10 } = props;

  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(totalItems);

  // Calculate derived values
  const paginationState = useMemo((): PaginationState => {
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const offset = (currentPage - 1) * limit;
    const hasNextPage = currentPage < totalPages;
    const hasPrevPage = currentPage > 1;

    return {
      currentPage,
      totalPages,
      pageSize: limit,
      totalItems: total,
      hasNextPage,
      hasPrevPage,
      offset,
    };
  }, [page, limit, total]);

  const goToPage = useCallback((newPage: number) => {
    setPage(Math.max(1, newPage));
  }, []);

  const nextPage = useCallback(() => {
    if (paginationState.hasNextPage) {
      setPage((prev) => prev + 1);
    }
  }, [paginationState.hasNextPage]);

  const prevPage = useCallback(() => {
    if (paginationState.hasPrevPage) {
      setPage((prev) => prev - 1);
    }
  }, [paginationState.hasPrevPage]);

  const goToFirst = useCallback(() => {
    setPage(1);
  }, []);

  const goToLast = useCallback(() => {
    setPage(paginationState.totalPages);
  }, [paginationState.totalPages]);

  const updatePageSize = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when changing page size
  }, []);

  const updateTotalItems = useCallback((newTotal: number) => {
    setTotal(newTotal);
  }, []);

  const reset = useCallback(() => {
    setPage(initialPage);
    setLimit(initialLimit);
    setTotal(totalItems);
  }, [initialPage, initialLimit, totalItems]);

  return {
    ...paginationState,
    page, // Keep page for direct access
    limit, // Keep limit for direct access
    setPage, // Direct setter for page
    setLimit: updatePageSize,
    setTotalItems: updateTotalItems,
    goToPage,
    nextPage,
    prevPage,
    goToFirst,
    goToLast,
    reset,
  };
};
