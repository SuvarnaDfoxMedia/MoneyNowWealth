

//   //  Fetch newsletters with pagination
//   const { newsletters, totalPages, loading, error } = useFetchNewsletters(
//     page,
//     limit,
//   );

"use client";

import { FiDownload, FiMail, FiEye } from "react-icons/fi";
import { useState, useEffect } from "react";
import { useFetchNewsletters } from "@/hooks/useFetchNewsletters";
import { usePagination } from "@/hooks/usePagination";
import { Pagination } from "@/components/Pagination";

const FILE_BASE_URL = process.env.NEXT_PUBLIC_API_BASE + "/uploads/newsletters";

const NewsletterTable = () => {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize pagination
  const pagination = usePagination({
    initialPage: 1,
    initialLimit: 10,
  });

  // Fetch newsletters with pagination
  const {
    newsletters,
    loading,
    error,
    total,
    currentPage: apiPage,
    totalPages: apiTotalPages,
  } = useFetchNewsletters(pagination.page, pagination.limit);

  // Sync pagination with API response
  useEffect(() => {
    if (total > 0) {
      pagination.setTotalItems(total);
    }
  }, [total]);

  // Handle API page changes
  useEffect(() => {
    if (apiPage && apiPage !== pagination.page) {
      pagination.setPage(apiPage);
    }
  }, [apiPage]);

  const handleDownload = async (fileUrl: string, filename: string) => {
    try {
      setDownloading(filename);

      let downloadUrl = fileUrl;
      if (!fileUrl.startsWith("http")) {
        downloadUrl = `${FILE_BASE_URL}/${fileUrl}`;
      }

      const response = await fetch(downloadUrl, {
        credentials: "include",
        mode: "cors",
      });

      if (!response.ok) {
        throw new Error(
          `Download failed: ${response.status} ${response.statusText}`,
        );
      }

      const blob = await response.blob();
      const downloadUrlObject = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = downloadUrlObject;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrlObject);
    } catch (err: any) {
      console.error("Download error:", err);
      alert(`Download failed: ${err.message || "Unknown error"}`);
      try {
        window.open(fileUrl, "_blank");
      } catch (fallbackErr) {
        console.error("Fallback also failed:", fallbackErr);
      }
    } finally {
      setDownloading(null);
    }
  };

  const handleView = (fileUrl: string) => {
    window.open(fileUrl, "_blank", "noopener,noreferrer");
  };

  const getFileUrl = (filename: string) => {
    return `${process.env.NEXT_PUBLIC_API_BASE}/uploads/newsletters/${filename}`;
  };

  const formatDate = (dateValue: string) => {
    if (!dateValue) return "-";
    const d = new Date(dateValue);
    return d.toLocaleDateString("en-GB");
  };

  // Calculate starting index for current page
  const startingIndex = (pagination.page - 1) * pagination.limit;

  return (
    <div className="bg-white rounded-lg p-6 shadow w-full">
      {/* Header with results count and page size selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
        <h2 className="text-md font-semibold flex items-center gap-2">
          <FiMail className="text-[#043F79]" />
          Newsletters
          {total > 0 && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({total} total)
            </span>
          )}
        </h2>

        {/* Page size selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Show:</span>
          <select
            value={pagination.limit}
            onChange={(e) => {
              pagination.setLimit(Number(e.target.value));
              pagination.goToFirst();
            }}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#043F79] focus:border-[#043F79]"
          >
            <option value="5">5 per page</option>
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{errorMessage}</p>
        </div>
      )}

      {/* Table Header */}
      <div className="grid grid-cols-[60px_1fr_160px_160px_80px_100px] text-sm text-gray-500 px-4 mb-2">
        <span>#</span>
        <span>Title</span>
        <span>Date</span>
        <span>Newsletter Type</span>
        <span className="text-center">View</span>
        <span className="text-center">Download</span>
      </div>

      {/* Loading / Error / Empty */}
      {loading && <p className="text-center py-6 text-gray-500">Loading...</p>}
      {error && <p className="text-center py-6 text-red-500">{error}</p>}
      {!loading && newsletters.length === 0 && (
        <p className="text-center py-6 text-gray-500">No newsletters found.</p>
      )}

      {/* Table Rows */}
      <div className="space-y-3">
        {newsletters.map((item: any, index: number) => {
          const fileUrl = getFileUrl(item.pdf_file);
          const isDownloading = downloading === item.pdf_file;

          return (
            <div
              key={item._id}
              className="grid grid-cols-[60px_1fr_160px_160px_80px_100px] items-center border border-gray-200 rounded-lg px-4 py-3 bg-transparent hover:bg-gray-50 transition"
            >
              {/* # */}
              <span className="text-sm">{startingIndex + index + 1}</span>

              {/* Title */}
              <span className="text-sm font-medium text-gray-700">
                {item.title}
              </span>

              {/* Date */}
              <span className="text-sm text-gray-600">
                {formatDate(item.publish_date)}
              </span>

              {/* Newsletter Type */}
              <span className="text-sm text-gray-700 capitalize">
                {item.frequency}
              </span>

              {/* View */}
              <button
                onClick={() => handleView(fileUrl)}
                className="mx-auto text-gray-600 hover:text-gray-900 flex items-center justify-center"
                title="View PDF"
              >
                <FiEye size={18} />
              </button>

              {/* Download */}
              <button
                onClick={() => handleDownload(fileUrl, item.pdf_file)}
                disabled={isDownloading}
                className={`mx-auto flex items-center justify-center ${
                  isDownloading
                    ? "text-gray-400"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title="Download PDF"
              >
                {isDownloading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                ) : (
                  <FiDownload size={18} />
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/*  ALWAYS SHOW PAGINATION WHEN THERE ARE ITEMS */}
      {total > 0 && (
        <div className="mt-6 pt-6">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setPage}
            showPageNumbers={true}
            showBoundaryButtons={true}
          />
        </div>
      )}
    </div>
  );
};

export default NewsletterTable;
