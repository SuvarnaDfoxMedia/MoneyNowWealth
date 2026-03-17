import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FiTrash2 } from "react-icons/fi";
import { useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import { DataTable } from "../../PagesComponent/DataTable";
import { useAdminCrud } from "../../../hooks/useAdminCrud";
import { useDataTableStore } from "../../../store/dataTableStore";

interface User {
  _id: string;
  firstname: string;
  lastname: string;
  email: string;
  mobile: string;
  created_at: string;
}

export default function CustomerListing() {
  const location = useLocation();

  const MODULE_KEY = "admin-customers";
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
      !storedPath.includes("/customers") &&
      currentPath.includes("/customers")
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
        if (!currentPath.includes("/customers")) {
          markTabSwitch();
        }
      }, 100);
    };

    document.addEventListener("click", handleNavClick);
    return () => document.removeEventListener("click", handleNavClick);
  }, [markTabSwitch]);

  /* ------------------- API hook ------------------- */
  const {
    data,
    extractList: users,
    isLoading,
    refetch,
    deleteRecord,
  } = useAdminCrud<User>({
    module: "admin/users",
    adminModule: true,
    role: "",
    page,
    limit: recordsPerPage,
    searchValue,
    sortField,
    sortOrder,
    listKey: "users",
    enabled: isMounted,
  });

  const total = data?.total ?? 0;
  const totalPages = Math.max(Math.ceil(total / recordsPerPage), 1);

  /* ------------------- Debounced refetch ------------------- */
  useEffect(() => {
    if (!isMounted) return;

    const timer = setTimeout(() => refetch(), 300);
    return () => clearTimeout(timer);
  }, [searchValue, sortField, sortOrder, page, recordsPerPage, isMounted]);

  /* ------------------- Delete functionality ------------------- */
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);

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
    const handleClickOutside = () => {
      setOpenDropdownId(null);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleDelete = async () => {
    if (!deleteModalId) return;

    try {
      const res = await deleteRecord(deleteModalId);
      if (res?.success) {
        toast.success("Customer deleted successfully");
        refetch();
      } else {
        toast.error(res?.message || "Failed to delete customer");
      }
    } catch {
      toast.error("Error deleting customer");
    } finally {
      setDeleteModalId(null);
      setOpenDropdownId(null);
    }
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
        className="absolute bg-white border rounded-xl shadow-lg z-50"
        style={{ top, left, width: "8rem" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => {
            setDeleteModalId(id);
            setOpenDropdownId(null);
          }}
          className="flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-red-600 w-full"
        >
          <FiTrash2 /> Delete
        </button>
      </div>,
      document.body,
    );

  const columns = [
    {
      key: "index",
      label: "#",
      render: (_r: User, idx: number) => (page - 1) * recordsPerPage + idx + 1,
    },
    {
      key: "firstname",
      label: "Name",
      sortable: true,
      render: (r: User) => `${r.firstname} ${r.lastname}`,
    },
    { key: "email", label: "Email", sortable: true },
    { key: "mobile", label: "Mobile" },
    {
      key: "created_at",
      label: "Register Date",
      sortable: true,
      render: (r: User) => new Date(r.created_at).toLocaleString("en-GB"),
    },
    {
      key: "actions",
      label: "Actions",
      render: (r: User) => (
        <>
          <button
            onClick={(e) => handleDropdownClick(e, r._id)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <FiTrash2 size={18} />
          </button>
          {openDropdownId === r._id && (
            <Dropdown
              id={r._id}
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

  return (
    <div className="bg-gray-50 min-h-screen p-4 relative">
      <h2 className="text-xl font-medium text-gray-800 mb-6">Customer List</h2>

      <DataTable
        columns={columns}
        data={users}
        loading={isLoading}
        page={page}
        totalPages={totalPages}
        totalRecords={total}
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
                Confirm Delete
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete this user?
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

