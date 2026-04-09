import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  FiEdit,
  FiTrash2,
  FiMoreVertical,
  FiPlus,
  FiImage,
} from "react-icons/fi";
import { createPortal } from "react-dom";
import { DataTable, TableColumn } from "../../PagesComponent/DataTable";
import { useCommonCrud } from "../../../hooks/useCommonCrud";
import { useDataTableStore } from "../../../store/dataTableStore";

interface Cluster {
  _id: string;
  title: string;
  thumbnail?: string;
  is_active: number;
}

export default function ClusterListing() {
  const { role } = useParams<{ role: string }>();
  const safeRole = role ?? "";
  const navigate = useNavigate();
  const location = useLocation();

  const MODULE_KEY = `${safeRole}-cluster`;
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
    if (!safeRole) {
      toast.error("Role is missing in URL");
    }
  }, [safeRole]);

  /* ------------------- Detect tab switching ------------------- */
  useEffect(() => {
    // Store current path to detect tab switches
    const currentPath = location.pathname;
    const storedPath = sessionStorage.getItem("lastPath");

    // Check if we're switching tabs (different module)
    if (
      storedPath &&
      !storedPath.includes("/cluster") &&
      currentPath.includes("/cluster")
    ) {
      // Coming from different tab, mark as tab switch
      markTabSwitch();
    }

    // Store current path for next navigation
    sessionStorage.setItem("lastPath", currentPath);
  }, [location.pathname, markTabSwitch]);

  /* ------------------- Initialize module state ------------------- */
  useEffect(() => {
    // Set current module
    setCurrentModule(MODULE_KEY);

    // Check if we should restore from edit
    if (lastAction === "edit") {
      restoreModuleState(MODULE_KEY);
    } else if (lastAction === "tab-switch") {
      setPage(1);
    }

    // Set default sort for clusters
    if (!sortField || !sortOrder) {
      setSort("created_at", "desc");
    }

    setIsMounted(true);

    // Cache state before unmounting
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
    setSort,
    sortField,
    sortOrder,
  ]);

  /* ------------------- Fetch Data ------------------- */
  const { data, extractList, refetch, deleteRecord, isLoading, toggleStatus } =
    useCommonCrud<Cluster>({
      role: safeRole,
      module: "cluster",
      page,
      limit: recordsPerPage,
      searchValue,
      sortField,
      sortOrder,
      enabled: isMounted,
    });

  const [clusters, setClusters] = useState<Cluster[]>([]);
  useEffect(() => setClusters(extractList), [extractList]);

  const totalRecords = data?.total ?? 0;
  const totalPages = Math.max(Math.ceil(totalRecords / recordsPerPage), 1);

  /* ------------------- Debounced Refetch ------------------- */
  useEffect(() => {
    if (!isMounted) return;

    const timer = setTimeout(() => refetch(), 300);
    return () => clearTimeout(timer);
  }, [searchValue, sortField, sortOrder, page, recordsPerPage, isMounted]);

  /* ------------------- Navigation handlers ------------------- */
  const handleEditClick = (id: string) => {
    // Mark that we're going to edit
    markEditNavigation();
    // Cache current state
    cacheModuleState(MODULE_KEY);

    navigate(`/${safeRole}/cluster/edit/${id}`);
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
    // Listen for clicks on navigation links
    const handleNavClick = () => {
      // Use setTimeout to detect after the click
      setTimeout(() => {
        const currentPath = window.location.pathname;
        if (!currentPath.includes("/cluster")) {
          // User navigated away from clusters
          markTabSwitch();
        }
      }, 100);
    };

    // Listen for clicks on any link
    document.addEventListener("click", handleNavClick);

    return () => {
      document.removeEventListener("click", handleNavClick);
    };
  }, [markTabSwitch]);

  /* ------------------- Dropdown logic ---------------- */
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // OUTSIDE CLICK (use CLICK, not mousedown)
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  const handleDropdownClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + window.scrollY + 6,
      left: rect.right + window.scrollX - 144,
    });
    setOpenDropdownId((prev) => (prev === id ? null : id));
  };

  /* ---------------- Toggle Status ---------------- */
  const handleToggleStatus = async (id: string, current: number) => {
    const next = current ? 0 : 1;

    setClusters((prev) =>
      prev.map((c) => (c._id === id ? { ...c, is_active: next } : c)),
    );

    try {
      await toggleStatus(id, next === 1);
    } catch {
      toast.error("Failed to update status");
      setClusters((prev) =>
        prev.map((c) => (c._id === id ? { ...c, is_active: current } : c)),
      );
    }
  };

  /* ---------------- Delete ---------------- */
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteModalId) return;

    const res = await deleteRecord(deleteModalId);
    if (!res?.success) {
      toast.error("Delete failed");
    }

    setDeleteModalId(null);
    setOpenDropdownId(null);
    refetch();
  };

  const API_BASE = import.meta.env.VITE_API_BASE?.replace("/api", "");

  const Dropdown = ({
    clusterId,
    top,
    left,
  }: {
    clusterId: string;
    top: number;
    left: number;
  }) =>
    createPortal(
      <div
        ref={dropdownRef}
        className="absolute z-50 w-36 rounded-xl border border-gray-200 bg-white p-1 shadow-lg"
        style={{ top, left }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => {
            handleEditClick(clusterId);
            setOpenDropdownId(null);
          }}
          className="flex h-9 w-full items-center gap-2 rounded-lg px-3 text-sm text-gray-700 transition hover:bg-gray-100"
        >
          <FiEdit /> Edit
        </button>

        <button
          onClick={() => {
            setDeleteModalId(clusterId);
            setOpenDropdownId(null);
          }}
          className="flex h-9 w-full items-center gap-2 rounded-lg px-3 text-sm text-red-600 transition hover:bg-red-50"
        >
          <FiTrash2 /> Delete
        </button>
      </div>,
      document.body,
    );

  /* ---------------- Columns ---------------- */
  const columns: TableColumn<Cluster>[] = [
    {
      key: "index",
      label: "#",
      render: (_, i) => (page - 1) * recordsPerPage + i + 1,
    },
    {
      key: "thumbnail",
      label: "Thumbnail",
      render: (row) =>
        row.thumbnail ? (
          <img
            src={
              row.thumbnail.startsWith("http")
                ? row.thumbnail
                : `${API_BASE}/uploads/thumbnail/${row.thumbnail}`
            }
            className="w-14 h-14 object-cover rounded-lg border"
            alt={row.title}
          />
        ) : (
          <div className="w-14 h-14 bg-gray-100 flex items-center justify-center border rounded-lg">
            <FiImage />
          </div>
        ),
    },
    { key: "title", label: "Title", sortable: true },
    {
      key: "is_active",
      label: "Status",
      render: (r) => (
        <button
          onClick={() => handleToggleStatus(r._id, r.is_active)}
          className={`px-3 py-1 rounded-sm text-white ${
            r.is_active ? "bg-green-600" : "bg-gray-600"
          }`}
        >
          {r.is_active ? "Active" : "Inactive"}
        </button>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (r) => (
        <>
          <button
            onClick={(e) => handleDropdownClick(e, r._id)}
            className="rounded-full p-2 text-gray-600 transition hover:bg-gray-100"
          >
            <FiMoreVertical />
          </button>

          {openDropdownId === r._id && (
            <Dropdown
              clusterId={r._id}
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
      <div className="bg-gray-50 min-h-screen p-4 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!safeRole) {
    return null;
  }

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="flex justify-between mb-6">
        <h2 className="text-xl font-medium">Clusters</h2>

        {(role === "admin" || role === "editor") && (
          <button
            onClick={() => {
              cacheModuleState(MODULE_KEY);
              navigate(`/${safeRole}/cluster/create`);
            }}
            className="bg-[#043f79] text-white px-3 py-2 rounded-md flex items-center gap-2"
          >
            <FiPlus /> Add
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={clusters}
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
      />

      {deleteModalId &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900">
                Delete Cluster?
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete this cluster?
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
