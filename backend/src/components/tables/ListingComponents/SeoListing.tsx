"use client";

import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { toast } from "react-hot-toast";
import { FiEdit, FiMoreVertical, FiPlus, FiTrash2 } from "react-icons/fi";
import { DataTable, TableColumn } from "../../PagesComponent/DataTable";
import { useCommonCrud } from "../../../hooks/useCommonCrud";
import { useDataTableStore } from "../../../store/dataTableStore";

interface SeoEntry {
  _id: string;
  page_url: string;
  seo_title?: string;
  status: "draft" | "published" | "archived";
  is_active: number;
  updated_at?: string;
}

export default function SeoListing() {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const MODULE_KEY = "admin-seo";
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

  useEffect(() => {
    const currentPath = location.pathname;
    const storedPath = sessionStorage.getItem("lastPath");

    if (
      storedPath &&
      !storedPath.includes("/seo") &&
      currentPath.includes("/seo")
    ) {
      markTabSwitch();
    }

    sessionStorage.setItem("lastPath", currentPath);
  }, [location.pathname, markTabSwitch]);

  useEffect(() => {
    setCurrentModule(MODULE_KEY);

    if (lastAction === "edit") restoreModuleState(MODULE_KEY);
    else if (lastAction === "tab-switch") setPage(1);

    setIsMounted(true);

    return () => {
      cacheModuleState(MODULE_KEY);
    };
  }, [
    MODULE_KEY,
    cacheModuleState,
    lastAction,
    restoreModuleState,
    setCurrentModule,
    setPage,
  ]);

  const { data, extractList, isLoading, refetch, deleteRecord, toggleStatus } =
    useCommonCrud<SeoEntry>({
      module: "seo",
      role: "admin",
      listKey: "seo",
      page,
      limit: recordsPerPage,
      searchValue,
      sortField,
      sortOrder,
      enabled: isMounted,
      extraParams: {
        includeInactive: true,
      },
    });

  const [entries, setEntries] = useState<SeoEntry[]>([]);
  const totalRecords = data?.total || 0;
  const totalPages = Math.max(Math.ceil(totalRecords / recordsPerPage), 1);

  useEffect(() => {
    setEntries(extractList as SeoEntry[]);
  }, [extractList]);

  useEffect(() => {
    if (!isMounted) return;
    const timer = setTimeout(() => refetch(), 400);
    return () => clearTimeout(timer);
  }, [
    isMounted,
    page,
    recordsPerPage,
    refetch,
    searchValue,
    sortField,
    sortOrder,
  ]);

  useEffect(() => {
    const handleNavClick = () => {
      setTimeout(() => {
        if (!window.location.pathname.includes("/seo")) markTabSwitch();
      }, 100);
    };

    document.addEventListener("click", handleNavClick);
    return () => document.removeEventListener("click", handleNavClick);
  }, [markTabSwitch]);

  const handleEditClick = (id: string) => {
    markEditNavigation();
    cacheModuleState(MODULE_KEY);
    navigate(`/admin/seo/edit/${id}`);
  };

  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  const handleDropdownClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    id: string,
  ) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + window.scrollY,
      left: rect.right - 144,
    });
    setOpenDropdownId(openDropdownId === id ? null : id);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleToggleStatus = async (id: string, isActive: number) => {
    try {
      await toggleStatus(id, isActive !== 1);
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!deleteModalId) return;
    try {
      const res = await deleteRecord(deleteModalId);
      if (res?.success) {
        setEntries((prev) =>
          prev.filter((entry) => entry._id !== deleteModalId),
        );
        refetch();
      } else {
        toast.error("Failed to delete");
      }
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleteModalId(null);
    }
  };

  const Dropdown = ({
    seoId,
    top,
    left,
  }: {
    seoId: string;
    top: number;
    left: number;
  }) =>
    createPortal(
      <div
        ref={dropdownRef}
        className="absolute z-50 rounded-xl border bg-white shadow-lg"
        style={{ top, left, width: "9rem" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => {
            handleEditClick(seoId);
            setOpenDropdownId(null);
          }}
          className="flex w-full items-center gap-2 px-4 py-2 hover:bg-indigo-50"
        >
          <FiEdit /> Edit
        </button>

        <button
          onClick={() => {
            setDeleteModalId(seoId);
            setOpenDropdownId(null);
          }}
          className="flex w-full items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50"
        >
          <FiTrash2 /> Delete
        </button>
      </div>,
      document.body,
    );

  const columns: TableColumn<SeoEntry>[] = [
    {
      key: "index",
      label: "SR.NO",
      render: (_row, idx) => (page - 1) * recordsPerPage + idx + 1,
    },
    {
      key: "page_url",
      label: "NAME",
      sortable: true,
      render: (row) => row.page_url.replace(/^\//, ""),
    },
    {
      key: "updated_at",
      label: "DATE",
      sortable: true,
      render: (row) =>
        row.updated_at
          ? new Date(row.updated_at).toLocaleDateString("en-CA")
          : "--",
    },
    {
      key: "is_active",
      label: "STATUS",
      render: (row) => (
        <button
          onClick={() => handleToggleStatus(row._id, row.is_active)}
          className={`rounded px-3 py-1 text-sm font-medium text-white ${
            row.is_active === 1 ? "bg-[#ff4d57]" : "bg-gray-500"
          }`}
        >
          {row.is_active === 1 ? "DEACTIVATE" : "ACTIVATE"}
        </button>
      ),
    },
    {
      key: "actions",
      label: "ACTIONS",
      render: (row) => (
        <>
          <button
            onClick={(e) => handleDropdownClick(e, row._id)}
            className="rounded-full p-2 hover:bg-gray-100"
          >
            <FiMoreVertical size={18} />
          </button>
          {openDropdownId === row._id && (
            <Dropdown
              seoId={row._id}
              top={dropdownPos.top}
              left={dropdownPos.left}
            />
          )}
        </>
      ),
    },
  ];

  if (!isMounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-50 p-4">
      <div className="mb-6 flex justify-between">
        <h2 className="text-xl font-medium">Manage SEO</h2>
        <button
          onClick={() => {
            cacheModuleState(MODULE_KEY);
            navigate("/admin/seo/create");
          }}
          className="flex items-center gap-2 rounded-md bg-[#043f79] px-3 py-2 text-white shadow-md hover:bg-[#0654a4] transition"
        >
          <FiPlus /> Add
        </button>
      </div>

      <DataTable
        columns={columns}
        data={entries}
        loading={isLoading}
        page={page}
        totalPages={totalPages}
        totalRecords={totalRecords}
        recordsPerPage={recordsPerPage}
        onPageChange={setPage}
        onRecordsPerPageChange={setRecordsPerPage}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        sortField={sortField}
        sortOrder={sortOrder}
        onSortChange={setSort}
      />

      {deleteModalId &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900">
                Confirm Delete
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete this SEO entry?
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setDeleteModalId(null)}
                  className="h-10 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="h-10 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700"
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
