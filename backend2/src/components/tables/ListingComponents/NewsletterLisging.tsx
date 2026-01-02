// "use client";

// import React, { useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import { toast } from "react-hot-toast";
// import { FiTrash2, FiMoreVertical } from "react-icons/fi";
// import { createPortal } from "react-dom";
// import { DataTable, TableColumn } from "../../PagesComponent/DataTable";
// import { useCommonCrud } from "../../../hooks/useCommonCrud";
// import { useDataTableStore } from "../../../store/dataTableStore";

// interface Subscriber {
//   _id: string;
//   name: string;
//   email: string;
//   created_at: string;
//   is_deleted: boolean;
// }

// export default function NewsletterListing() {
//   const { role } = useParams<{ role: string }>();

//   const { page, recordsPerPage, searchValue, sortField, sortOrder, setPage, setRecordsPerPage, setSearchValue, setSort } =
//     useDataTableStore();

//   // ------------------- Fetch Data (CRUD Hook) -------------------
//   const { data, extractList, refetch, deleteRecord, isLoading } = useCommonCrud<Subscriber>({
//     role,
//     module: "newsletter",
//     page,
//     limit: recordsPerPage,
//     searchValue,
//     sortField,
//     sortOrder,
//   });

//   const [subscribers, setSubscribers] = useState<Subscriber[]>([]);

//   useEffect(() => {
//     setSubscribers(extractList);
//   }, [extractList]);

//   const totalRecords = data.total ?? 0;
//   const totalPages = Math.max(Math.ceil(totalRecords / recordsPerPage), 1);

//   /* ------------------- Debounced Refetch ------------------- */
//   useEffect(() => {
//     const timer = setTimeout(() => refetch(), 300);
//     return () => clearTimeout(timer);
//   }, [searchValue, sortField, sortOrder, page]);

//   /* ------------------- Dropdown & Delete ------------------- */
//   const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
//   const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
//   const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

//   const handleDropdownClick = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
//     const rect = e.currentTarget.getBoundingClientRect();
//     setDropdownPos({
//       top: rect.bottom + window.scrollY,
//       left: rect.right - 144,
//     });
//     setOpenDropdownId((prev) => (prev === id ? null : id));
//   };

//   const handleDelete = async () => {
//     if (!deleteModalId) return;

//     const res = await deleteRecord(deleteModalId);
//     if (res?.success) {
//       toast.success("Subscriber deleted");
//       refetch();
//     } else {
//       toast.error(res?.message || "Delete failed");
//     }
//     setDeleteModalId(null);
//   };

//   const Dropdown = ({ id, top, left }: { id: string; top: number; left: number }) =>
//     createPortal(
//       <div className="absolute bg-white border rounded-xl shadow-lg z-50" style={{ top, left, width: "8rem" }}>
//         <button
//           onClick={() => {
//             setDeleteModalId(id);
//             setOpenDropdownId(null);
//           }}
//           className="flex items-center gap-2 px-4 py-2 hover:bg-red-50 w-full text-left text-red-600 transition"
//         >
//           <FiTrash2 /> Delete
//         </button>
//       </div>,
//       document.body
//     );

//   /* ------------------- Table Columns ------------------- */
//   const columns: TableColumn<Subscriber>[] = [
//     { key: "index", label: "#", render: (_row, idx) => (page - 1) * recordsPerPage + idx + 1 },
//     { key: "name", label: "Name", sortable: true, render: (r) => r.name },
//     { key: "email", label: "Email", sortable: true, render: (r) => r.email },
//     {
//       key: "created_at",
//       label: "Subscribed Date",
//       sortable: true,
//       render: (r) => new Date(r.created_at).toLocaleString(),
//     },
//     {
//       key: "actions",
//       label: "Actions",
//       render: (row) => (
//         <>
//           <button onClick={(e) => handleDropdownClick(e, row._id)} className="p-2 hover:bg-gray-100 rounded-full">
//             <FiMoreVertical size={18} />
//           </button>
//           {openDropdownId === row._id && <Dropdown id={row._id} top={dropdownPos.top} left={dropdownPos.left} />}
//         </>
//       ),
//     },
//   ];

//   return (
//     <div className="p-4 bg-gray-50 min-h-screen">
//       <h2 className="text-xl font-medium mb-6">Newsletter Subscribers</h2>

//       <DataTable
//         columns={columns}
//         data={subscribers}
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
//         loading={isLoading}
//       />

//       {/* Delete Modal */}
//       {deleteModalId &&
//         createPortal(
//           <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-[9999]">
//             <div className="bg-white p-6 rounded-xl shadow-xl w-80">
//               <h2 className="text-lg font-medium mb-4">Delete Subscriber?</h2>
//               <p className="text-sm text-gray-600 mb-6">Are you sure you want to delete this subscriber?</p>

//               <div className="flex justify-end gap-3">
//                 <button onClick={() => setDeleteModalId(null)} className="px-4 py-2 rounded bg-gray-200">
//                   Cancel
//                 </button>

//                 <button onClick={handleDelete} className="px-4 py-2 rounded bg-red-600 text-white">
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


"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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

  // ------------------- Fetch Data (CRUD Hook) -------------------
  const { data, extractList, refetch, deleteRecord, isLoading } = useCommonCrud<Subscriber>({
    role,
    module: "newsletter",
    page,
    limit: recordsPerPage,
    searchValue,
    sortField,
    sortOrder,
  });

  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);

  useEffect(() => {
    setSubscribers(extractList);
  }, [extractList]);

  // ✅ Fix: optional chaining
  const totalRecords = data?.total ?? 0;
  const totalPages = Math.max(Math.ceil(totalRecords / recordsPerPage), 1);

  /* ------------------- Debounced Refetch ------------------- */
  useEffect(() => {
    const timer = setTimeout(() => refetch(), 300);
    return () => clearTimeout(timer);
  }, [searchValue, sortField, sortOrder, page]);

  /* ------------------- Dropdown & Delete ------------------- */
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  const handleDropdownClick = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + window.scrollY,
      left: rect.right - 144,
    });
    setOpenDropdownId((prev) => (prev === id ? null : id));
  };

  const handleDelete = async () => {
    if (!deleteModalId) return;

    const res = await deleteRecord(deleteModalId);
    if (res?.success) {
      toast.success("Subscriber deleted");
      refetch();
    } else {
      toast.error(res?.message || "Delete failed");
    }
    setDeleteModalId(null);
  };

  const Dropdown = ({ id, top, left }: { id: string; top: number; left: number }) =>
    createPortal(
      <div className="absolute bg-white border rounded-xl shadow-lg z-50" style={{ top, left, width: "8rem" }}>
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

  /* ------------------- Table Columns ------------------- */
  const columns: TableColumn<Subscriber>[] = [
    { key: "index", label: "#", render: (_row, idx) => (page - 1) * recordsPerPage + idx + 1 },
    { key: "name", label: "Name", sortable: true, render: (r) => r.name },
    { key: "email", label: "Email", sortable: true, render: (r) => r.email },
    {
      key: "created_at",
      label: "Subscribed Date",
      sortable: true,
      render: (r) => new Date(r.created_at).toLocaleString(),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <>
          <button onClick={(e) => handleDropdownClick(e, row._id)} className="p-2 hover:bg-gray-100 rounded-full">
            <FiMoreVertical size={18} />
          </button>
          {openDropdownId === row._id && <Dropdown id={row._id} top={dropdownPos.top} left={dropdownPos.left} />}
        </>
      ),
    },
  ];

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
        onPageChange={setPage}
        onRecordsPerPageChange={setRecordsPerPage}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        sortField={sortField}
        sortOrder={sortOrder}
        onSortChange={(field, order) => setSort(field, order)}
        loading={isLoading}
      />

      {/* Delete Modal */}
      {deleteModalId &&
        createPortal(
          <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-[9999]">
            <div className="bg-white p-6 rounded-xl shadow-xl w-80">
              <h2 className="text-lg font-medium mb-4">Delete Subscriber?</h2>
              <p className="text-sm text-gray-600 mb-6">Are you sure you want to delete this subscriber?</p>

              <div className="flex justify-end gap-3">
                <button onClick={() => setDeleteModalId(null)} className="px-4 py-2 rounded bg-gray-200">
                  Cancel
                </button>

                <button onClick={handleDelete} className="px-4 py-2 rounded bg-red-600 text-white">
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
