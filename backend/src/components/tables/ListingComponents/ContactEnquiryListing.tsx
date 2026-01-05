

"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FiTrash2, FiMoreVertical } from "react-icons/fi";
import { createPortal } from "react-dom";
import { DataTable, TableColumn } from "../../PagesComponent/DataTable";
import { useCommonCrud } from "../../../hooks/useCommonCrud";
import { useDataTableStore } from "../../../store/dataTableStore";

interface ContactEnquiry {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  subject: string;
  message: string;
  status: string;
  is_active: number;
  created_at: string;
}

export default function ContactEnquiryListing() {
  const [searchParams, setSearchParams] = useSearchParams();

  /** Zustand store */
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
  } = useDataTableStore();

  /** Restore URL */
  useEffect(() => {
    const urlPage = Number(searchParams.get("page")) || 1;
    const urlLimit = Number(searchParams.get("limit")) || 10;
    setPage(urlPage);
    setRecordsPerPage(urlLimit);
  }, []);

  /** Fetch data */
  const { data, isLoading, refetch, deleteRecord } = useCommonCrud({
    module: "contact-enquiries",
    role: "admin",
    page,
    limit: recordsPerPage,
    searchValue, // ✅ correct
    sortField,
    sortOrder,
  });

  const [enquiries, setEnquiries] = useState<ContactEnquiry[]>([]);

  const totalRecords = data?.total || 0;
  const totalPages = Math.max(Math.ceil(totalRecords / recordsPerPage), 1);

  /** Sync API → local state */
  useEffect(() => {
    setEnquiries(Array.isArray(data?.enquiries) ? data.enquiries : []);
  }, [data]);

  /** Sync Zustand → URL */
  useEffect(() => {
    setSearchParams({
      page: String(page),
      limit: String(recordsPerPage),
    });
  }, [page, recordsPerPage]);

  /** Debounced search & reload */
  useEffect(() => {
    const timer = setTimeout(() => refetch(), 300);
    return () => clearTimeout(timer);
  }, [searchValue, sortField, sortOrder, page, recordsPerPage]);

  /** Dropdown + Delete Modal */
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  const handleDropdownClick = (e: React.MouseEvent, id: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + window.scrollY,
      left: rect.right - 144,
    });
    setOpenDropdownId(openDropdownId === id ? null : id);
  };

  const handleDelete = async () => {
    if (!deleteModalId) return;
    try {
      const res = await deleteRecord(deleteModalId);
      if (res?.success) {
        toast.success("Enquiry deleted successfully");
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

  /** Dropdown component */
  const Dropdown = ({ id, top, left }: { id: string; top: number; left: number }) =>
    createPortal(
      <div
        className="absolute bg-white border rounded-xl shadow-lg z-50"
        style={{ top, left, width: "8rem" }}
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
      document.body
    );

  /** Table columns */
  const columns: TableColumn<ContactEnquiry>[] = [
    {
      key: "index",
      label: "#",
      render: (_row, idx) => (page - 1) * recordsPerPage + idx + 1,
    },
    { key: "name", label: "Name", sortable: true },
    { key: "email", label: "Email", sortable: true },
    { key: "mobile", label: "Mobile" },
    { key: "subject", label: "Subject" },
    {
      key: "created_at",
      label: "Date",
      sortable: true,
      render: (row) => new Date(row.created_at).toLocaleString(),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <>
          <button
            onClick={(e) => handleDropdownClick(e, row._id)}
            className="p-2 rounded-full hover:bg-gray-100 transition"
          >
            <FiMoreVertical size={18} />
          </button>

          {openDropdownId === row._id && (
            <Dropdown id={row._id} top={dropdownPos.top} left={dropdownPos.left} />
          )}
        </>
      ),
    },
  ];

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
        searchValue={searchValue} // ✅ correct
        onSearchChange={setSearchValue} // ✅ correct
        sortField={sortField}
        sortOrder={sortOrder}
        onPageChange={setPage}
        onRecordsPerPageChange={setRecordsPerPage}
        onSortChange={(field, order) => setSort(field, order)}
      />

      {deleteModalId &&
        createPortal(
          <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-[99999]">
            <div className="bg-white p-6 rounded-xl w-96">
              <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
              <p className="mb-6 text-gray-600">
                Are you sure you want to delete this enquiry?
              </p>

              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setDeleteModalId(null)}
                  className="px-4 py-2 rounded-lg border hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
