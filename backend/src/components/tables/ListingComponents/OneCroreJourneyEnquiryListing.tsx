import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FiMoreVertical, FiTrash2 } from "react-icons/fi";
import { createPortal } from "react-dom";
import { DataTable, type TableColumn } from "../../PagesComponent/DataTable";
import { useCommonCrud } from "../../../hooks/useCommonCrud";
import { useEnquiryUnread } from "../../../hooks/useEnquiryUnread";
import { useDataTableStore } from "../../../store/dataTableStore";

interface OneCroreJourneyEnquiry {
  _id: string;
  full_name: string;
  email: string;
  mobile: string;
  country_code?: string;
  wants_callback: boolean;
  wealth_amount: number;
  user_sip_capacity: number;
  years: number;
  expected_return: number;
  inflation_rate: number;
  required_sip: number;
  invested_amount: number;
  growth_amount: number;
  target_wealth: number;
  created_at: string;
}

const formatCurrency = (value?: number) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

const formatDate = (value?: string) => {
  if (!value) return "N/A";

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleString("en-GB");
};

export default function OneCroreJourneyEnquiryListing() {
  const location = useLocation();
  const MODULE_KEY = "admin-one-crore-journey-enquiries";
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

  useEffect(() => {
    const currentPath = location.pathname;
    const storedPath = sessionStorage.getItem("lastPath");

    if (
      storedPath &&
      !storedPath.includes("/one-crore-journey-enquiry") &&
      currentPath.includes("/one-crore-journey-enquiry")
    ) {
      markTabSwitch();
    }

    sessionStorage.setItem("lastPath", currentPath);
  }, [location.pathname, markTabSwitch]);

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
    void markModulesAsRead(["one-crore-journey-enquiries"]);
  }, [isMounted, markModulesAsRead]);

  useEffect(() => {
    const handleNavClick = () => {
      setTimeout(() => {
        const currentPath = window.location.pathname;
        if (!currentPath.includes("/one-crore-journey-enquiry")) {
          markTabSwitch();
        }
      }, 100);
    };

    document.addEventListener("click", handleNavClick);
    return () => document.removeEventListener("click", handleNavClick);
  }, [markTabSwitch]);

  const { data, extractList, isLoading, refetch, deleteRecord } =
    useCommonCrud<OneCroreJourneyEnquiry>({
      module: "one-crore-journey-enquiries",
      role: "admin",
      page,
      limit: recordsPerPage,
      searchValue,
      sortField,
      sortOrder,
      enabled: isMounted,
    });

  const [enquiries, setEnquiries] = useState<OneCroreJourneyEnquiry[]>([]);
  const totalRecords = data?.total || 0;
  const totalPages = Math.max(Math.ceil(totalRecords / recordsPerPage), 1);

  useEffect(() => {
    if (Array.isArray(data?.enquiries)) {
      setEnquiries(data.enquiries);
      return;
    }

    setEnquiries(Array.isArray(extractList) ? extractList : []);
  }, [data, extractList]);

  useEffect(() => {
    if (!isMounted) return;

    const timer = setTimeout(() => refetch(), 300);
    return () => clearTimeout(timer);
  }, [searchValue, sortField, sortOrder, page, recordsPerPage, isMounted]);

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
        toast.success("One crore journey enquiry deleted successfully");
        setEnquiries((prev) =>
          prev.filter((entry) => entry._id !== deleteModalId),
        );
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
          className="flex w-full items-center gap-2 px-4 py-2 text-left text-red-600 transition hover:bg-red-50"
        >
          <FiTrash2 /> Delete
        </button>
      </div>,
      document.body,
    );

  const columns: TableColumn<OneCroreJourneyEnquiry>[] = [
    {
      key: "index",
      label: "#",
      render: (_row, idx) => (page - 1) * recordsPerPage + idx + 1,
    },
    { key: "full_name", label: "Name", sortable: true },
    { key: "email", label: "Email", sortable: true },
    {
      key: "mobile",
      label: "Mobile",
      render: (row) =>
        `${row.country_code ? `${row.country_code} ` : ""}${row.mobile}`.trim() ||
        "N/A",
    },
    {
      key: "required_sip",
      label: "Required SIP",
      sortable: true,
      render: (row) => formatCurrency(row.required_sip),
    },
    {
      key: "target_wealth",
      label: "Target Wealth",
      sortable: true,
      render: (row) => formatCurrency(row.target_wealth),
    },
    {
      key: "years",
      label: "Years",
      sortable: true,
      render: (row) => `${row.years} years`,
    },
    {
      key: "wants_callback",
      label: "Callback",
      render: (row) => (row.wants_callback ? "Yes" : "No"),
    },
    {
      key: "created_at",
      label: "Date",
      sortable: true,
      render: (row) => formatDate(row.created_at),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => handleDropdownClick(e, row._id)}
            className="rounded-full p-2 hover:bg-gray-100"
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-50 p-4">
      <h2 className="mb-6 text-xl font-medium text-gray-800">
        One Crore Journey Enquiries
      </h2>

      <DataTable
        columns={columns}
        data={enquiries}
        loading={isLoading}
        page={page}
        totalPages={totalPages}
        totalRecords={totalRecords}
        recordsPerPage={recordsPerPage}
        onPageChange={(newPage) => setPage(newPage)}
        onRecordsPerPageChange={(value) => setRecordsPerPage(value)}
        searchValue={searchValue}
        onSearchChange={(value) => setSearchValue(value)}
        sortField={sortField}
        sortOrder={sortOrder}
        onSortChange={(field, order) => setSort(field, order)}
      />

      {deleteModalId &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900">
                Confirm Delete
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete this one crore journey enquiry?
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
