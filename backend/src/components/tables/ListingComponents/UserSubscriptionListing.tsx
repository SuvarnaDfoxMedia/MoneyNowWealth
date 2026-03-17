import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FiTrash2, FiMoreVertical, FiEye } from "react-icons/fi";
import { createPortal } from "react-dom";
import { DataTable, TableColumn } from "../../PagesComponent/DataTable";
import useSubscriptionCrud, {
  SubscriptionItem,
} from "../../../hooks/useSubscriptionCrud";
import { useDataTableStore } from "../../../store/dataTableStore";

interface UserSubscription {
  _id: string;
  user_id: {
    _id: string;
    firstname: string;
    lastname: string;
    email: string;
    mobile?: string;
  };
  plan_id: { _id: string; name: string };
  start_date: string | null;
  end_date: string | null;
  status: string;
  trial_type?: string;
  is_deleted?: boolean;
  created_at: string;
  last_payment_id?: unknown;
}

export default function UserSubscriptionListing() {
  const { role = "admin" } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

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

  const {
    data: rawData,
    extractList: subscriptionItems,
    isLoading,
    refetch,
    deleteRecord,
    isDeleting,
  } = useSubscriptionCrud({
    page,
    limit: recordsPerPage,
    searchValue,
    sortField,
    sortOrder,
  });

  const data = rawData || { data: [], total: 0 };
  const totalRecords = data.total ?? 0;
  const totalPages = Math.max(Math.ceil(totalRecords / recordsPerPage), 1);

  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);

  //  Normalize API response into table rows
  useEffect(() => {
    const itemsWithSubscription = (
      subscriptionItems as SubscriptionItem[]
    ).filter((item) => item.subscription !== null);

    const normalized = itemsWithSubscription
      .map((item: SubscriptionItem): UserSubscription | null => {
        const user = item.user;
        const subscription = item.subscription;

        if (!subscription || !user) return null;

        // Skip deleted
        if (subscription.is_deleted) return null;

        return {
          _id: subscription._id || "N/A",
          user_id: {
            _id: user._id,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            mobile: user.mobile,
          },
          plan_id: {
            _id: subscription.plan_id?._id || subscription.plan_id?.id || "N/A",
            name: subscription.plan_id?.name || "N/A",
          },
          start_date: subscription.start_date ?? null,
          end_date: subscription.end_date ?? null,

          //  FIX: status should toggle like before
          status: item.currentStatus || subscription.status || "new",

          trial_type: subscription.trial_type,
          is_deleted: subscription.is_deleted || false,
          created_at: subscription.created_at || "",
          last_payment_id: subscription.last_payment_id,
        };
      })
      .filter((s): s is UserSubscription => s !== null);

    setSubscriptions(normalized);
  }, [subscriptionItems]);

  //  Debounced refetch
  useEffect(() => {
    const timer = setTimeout(() => refetch(), 400);
    return () => clearTimeout(timer);
  }, [searchValue, sortField, sortOrder, page, recordsPerPage]);

  //  Delete
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteModalId) return;

    try {
      const response = await deleteRecord(deleteModalId);

      if (response?.success) {
        toast.success(response?.message || "Subscription deleted successfully");
        refetch();
      } else {
        toast.error(response?.message || "Delete failed");
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Delete failed";
      toast.error(message);
    } finally {
      setDeleteModalId(null);
    }
  };

  //  Dropdown
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [currentRowData, setCurrentRowData] = useState<UserSubscription | null>(
    null,
  );

  const handleDropdownClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    row: UserSubscription,
  ) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();

    setDropdownPos({
      top: rect.bottom + window.scrollY,
      left: rect.right - 144,
    });

    setCurrentRowData(row);
    setOpenDropdownId(openDropdownId === row._id ? null : row._id);
  };

  // Close dropdown on outside click
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

  const Dropdown = ({
    rowData,
    top,
    left,
  }: {
    rowData: UserSubscription;
    top: number;
    left: number;
  }) =>
    createPortal(
      <div
        ref={dropdownRef}
        className="absolute bg-white border rounded-xl shadow-lg z-50"
        style={{ top, left, width: "12rem" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => {
            navigate(`/user/invoice/${rowData._id}`);
            setOpenDropdownId(null);
          }}
          className="flex items-center gap-2 px-4 py-2 hover:bg-indigo-50 w-full"
        >
          <FiEye /> View Invoice
        </button>

        <button
          onClick={() => {
            navigate(`/${role}/user/customer-history/${rowData.user_id._id}`);
            setOpenDropdownId(null);
          }}
          className="flex items-center gap-2 px-4 py-2 hover:bg-indigo-50 w-full"
        >
          <FiEye /> View Payments
        </button>

        <button
          onClick={() => {
            setDeleteModalId(rowData._id);
            setOpenDropdownId(null);
          }}
          className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 w-full"
        >
          <FiTrash2 /> Delete
        </button>
      </div>,
      document.body,
    );

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      new: "bg-blue-100 text-blue-700",
      upgrade: "bg-green-100 text-green-700",
      downgrade: "bg-red-100 text-red-700",
      active: "bg-green-100 text-green-700",
      inactive: "bg-gray-100 text-gray-700",
      none: "bg-gray-100 text-gray-700",
    };

    const statusKey = (status || "new").toLowerCase();

    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-semibold ${
          map[statusKey] || map.new
        }`}
      >
        {(status || "NEW").toUpperCase()}
      </span>
    );
  };

  const getDuration = (start: string | null, end: string | null) => {
    if (!start || !end) return "N/A";

    try {
      const diffDays = Math.ceil(
        (new Date(end).getTime() - new Date(start).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      if (diffDays >= 365) return `${Math.floor(diffDays / 365)} year`;
      if (diffDays >= 30) return `${Math.floor(diffDays / 30)} month`;
      return `${diffDays} day`;
    } catch {
      return "N/A";
    }
  };

  const columns: TableColumn<UserSubscription>[] = [
    {
      key: "index",
      label: "#",
      render: (_row, idx) => (page - 1) * recordsPerPage + idx + 1,
    },
    {
      key: "user",
      label: "User",
      render: (row) =>
        `${row.user_id.firstname} ${row.user_id.lastname}`.trim(),
    },
    { key: "plan", label: "Plan", render: (row) => row.plan_id.name },
    {
      key: "duration",
      label: "Duration",
      render: (row) => getDuration(row.start_date, row.end_date),
    },
    {
      key: "start_date",
      label: "Start Date",
      sortable: true,
      render: (row) =>
        row.start_date ? new Date(row.start_date).toLocaleDateString("en-GB") : "N/A",
    },
    {
      key: "end_date",
      label: "End Date",
      sortable: true,
      render: (row) =>
        row.end_date ? new Date(row.end_date).toLocaleDateString("en-GB") : "N/A",
    },
    {
      key: "status",
      label: "Status",
      render: (row) => getStatusBadge(row.status),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <>
          <button
            onClick={(e) => handleDropdownClick(e, row)}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <FiMoreVertical size={18} />
          </button>

          {openDropdownId === row._id && currentRowData && (
            <Dropdown
              rowData={currentRowData}
              top={dropdownPos.top}
              left={dropdownPos.left}
            />
          )}
        </>
      ),
    },
  ];

  return (
    <div className="bg-gray-50 min-h-screen p-4 relative">
      <h2 className="text-xl font-medium mb-6">User Subscriptions</h2>

      <DataTable
        columns={columns}
        data={subscriptions}
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
        onSortChange={(field, order) => setSort(field, order)}
        // emptyMessage="No subscriptions found."
      />

      {/* Delete Modal */}
      {deleteModalId &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900">
                Confirm Delete
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete this subscription?
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setDeleteModalId(null)}
                  className="h-10 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-60"
                  disabled={isDeleting}
                >
                  Cancel
                </button>

                <button
                  onClick={handleDelete}
                  className="h-10 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

