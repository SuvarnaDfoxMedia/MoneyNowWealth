

// "use client";

// import React, { useState } from "react";
// import { createPortal } from "react-dom";
// import { FiTrash2, FiMoreVertical } from "react-icons/fi";
// import { useSearchParams } from "react-router-dom";
// import { DataTable, TableColumn } from "../../PagesComponent/DataTable";
// import useCommonCrud from "../../../hooks/useCommonCrud";

// interface User {
//   _id: string;
//   firstname: string;
//   lastname: string;
//   email: string;
//   mobile: string;
//   created_at: string;
// }

// export default function CustomerListing() {
//   const [searchParams, setSearchParams] = useSearchParams();
//   const role = "admin";

//   const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
//   const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
//   const [deleteModalId, setDeleteModalId] = useState<string | null>(null);

//   // URL params
//   const page = Number(searchParams.get("page")) || 1;
//   const limit = Number(searchParams.get("limit")) || 10;
//   const searchValue = searchParams.get("search") || "";

//   // API hook
//   const { data, extractList: users, isLoading, refetch, deleteRecord } =
//     useCommonCrud<User>({
//       module: "auth/users",
//       role,
//       page,
//       limit,
//       searchValue,
//       listKey: "users",
//     });

//   // ✅ Safe access with optional chaining
//   const total = data?.total ?? 0;
//   const totalPages = Math.max(Math.ceil(total / limit), 1);

//   const updateUrlParams = (newPage: number, newLimit: number, newSearch: string) => {
//     setSearchParams({
//       page: newPage.toString(),
//       limit: newLimit.toString(),
//       search: newSearch,
//     });
//   };

//   const handlePageChange = (newPage: number) => updateUrlParams(newPage, limit, searchValue);
//   const handleLimitChange = (newLimit: number) => updateUrlParams(1, newLimit, searchValue);
//   const handleSearchChange = (value: string) => updateUrlParams(1, limit, value);

//   const handleDropdownClick = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
//     const rect = e.currentTarget.getBoundingClientRect();
//     setDropdownPos({ top: rect.bottom + window.scrollY, left: rect.right - 144 });
//     setOpenDropdownId(openDropdownId === id ? null : id);
//   };

//   const handleDelete = async () => {
//     if (!deleteModalId) return;
//     await deleteRecord(deleteModalId);
//     setDeleteModalId(null);
//     setOpenDropdownId(null);
//     refetch();
//   };

//   const Dropdown = ({ id, top, left }: { id: string; top: number; left: number }) =>
//     createPortal(
//       <div className="absolute bg-white border rounded-xl shadow-lg z-50" style={{ top, left, width: "8rem" }}>
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

//   const columns: TableColumn<User>[] = [
//     { key: "index", label: "#", render: (_r, idx) => (page - 1) * limit + idx + 1 },
//     { key: "firstname", label: "Name", sortable: true, render: (r) => `${r.firstname} ${r.lastname}` },
//     { key: "email", label: "Email", sortable: true },
//     { key: "mobile", label: "Mobile" },
//     { key: "created_at", label: "Register Date", sortable: true, render: (r) => new Date(r.created_at).toLocaleString() },
//     {
//       key: "actions",
//       label: "Actions",
//       render: (row) => (
//         <>
//           <button onClick={(e) => handleDropdownClick(e, row._id)} className="p-2 rounded-full hover:bg-gray-100">
//             <FiMoreVertical size={18} />
//           </button>
//           {openDropdownId === row._id && <Dropdown id={row._id} top={dropdownPos.top} left={dropdownPos.left} />}
//         </>
//       ),
//     },
//   ];

//   return (
//     <div className="bg-gray-50 min-h-screen p-4 relative">
//       <h2 className="text-xl font-medium text-gray-800 mb-6">Customer List</h2>

//       <DataTable
//         columns={columns}
//         data={users}
//         loading={isLoading}
//         page={page}
//         totalPages={totalPages}
//         totalRecords={total}
//         recordsPerPage={limit}
//         onPageChange={handlePageChange}
//         onRecordsPerPageChange={handleLimitChange}
//         searchValue={searchValue}
//         onSearchChange={handleSearchChange}
//       />

//       {deleteModalId &&
//         createPortal(
//           <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-[99999]">
//             <div className="bg-white p-6 rounded-xl w-96">
//               <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
//               <p className="mb-6 text-gray-600">Are you sure you want to delete this user?</p>

//               <div className="flex justify-end gap-4">
//                 <button onClick={() => setDeleteModalId(null)} className="px-4 py-2 rounded-lg border hover:bg-gray-100">
//                   Cancel
//                 </button>

//                 <button onClick={handleDelete} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">
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

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FiTrash2, FiMoreVertical } from "react-icons/fi";
import { useSearchParams } from "react-router-dom";
import { DataTable, TableColumn } from "../../PagesComponent/DataTable";
import useCommonCrud from "../../../hooks/useCommonCrud";

interface User {
  _id: string;
  firstname: string;
  lastname: string;
  email: string;
  mobile: string;
  created_at: string;
}

export default function CustomerListing() {
  const [searchParams, setSearchParams] = useSearchParams();
  const role = "admin";

  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);

  // URL params
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 10;
  const searchValue = searchParams.get("search") || "";

  // API hook
  const { data, extractList: users, isLoading, refetch, deleteRecord } =
    useCommonCrud<User>({
      module: "auth/users",
      role,
      page,
      limit,
      searchValue,
      listKey: "users",
    });

  const total = data?.total ?? 0;
  const totalPages = Math.max(Math.ceil(total / limit), 1);

  const updateUrlParams = (newPage: number, newLimit: number, newSearch: string) => {
    setSearchParams({
      page: newPage.toString(),
      limit: newLimit.toString(),
      search: newSearch,
    });
  };

  const handlePageChange = (newPage: number) => updateUrlParams(newPage, limit, searchValue);
  const handleLimitChange = (newLimit: number) => updateUrlParams(1, newLimit, searchValue);
  const handleSearchChange = (value: string) => updateUrlParams(1, limit, value);

  // Dropdown click
  const handleDropdownClick = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
    e.stopPropagation(); // prevent bubbling to document
    const rect = e.currentTarget.getBoundingClientRect();
    setDropdownPos({ top: rect.bottom + window.scrollY, left: rect.right - 144 });
    setOpenDropdownId(openDropdownId === id ? null : id);
  };

  // ✅ Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Close dropdown on any click outside
      setOpenDropdownId(null);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Delete
  const handleDelete = async () => {
    if (!deleteModalId) return;
    await deleteRecord(deleteModalId);
    setDeleteModalId(null);
    setOpenDropdownId(null);
    refetch();
  };

  const Dropdown = ({ id, top, left }: { id: string; top: number; left: number }) =>
    createPortal(
      <div
        className="absolute bg-white border rounded-xl shadow-lg z-50"
        style={{ top, left, width: "8rem" }}
        onClick={(e) => e.stopPropagation()} // stop closing when clicking inside
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
      document.body
    );

  const columns: TableColumn<User>[] = [
    { key: "index", label: "#", render: (_r, idx) => (page - 1) * limit + idx + 1 },
    { key: "firstname", label: "Name", sortable: true, render: (r) => `${r.firstname} ${r.lastname}` },
    { key: "email", label: "Email", sortable: true },
    { key: "mobile", label: "Mobile" },
    { key: "created_at", label: "Register Date", sortable: true, render: (r) => new Date(r.created_at).toLocaleString() },
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
      <h2 className="text-xl font-medium text-gray-800 mb-6">Customer List</h2>

      <DataTable
        columns={columns}
        data={users}
        loading={isLoading}
        page={page}
        totalPages={totalPages}
        totalRecords={total}
        recordsPerPage={limit}
        onPageChange={handlePageChange}
        onRecordsPerPageChange={handleLimitChange}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
      />

      {deleteModalId &&
        createPortal(
          <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-[99999]">
            <div className="bg-white p-6 rounded-xl w-96">
              <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
              <p className="mb-6 text-gray-600">Are you sure you want to delete this user?</p>
              <div className="flex justify-end gap-4">
                <button onClick={() => setDeleteModalId(null)} className="px-4 py-2 rounded-lg border hover:bg-gray-100">
                  Cancel
                </button>
                <button onClick={handleDelete} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">
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
