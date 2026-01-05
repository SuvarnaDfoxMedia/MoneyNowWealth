

// import React, { useState, useEffect } from "react";
// import { useNavigate, useParams, useSearchParams } from "react-router-dom";
// import { toast } from "react-hot-toast";
// import { FiTrash2, FiMoreVertical, FiEye } from "react-icons/fi";
// import { createPortal } from "react-dom";
// import { DataTable, TableColumn } from "../../PagesComponent/DataTable";
// import { useCommonCrud } from "../../../hooks/useCommonCrud";
// import { useDataTableStore } from "../../../store/dataTableStore";

// interface UserSubscription {
//   _id: string;
//   user_id: {
//     _id: string;
//     firstname: string;
//     lastname: string;
//     email: string; // REQUIRED to fix TS error
//   };
//   plan_id: { _id: string; name: string };
//   start_date: string | null;
//   end_date: string | null;
//   status: string;
//   trial_type?: string;
//   is_deleted?: boolean;
//   created_at: string;
// }

// interface SubscriptionApiResponse {
//   subscriptions: any[];
//   total: number;
// }

// export default function UserSubscriptionListing() {
//   const { role } = useParams<{ role: string }>();
//   const navigate = useNavigate();
//   const [searchParams, setSearchParams] = useSearchParams();

//   const {
//     page,
//     recordsPerPage,
//     searchValue,
//     sortField,
//     sortOrder,
//     setPage,
//     setRecordsPerPage,
//     setSearchValue,
//     setSort,
//   } = useDataTableStore();

//   const {
//     data: rawData,
//     refetch,
//     deleteRecord,
//   } = useCommonCrud<SubscriptionApiResponse>({
//     role,
//     module: "subscriptions",
//     page,
//     limit: recordsPerPage,
//     searchValue,
//     sortField,
//     sortOrder,
//   });

//   const data = rawData ?? { subscriptions: [], total: 0 };
//   const totalRecords = data.total ?? 0;
//   const totalPages = Math.max(Math.ceil(totalRecords / recordsPerPage), 1);

//   const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);

//   // Load page & limit from URL
//   useEffect(() => {
//     const urlPage = Number(searchParams.get("page")) || 1;
//     const urlLimit = Number(searchParams.get("limit")) || 10;
//     setPage(urlPage);
//     setRecordsPerPage(urlLimit);
//   }, []);

//   // ✨ FIXED NORMALIZATION FUNCTION (100% type-safe, no TS errors)
//   useEffect(() => {
//     const apiSubscriptions = Array.isArray(data.subscriptions)
//       ? data.subscriptions
//       : [];

//     const normalized = apiSubscriptions
//       .map((item: any): UserSubscription | null => {
//         const user = item.user;
//         const subscription = item.subscription;

//         if (!subscription || !user || subscription.is_deleted) return null;

//         return {
//           _id: subscription._id,
//           user_id: {
//             _id: user._id,
//             firstname: user.firstname,
//             lastname: user.lastname,
//             email: user.email ?? "", 
//           },
//           plan_id: {
//             _id: subscription.plan_id?._id ?? "N/A",
//             name: subscription.plan_id?.name ?? "N/A",
//           },
//           start_date: subscription.start_date,
//           end_date: subscription.end_date,
//           status: subscription.status,
//           trial_type: subscription.trial_type,
//           is_deleted: subscription.is_deleted,
//           created_at: subscription.created_at,
//         };
//       })
//       .filter((s): s is UserSubscription => s !== null); // ✔ Type predicate now valid

//     setSubscriptions(normalized);
//   }, [data]);

//   // Update URL
//   useEffect(() => {
//     setSearchParams({
//       page: String(page),
//       limit: String(recordsPerPage),
//     });
//   }, [page, recordsPerPage]);

//   // Debounced refetch
//   useEffect(() => {
//     const timer = setTimeout(() => refetch(), 400);
//     return () => clearTimeout(timer);
//   }, [searchValue, sortField, sortOrder, page, recordsPerPage]);

//   // Delete
//   const [deleteModalId, setDeleteModalId] = useState<string | null>(null);

//   const handleDelete = async () => {
//     if (!deleteModalId) return;

//     const response = await deleteRecord(deleteModalId);

//     if (response?.success) {
//       toast.success("Subscription soft deleted successfully");
//       refetch();
//     } else {
//       toast.error(response?.message || "Delete failed");
//     }

//     setDeleteModalId(null);
//   };

//   // Dropdown
//   const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
//   const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

//   const handleDropdownClick = (
//     e: React.MouseEvent<HTMLButtonElement>,
//     id: string
//   ) => {
//     const rect = e.currentTarget.getBoundingClientRect();
//     setDropdownPos({ top: rect.bottom + window.scrollY, left: rect.right - 144 });
//     setOpenDropdownId(openDropdownId === id ? null : id);
//   };

//   const Dropdown = ({
//     id,
//     top,
//     left,
//   }: {
//     id: string;
//     top: number;
//     left: number;
//   }) =>
//     createPortal(
//       <div
//         className="absolute bg-white border rounded-xl shadow-lg z-50"
//         style={{ top, left, width: "12rem" }}
//       >
//         <button
//           onClick={() => {
//             navigate(`/user/invoice/${id}`);
//             setOpenDropdownId(null);
//           }}
//           className="flex items-center gap-2 px-4 py-2 hover:bg-indigo-50 w-full"
//         >
//           <FiEye /> View Invoice
//         </button>

//         <button
//           onClick={() => {
//             navigate(`/${role}/user/customer-history/${id}`);
//             setOpenDropdownId(null);
//           }}
//           className="flex items-center gap-2 px-4 py-2 hover:bg-indigo-50 w-full"
//         >
//           <FiEye /> Payment History
//         </button>

//         <button
//           onClick={() => {
//             setDeleteModalId(id);
//             setOpenDropdownId(null);
//           }}
//           className="flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-red-600 w-full"
//         >
//           <FiTrash2 /> Delete
//         </button>
//       </div>,
//       document.body
//     );

//   // Helpers
//   const getStatusBadge = (status: string) => {
//     const map: Record<string, string> = {
//       new: "bg-blue-100 text-blue-700",
//       upgrade: "bg-green-100 text-green-700",
//       downgrade: "bg-red-100 text-red-700",
//     };

//     return (
//       <span
//         className={`px-3 py-1 rounded-full text-sm font-semibold ${
//           map[status] || map.new
//         }`}
//       >
//         {status.toUpperCase()}
//       </span>
//     );
//   };

//   const getDuration = (start: string | null, end: string | null) => {
//     if (!start || !end) return "N/A";

//     const diffDays = Math.ceil(
//       (new Date(end).getTime() - new Date(start).getTime()) /
//         (1000 * 60 * 60 * 24)
//     );

//     if (diffDays >= 365) return `${Math.floor(diffDays / 365)} year`;
//     if (diffDays >= 30) return `${Math.floor(diffDays / 30)} month`;

//     return `${diffDays} day`;
//   };

//   const columns: TableColumn<UserSubscription>[] = [
//     {
//       key: "index",
//       label: "#",
//       render: (_row, idx) => (page - 1) * recordsPerPage + idx + 1,
//     },
//     {
//       key: "user",
//       label: "User",
//       render: (row) =>
//         `${row.user_id.firstname} ${row.user_id.lastname}`.trim(),
//     },
//     { key: "plan", label: "Plan", render: (row) => row.plan_id.name },
//     {
//       key: "duration",
//       label: "Duration",
//       render: (row) => getDuration(row.start_date, row.end_date),
//     },
//     {
//       key: "start_date",
//       label: "Start Date",
//       sortable: true,
//       render: (row) =>
//         row.start_date ? new Date(row.start_date).toLocaleDateString() : "N/A",
//     },
//     {
//       key: "end_date",
//       label: "End Date",
//       sortable: true,
//       render: (row) =>
//         row.end_date ? new Date(row.end_date).toLocaleDateString() : "N/A",
//     },
//     {
//       key: "status",
//       label: "Status",
//       render: (row) => getStatusBadge(row.status),
//     },
//     {
//       key: "actions",
//       label: "Actions",
//       render: (row) => (
//         <>
//           <button
//             onClick={(e) => handleDropdownClick(e, row._id)}
//             className="p-2 rounded-full hover:bg-gray-100"
//           >
//             <FiMoreVertical size={18} />
//           </button>

//           {openDropdownId === row._id && (
//             <Dropdown
//               id={row._id}
//               top={dropdownPos.top}
//               left={dropdownPos.left}
//             />
//           )}
//         </>
//       ),
//     },
//   ];

//   return (
//     <div className="bg-gray-50 min-h-screen p-4 relative">
//       <div className="flex justify-between mb-6">
//         <h2 className="text-xl font-medium">User Subscriptions</h2>
//       </div>

//       <DataTable
//         columns={columns}
//         data={subscriptions}
//         page={page}
//         totalPages={totalPages}
//         totalRecords={totalRecords}
//         recordsPerPage={recordsPerPage}
//         onPageChange={setPage}
//         onRecordsPerPageChange={setRecordsPerPage}
//         searchValue={searchValue}
//         onSearchChange={setSearchValue}
//         sortField={sortField}
//         sortOrder={sortOrder}
//         onSortChange={(field, order) => setSort(field, order)}
//       />

//       {/* Delete Modal */}
//       {deleteModalId &&
//         createPortal(
//           <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-[99999]">
//             <div className="bg-white p-6 rounded-xl shadow-xl w-96">
//               <h3 className="text-lg font-semibold">Confirm Delete</h3>
//               <p className="my-4 text-gray-600">
//                 Are you sure you want to delete this subscription?
//               </p>
//               <div className="flex justify-end gap-3">
//                 <button
//                   onClick={() => setDeleteModalId(null)}
//                   className="border px-4 py-2 rounded-lg"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleDelete}
//                   className="bg-red-600 text-white px-4 py-2 rounded-lg"
//                 >
//                   Delete
//                 </button>
//               </div>
//             </div>
//           </div>,
//           document.body
//         )}
//     </div>
//   );
// }


import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FiTrash2, FiMoreVertical, FiEye } from "react-icons/fi";
import { createPortal } from "react-dom";
import { DataTable, TableColumn } from "../../PagesComponent/DataTable";
import { useCommonCrud } from "../../../hooks/useCommonCrud";
import { useDataTableStore } from "../../../store/dataTableStore";

interface UserSubscription {
  _id: string;
  user_id: { _id: string; firstname: string; lastname: string; email: string };
  plan_id: { _id: string; name: string };
  start_date: string | null;
  end_date: string | null;
  status: string;
  trial_type?: string;
  is_deleted?: boolean;
  created_at: string;
}

interface SubscriptionApiResponse {
  subscriptions: any[];
  total: number;
}

export default function UserSubscriptionListing() {
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
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

  const { data: rawData, refetch, deleteRecord } = useCommonCrud<SubscriptionApiResponse>({
    role,
    module: "subscriptions",
    page,
    limit: recordsPerPage,
    searchValue,
    sortField,
    sortOrder,
  });

  const data = rawData ?? { subscriptions: [], total: 0 };
  const totalRecords = data.total ?? 0;
  const totalPages = Math.max(Math.ceil(totalRecords / recordsPerPage), 1);

  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);

  // Load page & limit from URL
  useEffect(() => {
    setPage(Number(searchParams.get("page")) || 1);
    setRecordsPerPage(Number(searchParams.get("limit")) || 10);
  }, []);

  // Normalize API response
  useEffect(() => {
    const apiSubscriptions = Array.isArray(data.subscriptions) ? data.subscriptions : [];
    const normalized = apiSubscriptions
      .map((item: any): UserSubscription | null => {
        const user = item.user;
        const subscription = item.subscription;
        if (!subscription || !user || subscription.is_deleted) return null;
        return {
          _id: subscription._id,
          user_id: { _id: user._id, firstname: user.firstname, lastname: user.lastname, email: user.email ?? "" },
          plan_id: { _id: subscription.plan_id?._id ?? "N/A", name: subscription.plan_id?.name ?? "N/A" },
          start_date: subscription.start_date,
          end_date: subscription.end_date,
          status: subscription.status,
          trial_type: subscription.trial_type,
          is_deleted: subscription.is_deleted,
          created_at: subscription.created_at,
        };
      })
      .filter((s): s is UserSubscription => s !== null);

    setSubscriptions(normalized);
  }, [data]);

  // Update URL
  useEffect(() => {
    setSearchParams({ page: String(page), limit: String(recordsPerPage) });
  }, [page, recordsPerPage]);

  // Debounced refetch
  useEffect(() => {
    const timer = setTimeout(() => refetch(), 400);
    return () => clearTimeout(timer);
  }, [searchValue, sortField, sortOrder, page, recordsPerPage]);

  // Delete
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
  const handleDelete = async () => {
    if (!deleteModalId) return;
    const response = await deleteRecord(deleteModalId);
    if (response?.success) {
      toast.success("Subscription soft deleted successfully");
      refetch();
    } else {
      toast.error(response?.message || "Delete failed");
    }
    setDeleteModalId(null);
  };

  // Dropdown
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  const handleDropdownClick = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setDropdownPos({ top: rect.bottom + window.scrollY, left: rect.right - 144 });
    setOpenDropdownId(openDropdownId === id ? null : id);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const Dropdown = ({ id, top, left }: { id: string; top: number; left: number }) =>
    createPortal(
      <div
        ref={dropdownRef}
        className="absolute bg-white border rounded-xl shadow-lg z-50"
        style={{ top, left, width: "12rem" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => {
            navigate(`/user/invoice/${id}`);
            setOpenDropdownId(null);
          }}
          className="flex items-center gap-2 px-4 py-2 hover:bg-indigo-50 w-full"
        >
          <FiEye /> View Invoice
        </button>
        <button
          onClick={() => {
            navigate(`/${role}/user/customer-history/${id}`);
            setOpenDropdownId(null);
          }}
          className="flex items-center gap-2 px-4 py-2 hover:bg-indigo-50 w-full"
        >
          <FiEye /> Payment History
        </button>
        <button
          onClick={() => {
            setDeleteModalId(id);
            setOpenDropdownId(null);
          }}
          className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 w-full"
        >
          <FiTrash2 /> Delete
        </button>
      </div>,
      document.body
    );

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      new: "bg-blue-100 text-blue-700",
      upgrade: "bg-green-100 text-green-700",
      downgrade: "bg-red-100 text-red-700",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${map[status] || map.new}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const getDuration = (start: string | null, end: string | null) => {
    if (!start || !end) return "N/A";
    const diffDays = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays >= 365) return `${Math.floor(diffDays / 365)} year`;
    if (diffDays >= 30) return `${Math.floor(diffDays / 30)} month`;
    return `${diffDays} day`;
  };

  const columns: TableColumn<UserSubscription>[] = [
    { key: "index", label: "#", render: (_row, idx) => (page - 1) * recordsPerPage + idx + 1 },
    { key: "user", label: "User", render: (row) => `${row.user_id.firstname} ${row.user_id.lastname}`.trim() },
    { key: "plan", label: "Plan", render: (row) => row.plan_id.name },
    { key: "duration", label: "Duration", render: (row) => getDuration(row.start_date, row.end_date) },
    { key: "start_date", label: "Start Date", sortable: true, render: (row) => row.start_date ? new Date(row.start_date).toLocaleDateString() : "N/A" },
    { key: "end_date", label: "End Date", sortable: true, render: (row) => row.end_date ? new Date(row.end_date).toLocaleDateString() : "N/A" },
    { key: "status", label: "Status", render: (row) => getStatusBadge(row.status) },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <>
          <button onClick={(e) => handleDropdownClick(e, row._id)} className="p-2 rounded-full hover:bg-gray-100">
            <FiMoreVertical size={18} />
          </button>
          {openDropdownId === row._id && <Dropdown id={row._id} top={dropdownPos.top} left={dropdownPos.left} />}
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
      />

      {/* Delete Modal */}
      {deleteModalId &&
        createPortal(
          <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-[99999]">
            <div className="bg-white p-6 rounded-xl shadow-xl w-96">
              <h3 className="text-lg font-semibold">Confirm Delete</h3>
              <p className="my-4 text-gray-600">Are you sure you want to delete this subscription?</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setDeleteModalId(null)} className="border px-4 py-2 rounded-lg">Cancel</button>
                <button onClick={handleDelete} className="bg-red-600 text-white px-4 py-2 rounded-lg">Delete</button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
