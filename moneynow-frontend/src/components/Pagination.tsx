"use client";

import React from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
} from "react-icons/fi";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageNumbers?: boolean;
  showBoundaryButtons?: boolean;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showPageNumbers = true,
  showBoundaryButtons = true,
  className = "",
}) => {
  // ALWAYS render, even with 1 page
  const isSinglePage = totalPages <= 1;

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          disabled={isSinglePage}
          className={`min-w-[36px] h-9 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
            currentPage === i
              ? "bg-[#043F79] text-white"
              : isSinglePage
                ? "text-gray-400 cursor-default"
                : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          {i}
        </button>,
      );
    }

    return pages;
  };

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* Page info - always show */}
      <div className="text-sm text-gray-600">
        Page <span className="font-semibold">{currentPage}</span> of{" "}
        <span className="font-semibold">{totalPages}</span>
      </div>

      {/* Pagination controls - always show */}
      <div className="flex items-center gap-2">
        {showBoundaryButtons && (
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1 || isSinglePage}
            className="p-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            title="First page"
          >
            <FiChevronsLeft size={18} />
          </button>
        )}

        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isSinglePage}
          className="p-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          title="Previous page"
        >
          <FiChevronLeft size={18} />
        </button>

        {showPageNumbers && (
          <div className="flex items-center gap-1">{renderPageNumbers()}</div>
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isSinglePage}
          className="p-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          title="Next page"
        >
          <FiChevronRight size={18} />
        </button>

        {showBoundaryButtons && (
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages || isSinglePage}
            className="p-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            title="Last page"
          >
            <FiChevronsRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
};
