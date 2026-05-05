import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FiEye, FiMoreVertical, FiTrash2 } from "react-icons/fi";
import { createPortal } from "react-dom";
import { DataTable, type TableColumn } from "../../PagesComponent/DataTable";
import { useCommonCrud } from "../../../hooks/useCommonCrud";
import { useEnquiryUnread } from "../../../hooks/useEnquiryUnread";
import { useDataTableStore } from "../../../store/dataTableStore";

interface FinancialWellnessEnquiry {
  _id: string;
  name: string;
  email: string;
  phone: string;
  score: number;
  category: string;
  callback_requested?: boolean;
  created_at: string;
}

const formatDate = (value?: string) => {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleString("en-GB");
};

export default function FinancialWellnessEnquiryListing() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentRole = location.pathname.split("/").filter(Boolean)[0] || "admin";
  const MODULE_KEY = "admin-financial-wellness-enquiries";
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
      !storedPath.includes("/financial-wellness-enquiry") &&
      currentPath.includes("/financial-wellness-enquiry")
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
    return () => cacheModuleState(MODULE_KEY);
  }, [
    MODULE_KEY,
    cacheModuleState,
    lastAction,
    restoreModuleState,
    setCurrentModule,
    setPage,
  ]);

  useEffect(() => {
    if (!sortField) setSort("created_at", "desc");
  }, [setSort, sortField]);

  useEffect(() => {
    if (!isMounted) return;
    void markModulesAsRead(["financial-wellness-enquiries"]);
  }, [isMounted, markModulesAsRead]);

  const { data, isLoading, refetch, deleteRecord } = useCommonCrud<FinancialWellnessEnquiry>({
    module: "financial-assessments",
    role: "admin",
    page,
    limit: recordsPerPage,
    searchValue,
    sortField,
    sortOrder,
    enabled: isMounted,
    extraParams: {
      leadSource: "financial_wellness_enquiry",
      assessmentVariant: "money_life_check",
    },
  });

  const [enquiries, setEnquiries] = useState<FinancialWellnessEnquiry[]>([]);
  const nestedPayload = data?.data as
    | { data?: FinancialWellnessEnquiry[]; total?: number }
    | undefined;
  const totalRecords = Number(data?.total ?? nestedPayload?.total ?? 0);
  const totalPages = Math.max(Math.ceil(totalRecords / recordsPerPage), 1);

  useEffect(() => {
    const topLevelList = Array.isArray(data?.data) ? data.data : [];
    const nestedList = Array.isArray(nestedPayload?.data)
      ? nestedPayload.data
      : [];
    setEnquiries((topLevelList.length ? topLevelList : nestedList) as FinancialWellnessEnquiry[]);
  }, [data, nestedPayload]);

  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const handleDropdownClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setDropdownPos({ top: rect.bottom + 6, left: rect.left - 80 });
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
      if (!res?.success) {
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

  const Dropdown = ({ id, top, left }: { id: string; top: number; left: number }) =>
    createPortal(
      <div
        ref={dropdownRef}
        className="fixed z-[99999] rounded-xl border border-gray-200 bg-white p-1 shadow-lg"
        style={{ top, left, width: "8rem" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => {
            setOpenDropdownId(null);
            navigate(`/${currentRole}/financial-wellness-enquiry/view/${id}`);
          }}
          className="flex w-full items-center gap-2 px-4 py-2 text-left text-gray-700 transition hover:bg-gray-100"
        >
          <FiEye /> View
        </button>
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

  const columns: TableColumn<FinancialWellnessEnquiry>[] = [
    { key: "index", label: "#", render: (_row, idx) => (page - 1) * recordsPerPage + idx + 1 },
    { key: "name", label: "Name", sortable: true },
    { key: "email", label: "Email", sortable: true },
    { key: "phone", label: "Mobile", sortable: true },
    { key: "score", label: "Score", sortable: true, render: (row) => `${Number(row.score || 0)}/100` },
    { key: "category", label: "Category", sortable: true },
    { key: "callback_requested", label: "Callback", render: (row) => (row.callback_requested ? "Yes" : "No") },
    { key: "created_at", label: "Date", sortable: true, render: (row) => formatDate(row.created_at) },
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
          {openDropdownId === row._id ? (
            <Dropdown id={row._id} top={dropdownPos.top} left={dropdownPos.left} />
          ) : null}
        </>
      ),
    },
  ];

  if (!isMounted) {
    return <div className="p-4 text-gray-500">Loading...</div>;
  }

  return (
    <div className="relative min-h-screen bg-gray-50 p-4">
      <h2 className="mb-6 text-xl font-medium text-gray-800">Financial Wellness Enquiries</h2>
      <DataTable
        columns={columns}
        data={enquiries}
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

      {deleteModalId
        ? createPortal(
            <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 px-4">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Are you sure you want to delete this financial wellness enquiry?
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
          )
        : null}
    </div>
  );
}
