import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FiTrash2, FiMoreVertical } from "react-icons/fi";
import { createPortal } from "react-dom";
import { DataTable, TableColumn } from "../../PagesComponent/DataTable";
import { useCommonCrud } from "../../../hooks/useCommonCrud";
import { useEnquiryUnread } from "../../../hooks/useEnquiryUnread";
import { useDataTableStore } from "../../../store/dataTableStore";

interface ContactEnquiry {
  _id: string;
  first_name?: string;
  last_name?: string;
  firstname?: string;
  lastname?: string;
  name?: string;
  fullName?: string;
  user?: {
    firstname?: string;
    lastname?: string;
  };
  email: string;
  mobile: string;
  country_code?: string;
  subject: string;
  message: string;
  terms_accepted?: boolean;
  status: string;
  is_active: number;
  created_at: string;
  updated_at?: string;
}

export default function ContactEnquiryListing() {
  const location = useLocation();

  const MODULE_KEY = "admin-contact-enquiries";
  const [isMounted, setIsMounted] = useState(false);
  const { markModulesAsRead } = useEnquiryUnread();

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
      !storedPath.includes("/contactenquiry") &&
      currentPath.includes("/contactenquiry")
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

  useEffect(() => {
    if (!isMounted) return;
    void markModulesAsRead(["contact-enquiries"]);
  }, [isMounted, markModulesAsRead]);

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
        if (!currentPath.includes("/contactenquiry")) {
          markTabSwitch();
        }
      }, 100);
    };

    document.addEventListener("click", handleNavClick);
    return () => document.removeEventListener("click", handleNavClick);
  }, [markTabSwitch]);

  /** Zustand store */
  const { data, isLoading, refetch, deleteRecord } = useCommonCrud({
    module: "contact-enquiries",
    role: "admin",
    page,
    limit: recordsPerPage,
    searchValue,
    sortField,
    sortOrder,
    enabled: isMounted,
  });

  const [enquiries, setEnquiries] = useState<ContactEnquiry[]>([]);

  const totalRecords = data?.total || 0;
  const totalPages = Math.max(Math.ceil(totalRecords / recordsPerPage), 1);

  /** Sync API → local state */
  useEffect(() => {
    setEnquiries(Array.isArray(data?.enquiries) ? data.enquiries : []);
  }, [data]);

  /* ------------------- Delete functionality ------------------- */
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const handleDropdownClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + 6,
      left: rect.left - 80,
    });
    setOpenDropdownId(openDropdownId === id ? null : id);
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
    try {
      const res = await deleteRecord(deleteModalId);
      if (res?.success) {
        setEnquiries((prev) => prev.filter((e) => e._id !== deleteModalId));
      } else {
        toast.error(res?.message || "Failed to delete enquiry");
      }
    } catch {
      toast.error("Error deleting enquiry");
    } finally {
      setDeleteModalId(null);
      setOpenDropdownId(null);
      refetch();
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

  /** Table columns */
  const columns: TableColumn<ContactEnquiry>[] = [
    {
      key: "index",
      label: "#",
      render: (_row, idx) => (page - 1) * recordsPerPage + idx + 1,
    },
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (row) => {
        const name1 = `${row.first_name || ""} ${row.last_name || ""}`.trim();
        const name2 = `${row.firstname || ""} ${row.lastname || ""}`.trim();
        const name3 = row.name || "";
        const name4 = row.fullName || "";
        const name5 =
          `${row.user?.firstname || ""} ${row.user?.lastname || ""}`.trim();

        const finalName = name1 || name2 || name3 || name4 || name5 || "N/A";

        return finalName;
      },
    },
    { key: "email", label: "Email", sortable: true },
    { key: "mobile", label: "Mobile" },
    { key: "subject", label: "Subject" },
    {
      key: "created_at",
      label: "Date",
      sortable: true,
      render: (row) => new Date(row.created_at).toLocaleString("en-GB"),
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
      <div className="bg-gray-50 min-h-screen p-4 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4 relative">
      <h2 className="text-xl font-medium text-gray-800 mb-6">
        Contact Enquiries
      </h2>

      <DataTable
        columns={columns}
        data={enquiries}
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
                Confirm Delete
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete this enquiry?
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
