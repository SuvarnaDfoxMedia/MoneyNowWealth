


// "use client";

// import React, { useEffect, useState } from "react";
// import { useNavigate, useParams, useSearchParams } from "react-router-dom";
// import { toast } from "react-hot-toast";
// import { FiEdit, FiTrash2, FiMoreVertical, FiPlus, FiImage } from "react-icons/fi";
// import { createPortal } from "react-dom";
// import { DataTable, TableColumn } from "../../PagesComponent/DataTable";
// import { useCommonCrud } from "../../../hooks/useCommonCrud";
// import { useDataTableStore } from "../../../store/dataTableStore";

// interface Cluster {
//   _id: string;
//   title: string;
//   description?: string;
//   thumbnail?: string;
//   is_active: number;
// }

// export default function ClusterListing() {
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

//   /* ---------------- Restore URL → Store ---------------- */
//   useEffect(() => {
//     setPage(Number(searchParams.get("page")) || 1);
//     setRecordsPerPage(Number(searchParams.get("limit")) || 10);
//   }, []);

//   /* ---------------- CRUD Hook ---------------- */
//   const { data, extractList, refetch, deleteRecord, isLoading, toggleStatus } =
//     useCommonCrud<Cluster>({
//       role,
//       module: "cluster",
//       page,
//       limit: recordsPerPage,
//       searchValue,
//       sortField,
//       sortOrder,
//     });

//   const [clusters, setClusters] = useState<Cluster[]>([]);

//   useEffect(() => {
//     setClusters(extractList);
//   }, [extractList]);

//   const totalRecords = data?.total ?? 0;
//   const totalPages = Math.max(Math.ceil(totalRecords / recordsPerPage), 1);

//   /* ---------------- Sync Store → URL ---------------- */
//   useEffect(() => {
//     setSearchParams({
//       page: String(page),
//       limit: String(recordsPerPage),
//     });
//   }, [page, recordsPerPage]);

//   /* ---------------- Debounced Refetch ---------------- */
//   useEffect(() => {
//     const timer = setTimeout(refetch, 300);
//     return () => clearTimeout(timer);
//   }, [page, recordsPerPage, searchValue, sortField, sortOrder]);

//   /* ---------------- Dropdown & Delete ---------------- */
//   const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
//   const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
//   const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

//   const handleDropdownClick = (e: React.MouseEvent, id: string) => {
//     e.stopPropagation();
//     const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
//     setDropdownPos({
//       top: rect.bottom + window.scrollY,
//       left: rect.right - 150,
//     });
//     setOpenDropdownId((prev) => (prev === id ? null : id));
//   };

//   /* ---------------- Toggle Status ---------------- */
//   const handleToggleStatus = async (id: string, current: number) => {
//     const next = current ? 0 : 1;

//     setClusters((prev) =>
//       prev.map((c) => (c._id === id ? { ...c, is_active: next } : c))
//     );

//     try {
//       await toggleStatus(id, next === 1);
//     } catch {
//       toast.error("Failed to update status");
//       setClusters((prev) =>
//         prev.map((c) => (c._id === id ? { ...c, is_active: current } : c))
//       );
//     }
//   };

//   /* ---------------- Delete ---------------- */
//   const handleDelete = async () => {
//     if (!deleteModalId) return;

//     const res = await deleteRecord(deleteModalId);
//     res?.success ? toast.success("Cluster deleted") : toast.error("Delete failed");

//     setDeleteModalId(null);
//     refetch();
//   };

//   /* ---------------- Dropdown Portal ---------------- */
//   const Dropdown = ({ id }: { id: string }) =>
//     createPortal(
//       <div
//   className="absolute bg-white border rounded-xl shadow-lg z-50"
//   style={{ top: dropdownPos.top, left: dropdownPos.left, width: "9rem" }}
// >
//   <button
//     onClick={() => navigate(`/${role}/cluster/edit/${id}`)}
//     className="flex items-center gap-2 px-4 py-2 hover:bg-indigo-50 w-full"
//   >
//     <FiEdit className="text-lg" />
//     <span>Edit</span>
//   </button>

//   <button
//     onClick={() => setDeleteModalId(id)}
//     className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 w-full"
//   >
//     <FiTrash2 className="text-lg" />
//     <span>Delete</span>
//   </button>
// </div>,
//       document.body
//     );

//   const API_BASE = import.meta.env.VITE_API_BASE?.replace("/api", "");

//   /* ---------------- Columns ---------------- */
//   const columns: TableColumn<Cluster>[] = [
//     { key: "index", label: "#", render: (_, i) => (page - 1) * recordsPerPage + i + 1 },
//     {
//       key: "thumbnail",
//       label: "Thumbnail",
//       render: (row) =>
//         row.thumbnail ? (
//           <img
//             src={
//               row.thumbnail.startsWith("http")
//                 ? row.thumbnail
//                 : `${API_BASE}/uploads/thumbnail/${row.thumbnail}`
//             }
//             className="w-14 h-14 object-cover rounded-lg border"
//           />
//         ) : (
//           <div className="w-14 h-14 bg-gray-100 flex items-center justify-center border rounded-lg">
//             <FiImage />
//           </div>
//         ),
//     },
//     { key: "title", label: "Title", sortable: true },
//     {
//       key: "description",
//       label: "Description",
//       render: (r) => (r.description ? r.description.slice(0, 60) + "…" : "-"),
//     },
//     {
//       key: "is_active",
//       label: "Status",
//       render: (r) => (
//         <button
//           onClick={() => handleToggleStatus(r._id, r.is_active)}
//           className={`px-3 py-1 rounded-sm text-white ${
//             r.is_active ? "bg-green-600" : "bg-gray-600"
//           }`}
//         >
//           {r.is_active ? "Active" : "Inactive"}
//         </button>
//       ),
//     },
//     {
//       key: "actions",
//       label: "Actions",
//       render: (r) => (
//         <>
//           <button
//             onClick={(e) => handleDropdownClick(e, r._id)}
//             className="p-2 rounded-full hover:bg-gray-100"
//           >
//             <FiMoreVertical />
//           </button>
//           {openDropdownId === r._id && <Dropdown id={r._id} />}
//         </>
//       ),
//     },
//   ];

//   return (
//     <div className="p-4 bg-gray-50 min-h-screen">
//       <div className="flex justify-between mb-6">
//         <h2 className="text-xl font-medium">Clusters</h2>
//         {(role === "admin" || role === "editor") && (
//           <button
//             onClick={() => navigate(`/${role}/cluster/create`)}
//             className="bg-[#043f79] text-white px-3 py-2 rounded-md flex items-center gap-2"
//           >
//             <FiPlus /> Add
//           </button>
//         )}
//       </div>

//       <DataTable
//         columns={columns}
//         data={clusters}
//         loading={isLoading}
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
//         onSortChange={setSort}
//       />

//       {deleteModalId &&
//         createPortal(
//           <div className="fixed inset-0 bg-black/70 z-[99999] flex items-center justify-center">
//             <div className="bg-white p-6 rounded-xl w-80">
//               <h3 className="text-lg mb-4">Delete Cluster?</h3>
//               <div className="flex justify-end gap-3">
//                 <button onClick={() => setDeleteModalId(null)}>Cancel</button>
//                 <button onClick={handleDelete} className="bg-red-600 text-white px-4 py-2 rounded">
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

import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  /* ---------------- Store ---------------- */
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

  /* ---------------- Restore URL → Store ---------------- */
  useEffect(() => {
    setPage(Number(searchParams.get("page")) || 1);
    setRecordsPerPage(Number(searchParams.get("limit")) || 10);
  }, []);

  /* ---------------- CRUD Hook ---------------- */
  const { data, extractList, refetch, deleteRecord, isLoading, toggleStatus } =
    useCommonCrud<Cluster>({
      role,
      module: "cluster",
      page,
      limit: recordsPerPage,
      searchValue,
      sortField,
      sortOrder,
    });

  const [clusters, setClusters] = useState<Cluster[]>([]);
  useEffect(() => setClusters(extractList), [extractList]);

  const totalRecords = data?.total ?? 0;
  const totalPages = Math.max(Math.ceil(totalRecords / recordsPerPage), 1);

  /* ---------------- Sync Store → URL ---------------- */
  useEffect(() => {
    setSearchParams({
      page: String(page),
      limit: String(recordsPerPage),
    });
  }, [page, recordsPerPage]);

  /* ---------------- Debounced Refetch ---------------- */
  useEffect(() => {
    const timer = setTimeout(refetch, 300);
    return () => clearTimeout(timer);
  }, [page, recordsPerPage, searchValue, sortField, sortOrder]);

  /* ---------------- Dropdown logic ---------------- */
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // ✅ OUTSIDE CLICK (use CLICK, not mousedown)
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
    setOpenDropdownId((prev) => (prev === id ? null : id));
  };

  /* ---------------- Toggle Status ---------------- */
  const handleToggleStatus = async (id: string, current: number) => {
    const next = current ? 0 : 1;

    setClusters((prev) =>
      prev.map((c) => (c._id === id ? { ...c, is_active: next } : c))
    );

    try {
      await toggleStatus(id, next === 1);
    } catch {
      toast.error("Failed to update status");
      setClusters((prev) =>
        prev.map((c) => (c._id === id ? { ...c, is_active: current } : c))
      );
    }
  };

  /* ---------------- Delete ---------------- */
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteModalId) return;

    const res = await deleteRecord(deleteModalId);
    res?.success
      ? toast.success("Cluster deleted")
      : toast.error("Delete failed");

    setDeleteModalId(null);
    setOpenDropdownId(null);
    refetch();
  };

  const API_BASE = import.meta.env.VITE_API_BASE?.replace("/api", "");

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
        <div className="relative">
          <button
            onClick={(e) => handleDropdownClick(e, r._id)}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <FiMoreVertical />
          </button>

          {openDropdownId === r._id && (
            <div
              ref={dropdownRef}
              className="absolute right-0 top-full mt-2 w-36 bg-white border rounded-xl shadow-lg z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  navigate(`/${role}/cluster/edit/${r._id}`);
                  setOpenDropdownId(null);
                }}
                className="flex items-center gap-2 px-4 py-2 hover:bg-indigo-50 w-full"
              >
                <FiEdit /> Edit
              </button>

              <button
                onClick={() => {
                  setDeleteModalId(r._id);
                  setOpenDropdownId(null);
                }}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 w-full"
              >
                <FiTrash2 /> Delete
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="flex justify-between mb-6">
        <h2 className="text-xl font-medium">Clusters</h2>

        {(role === "admin" || role === "editor") && (
          <button
            onClick={() => navigate(`/${role}/cluster/create`)}
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
        onPageChange={setPage}
        onRecordsPerPageChange={setRecordsPerPage}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        sortField={sortField}
        sortOrder={sortOrder}
        onSortChange={setSort}
      />

      {deleteModalId &&
        createPortal(
          <div className="fixed inset-0 bg-black/70 z-[99999] flex items-center justify-center">
            <div className="bg-white p-6 rounded-xl w-80">
              <h3 className="text-lg mb-4">Delete Cluster?</h3>
              <div className="flex justify-end gap-3">
                <button onClick={() => setDeleteModalId(null)}>Cancel</button>
                <button
                  onClick={handleDelete}
                  className="bg-red-600 text-white px-4 py-2 rounded"
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
