"use client";

import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  FiEdit,
  FiTrash2,
  FiMoreVertical,
  FiPlus,
  FiEye,
  FiCalendar,
} from "react-icons/fi";
import { createPortal } from "react-dom";
import { useDataTableStore } from "../../../store/dataTableStore";
import useCommonCrud from "../../../hooks/useCommonCrud";
import {
  DataTable,
  TableColumn,
} from "../../../components/PagesComponent/DataTable";

interface NewsletterPublish {
  _id: string;
  title: string;
  description?: string;
  issue_code?: string;
  issue_number: number;
  publish_date: string;
  status: "draft" | "scheduled" | "published";
  pdf_file: string;
  file_size?: number;
  is_email_sent: boolean;
  email_sent_at?: string;
  total_recipients?: number;
  is_active: number;
  is_deleted?: boolean;
  created_at: string;
  updated_at: string;
  frequency?: "daily" | "weekly" | "monthly";
}

export default function NewsletterPublishListing() {
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const MODULE_KEY = `${role}-newsletter-publish`;
  const [isMounted, setIsMounted] = useState(false);

  const {
    page,
    recordsPerPage,
    searchValue,
    sortField,
    sortOrder,
    setPage,
    setRecordsPerPage,
    setSearchValue,
    setSort,
    setCurrentModule,
    cacheModuleState,
    restoreModuleState,
    markEditNavigation,
    markTabSwitch,
    lastAction,
  } = useDataTableStore();

  /* ------------------- Detect tab switching ------------------- */
  useEffect(() => {
    const currentPath = location.pathname;
    const storedPath = sessionStorage.getItem("lastPath");

    if (
      storedPath &&
      !storedPath.includes("/list-newsletter") &&
      currentPath.includes("/list-newsletter")
    ) {
      markTabSwitch();
    }

    sessionStorage.setItem("lastPath", currentPath);
  }, [location.pathname]);

  /* ------------------- Initialize module state ------------------- */
  useEffect(() => {
    setCurrentModule(MODULE_KEY);

    if (lastAction === "edit") {
      restoreModuleState(MODULE_KEY);
    } else if (lastAction === "tab-switch") {
      setPage(1);
    }

    // Set default sort if not set
    if (!sortField || !sortOrder) {
      setSort("publish_date", "desc");
    }

    setIsMounted(true);

    return () => {
      cacheModuleState(MODULE_KEY);
    };
  }, [MODULE_KEY]);

  /* ------------------- Navigation to edit ------------------- */
  const handleEditClick = (id: string) => {
    markEditNavigation();
    cacheModuleState(MODULE_KEY);
    navigate(`/${role}/list-newsletter/edit/${id}`);
  };

  /* ------------------- Handlers ------------------- */
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleRecordsPerPageChange = (value: number) => {
    setRecordsPerPage(value);
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };

  const handleSortChange = (field: string, order: "asc" | "desc") => {
    setSort(field, order);
  };

  /* ------------------- Track tab clicks globally ------------------- */
  useEffect(() => {
    const handleNavClick = () => {
      setTimeout(() => {
        const currentPath = window.location.pathname;
        if (!currentPath.includes("/list-newsletter")) {
          markTabSwitch();
        }
      }, 100);
    };

    document.addEventListener("click", handleNavClick);
    return () => document.removeEventListener("click", handleNavClick);
  }, []);

  /* ---------------- useCommonCrud hook ---------------- */
  const { data, extractList, refetch, deleteRecord, toggleStatus, isLoading } =
    useCommonCrud<NewsletterPublish>({
      role,
      module: "newsletter-publications",
      page,
      limit: recordsPerPage,
      searchValue,
      sortField,
      sortOrder,
      listKey: "newsletters",
      enabled: isMounted,
    });

  // Use extractList directly from hook
  const newsletters = extractList.filter((n) => !n.is_deleted);
  const totalRecords = data?.total || 0;
  const totalPages = Math.max(Math.ceil(totalRecords / recordsPerPage), 1);

  // Refetch when dependencies change
  useEffect(() => {
    if (!isMounted) return;

    const timer = setTimeout(refetch, 300);
    return () => clearTimeout(timer);
  }, [searchValue, sortField, sortOrder, page, recordsPerPage, isMounted]);

  /* ---------------- Dropdown ---------------- */
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const handleDropdownClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + window.scrollY + 6,
      left: rect.left + window.scrollX - 100,
    });
    setOpenDropdownId((prev) => (prev === id ? null : id));
  };

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("click", handleOutside);
    return () => document.removeEventListener("click", handleOutside);
  }, []);

  /* ---------------- View PDF ---------------- */
  const viewFile = (newsletter: NewsletterPublish) => {
    const baseUrl = import.meta.env.VITE_UPLOAD_BASE;
    const fileUrl = `${baseUrl}/uploads/newsletters/${newsletter.pdf_file}`;

    // const baseUrl = import.meta.env.VITE_API_BASE || "http://localhost:5000";
    // const fileUrl = `http://localhost:5000/uploads/newsletters/${newsletter.pdf_file}`;
    window.open(fileUrl, "_blank");
  };

  /* ---------------- Toggle Status ---------------- */
  const handleToggleActive = async (id: string, current: number) => {
    const next = current === 1 ? 0 : 1;

    try {
      await toggleStatus(id, next === 1);
      toast.success("Status updated successfully");
    } catch {
      toast.error("Failed to update status");
    }
  };

  /* ---------------- Delete ---------------- */
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteModalId) return;

    try {
      const res = await deleteRecord(deleteModalId);

      if (res?.success) {
        toast.success("Newsletter deleted successfully");
      } else {
        toast.error("Delete failed");
      }
    } catch (error) {
      toast.error("Error deleting newsletter");
    } finally {
      setDeleteModalId(null);
      refetch();
    }
  };

  /* ---------------- Utils ---------------- */
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: <span className="badge bg-gray-200">Draft</span>,
      scheduled: <span className="badge bg-blue-200">Scheduled</span>,
      published: <span className="badge bg-green-200">Published</span>,
    };
    return badges[status as keyof typeof badges] || <span>Unknown</span>;
  };

  const formatFrequency = (freq?: string) => {
    if (!freq) return "-";
    const frequencyMap: Record<string, string> = {
      daily: "Daily",
      weekly: "Weekly",
      monthly: "Monthly",
    };
    return frequencyMap[freq] || "-";
  };

  const getAllFrequencies = () => {
    const frequencies = newsletters
      .map((n) => n.frequency)
      .filter((f): f is NonNullable<NewsletterPublish["frequency"]> => !!f);
    return Array.from(new Set(frequencies));
  };

  /* ---------------- Columns ---------------- */
  const columns: TableColumn<NewsletterPublish>[] = [
    {
      key: "index",
      label: "#",
      render: (_row, i) => (page - 1) * recordsPerPage + i + 1,
    },
    {
      key: "title",
      label: "Title",
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-medium">{row.title}</div>
          {row.issue_code && (
            <div className="text-sm text-gray-500">Issue: {row.issue_code}</div>
          )}
        </div>
      ),
    },
    {
      key: "frequency",
      label: "Newsletter Type",
      sortable: true,
      render: (row) => {
        const freq = row.frequency || "-";
        const badgeColor =
          freq === "daily"
            ? "bg-blue-100 text-blue-800"
            : freq === "weekly"
              ? "bg-purple-100 text-purple-800"
              : freq === "monthly"
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800";

        return (
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${badgeColor}`}
          >
            {formatFrequency(row.frequency)}
          </span>
        );
      },
    },
    {
      key: "publish_date",
      label: "Publish Date",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <FiCalendar size={14} />
          {formatDate(row.publish_date)}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => getStatusBadge(row.status),
    },
    {
      key: "visibility",
      label: "Visibility",
      render: (row) => (
        <button
          onClick={() => handleToggleActive(row._id, row.is_active ? 1 : 0)}
          className={`px-3 py-1 rounded-sm text-white ${
            row.is_active ? "bg-green-600" : "bg-gray-600"
          }`}
        >
          {row.is_active ? "Active" : "Inactive"}
        </button>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <>
          <button
            onClick={(e) => handleDropdownClick(e, row._id)}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <FiMoreVertical />
          </button>

          {openDropdownId === row._id &&
            createPortal(
              <div
                ref={dropdownRef}
                className="fixed bg-white border rounded-xl shadow-lg z-[99999]"
                style={{
                  top: dropdownPos.top,
                  left: dropdownPos.left,
                  width: "10rem",
                }}
              >
                <button
                  onClick={() => handleEditClick(row._id)}
                  className="flex gap-2 px-4 py-2 hover:bg-indigo-50 w-full"
                >
                  <FiEdit /> Edit
                </button>

                <button
                  onClick={() => viewFile(row)}
                  className="flex gap-2 px-4 py-2 hover:bg-gray-50 w-full"
                >
                  <FiEye /> View
                </button>

                <button
                  onClick={() => setDeleteModalId(row._id)}
                  className="flex gap-2 px-4 py-2 text-red-600 hover:bg-red-50 w-full"
                >
                  <FiTrash2 /> Delete
                </button>
              </div>,
              document.body,
            )}
        </>
      ),
    },
  ];

  if (!isMounted) {
    return (
      <div className="bg-gray-50 min-h-screen p-4 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4">
      <div className="flex justify-between mb-6">
        <h2 className="text-xl font-medium">Newsletter Listing</h2>

        <button
          onClick={() => {
            cacheModuleState(MODULE_KEY);
            navigate(`/${role}/list-newsletter/create`);
          }}
          className="bg-[#043f79] text-white px-3 py-2 rounded-md flex items-center gap-2"
        >
          <FiPlus /> Add
        </button>
      </div>

      <DataTable
        columns={columns}
        data={newsletters}
        loading={isLoading}
        page={page}
        totalPages={totalPages}
        totalRecords={totalRecords}
        recordsPerPage={recordsPerPage}
        onPageChange={handlePageChange}
        onRecordsPerPageChange={handleRecordsPerPageChange}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        sortField={sortField}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        customFilters={
          getAllFrequencies().length > 0
            ? [
                {
                  key: "frequency",
                  label: "Newsletter Type",
                  options: [
                    { value: "", label: "All Types" },
                    ...getAllFrequencies().map((freq) => ({
                      value: freq,
                      label: formatFrequency(freq),
                    })),
                  ],
                },
              ]
            : undefined
        }
      />

      {deleteModalId &&
        createPortal(
          <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-[99999]">
            <div className="bg-white p-6 rounded-xl w-96">
              <h3 className="text-lg font-semibold">Confirm Delete</h3>
              <div className="flex justify-end gap-3 mt-5">
                <button
                  onClick={() => setDeleteModalId(null)}
                  className="border px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-red-600 text-white px-4 py-2 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
