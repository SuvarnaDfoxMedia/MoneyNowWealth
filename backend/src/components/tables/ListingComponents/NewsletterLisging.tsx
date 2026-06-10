import React, { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FiTrash2, FiMoreVertical } from "react-icons/fi";
import { createPortal } from "react-dom";
import { DataTable, TableColumn } from "../../PagesComponent/DataTable";
import { useCommonCrud } from "../../../hooks/useCommonCrud";
import { useDataTableStore } from "../../../store/dataTableStore";

interface Subscriber {
  _id: string;
  name: string;
  email: string;
  created_at: string;
  is_deleted: boolean;
}

export default function NewsletterListing() {
  const { role } = useParams<{ role: string }>();
  const location = useLocation();

  const MODULE_KEY = `${role}-newsletter`;
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
    markTabSwitch,
    lastAction,
  } = useDataTableStore();

  /* ------------------- Detect tab switching ------------------- */
  useEffect(() => {
    const currentPath = location.pathname;
    const storedPath = sessionStorage.getItem("lastPath");

    if (
      storedPath &&
      !storedPath.includes("/newsletter") &&
      currentPath.includes("/newsletter")
    ) {
      markTabSwitch();
    }

    sessionStorage.setItem("lastPath", currentPath);
  }, [location.pathname, markTabSwitch]);

  /* ------------------- Initialize module state ------------------- */
  useEffect(() => {
    setCurrentModule(MODULE_KEY);

    if (lastAction === "edit") {
      restoreModuleState(MODULE_KEY);
    } else if (lastAction === "tab-switch") {
      setPage(1);
    }

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

  useEffect(() => {
    if (!sortField) {
      setSort("created_at", "desc");
    }
  }, [setSort, sortField]);

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
        if (!currentPath.includes("/newsletter")) {
          markTabSwitch();
        }
      }, 100);
    };

    document.addEventListener("click", handleNavClick);
    return () => document.removeEventListener("click", handleNavClick);
  }, [markTabSwitch]);

  // ------------------- Fetch Data (CRUD Hook) -------------------
  const { data, extractList, refetch, deleteRecord, isLoading } =
    useCommonCrud<Subscriber>({
      role,
      module: "newsletter",
      listKey: "newsletters",
      page,
      limit: recordsPerPage,
      searchValue,
      sortField,
      sortOrder,
      enabled: isMounted,
    });

  const subscribers = extractList;

  const totalRecords = data?.total ?? 0;
  const totalPages = Math.max(Math.ceil(totalRecords / recordsPerPage), 1);

  /* ------------------- Debounced Refetch ------------------- */
  useEffect(() => {
    if (!isMounted) return;

    const timer = setTimeout(() => refetch(), 300);
    return () => clearTimeout(timer);
  }, [searchValue, sortField, sortOrder, page, recordsPerPage, isMounted]);

  /* ------------------- Dropdown & Delete ------------------- */
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const handleDropdownClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    id: string,
  ) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + 6,
      left: rect.left - 80,
    });
    setOpenDropdownId((prev) => (prev === id ? null : id));
  };

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    window.addEventListener("click", handleOutside);
    return () => window.removeEventListener("click", handleOutside);
  }, []);

  const handleDelete = async () => {
    if (!deleteModalId) return;

    const res = await deleteRecord(deleteModalId);
    if (res?.success) {
      refetch();
    } else {
      toast.error(res?.message || "Delete failed");
    }
    setDeleteModalId(null);
  };

  const Dropdown = ({
    id,
    top,
    left,
  }: {
    id: string;
    top: number;
    left: number;
  }) =>
    createPortal(
      <div
        ref={dropdownRef}
        className="fixed z-[99999] rounded-xl border border-gray-200 bg-white p-1 shadow-lg"
        style={{ top, left, width: "8rem" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => {
            setDeleteModalId(id);
            setOpenDropdownId(null);
          }}
          className="flex items-center gap-2 px-4 py-2 hover:bg-red-50 w-full text-left text-red-600 transition"
        >
          <FiTrash2 /> Delete
        </button>
      </div>,
      document.body,
    );

  /* ------------------- Table Columns ------------------- */
  const columns: TableColumn<Subscriber>[] = [
    {
      key: "index",
      label: "#",
      render: (_row, idx) => (page - 1) * recordsPerPage + idx + 1,
    },
    { key: "email", label: "Email", sortable: true, render: (r) => r.email },
    {
      key: "created_at",
      label: "Subscribed Date",
      sortable: true,
      render: (r) => new Date(r.created_at).toLocaleString("en-GB"),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => handleDropdownClick(e, row._id)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <FiMoreVertical size={18} />
          </button>
          {openDropdownId === row._id && (
            <Dropdown
              id={row._id}
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
      <div className="p-4 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <h2 className="text-xl font-medium mb-6">Newsletter Subscribers</h2>

      <DataTable
        columns={columns}
        data={subscribers}
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
        loading={isLoading}
      />

      {/* Delete Modal */}
      {deleteModalId &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h2 className="text-lg font-semibold text-gray-900">
                Delete Subscriber?
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete this subscriber?
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
