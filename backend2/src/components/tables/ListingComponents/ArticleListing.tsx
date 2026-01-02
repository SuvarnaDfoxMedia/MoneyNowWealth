
// "use client";

// import React, { useState, useEffect } from "react";
// import { useNavigate, useParams, useSearchParams } from "react-router-dom";
// import { toast } from "react-hot-toast";
// import { FiEdit, FiTrash2, FiMoreVertical, FiPlus, FiEye, FiX } from "react-icons/fi";
// import { createPortal } from "react-dom";
// import { DataTable, TableColumn } from "../../PagesComponent/DataTable";
// import { useCommonCrud } from "../../../hooks/useCommonCrud";
// import { useDataTableStore } from "../../../store/dataTableStore";

// interface Article {
//   _id: string;
//   title: string;
//   topic_id?: { _id: string; title: string };
//   hero_image?: string;
//   is_active: number;
// }

// export default function ArticleListing() {
//   const { role } = useParams<{ role: string }>();
//   const navigate = useNavigate();
//   const [searchParams, setSearchParams] = useSearchParams();

//   if (!role) {
//     toast.error("Role is missing in URL");
//     return null;
//   }

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

//   /* ------------------- Restore URL → Zustand ------------------- */
//   useEffect(() => {
//     const urlPage = Number(searchParams.get("page")) || 1;
//     const urlLimit = Number(searchParams.get("limit")) || 10;
//     setPage(urlPage);
//     setRecordsPerPage(urlLimit);
//   }, []);

//   /* ------------------- Fetch Data via useCommonCrud ------------------- */
//   const { data, isLoading, deleteRecord, toggleStatus, refetch, extractList } =
//     useCommonCrud<Article>({
//       role,
//       module: "article",
//       page,
//       limit: recordsPerPage,
//       searchValue,
//       sortField,
//       sortOrder,
//     });

//   const [articles, setArticles] = useState<Article[]>([]);
//   useEffect(() => {
//     setArticles(extractList);
//   }, [extractList]);

//   const totalRecords = data?.total || 0;
//   const totalPages = Math.max(Math.ceil(totalRecords / recordsPerPage), 1);

//   /* ------------------- Debounce search/sort ------------------- */
//   useEffect(() => {
//     const timer = setTimeout(() => refetch(), 400);
//     return () => clearTimeout(timer);
//   }, [searchValue, sortField, sortOrder, page, recordsPerPage]);

//   /* ------------------- Sync Zustand → URL ------------------- */
//   useEffect(() => {
//     setSearchParams({
//       page: String(page),
//       limit: String(recordsPerPage),
//     });
//   }, [page, recordsPerPage]);

//   /* ------------------- Dropdown, Delete & Preview ------------------- */
//   const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
//   const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
//   const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
//   const [previewImage, setPreviewImage] = useState<string | null>(null);

//   const handleDropdownClick = (e: React.MouseEvent<HTMLButtonElement>, articleId: string) => {
//     const rect = e.currentTarget.getBoundingClientRect();
//     setDropdownPos({
//       top: rect.bottom + window.scrollY,
//       left: rect.right - 144,
//     });
//     setOpenDropdownId(openDropdownId === articleId ? null : articleId);
//   };

//   /* ------------------- Toggle Status with Optimistic Update ------------------- */
//   const handleToggleStatus = async (id: string, currentStatus: number) => {
//     const newStatus = currentStatus === 1 ? 0 : 1;

//     // Optimistic UI update
//     setArticles((prev) =>
//       prev.map((a) => (a._id === id ? { ...a, is_active: newStatus } : a))
//     );

//     try {
//       await toggleStatus(id, newStatus === 1);
//     } catch (err: any) {
//       toast.error(err?.message || "Failed to update status");

//       // Revert on error
//       setArticles((prev) =>
//         prev.map((a) => (a._id === id ? { ...a, is_active: currentStatus } : a))
//       );
//     }
//   };

//   /* ------------------- Delete Record ------------------- */
//   const handleDelete = async () => {
//     if (!deleteModalId) return;
//     const result = await deleteRecord(deleteModalId);
//     if (result?.success) {
//       toast.success("Article deleted");
//       refetch();
//     } else {
//       toast.error(result?.message || "Delete failed");
//     }
//     setDeleteModalId(null);
//   };

//   const SERVER_URL = import.meta.env.VITE_API_BASE.replace("/api", "");
//   const getHeroImageUrl = (path?: string | File) => {
//     if (!path) return "/no-image.png";
//     if (typeof path === "object") return URL.createObjectURL(path);
//     const filename = path.replace(/\\/g, "/").split("/").pop();
//     return filename ? `${SERVER_URL}/uploads/hero/${filename}` : "/no-image.png";
//   };

//   const truncateText = (text: string, max: number) => (text.length > max ? text.slice(0, max) + "…" : text);

//   /* ------------------- Table Columns ------------------- */
//   const columns: TableColumn<Article>[] = [
//     { key: "index", label: "#", render: (_row, idx) => (page - 1) * recordsPerPage + idx + 1 },
//     {
//       key: "hero_image",
//       label: "Image",
//       render: (row) => (
//         <div
//           className="w-20 h-14 border border-gray-200 rounded-md overflow-hidden bg-gray-50 flex items-center justify-center cursor-pointer group"
//           onClick={() => row.hero_image && setPreviewImage(getHeroImageUrl(row.hero_image))}
//         >
//           {row.hero_image ? (
//             <img
//               src={getHeroImageUrl(row.hero_image)}
//               alt={row.title}
//               className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
//             />
//           ) : (
//             <span className="text-gray-400 text-sm">No Image</span>
//           )}
//         </div>
//       ),
//     },
//     { key: "title", label: "Title", sortable: true, render: (row) => truncateText(row.title, 40) },
//     { key: "topic_id", label: "Topic", sortable: true, render: (row) => truncateText(row.topic_id?.title || "-", 40) },
//     {
//       key: "is_active",
//       label: "Active",
//       render: (row) => (
//         <button
//           onClick={() => handleToggleStatus(row._id, row.is_active)}
//           className={`px-4 py-1 rounded text-white ${row.is_active ? "bg-green-600" : "bg-gray-600"}`}
//         >
//           {row.is_active ? "Active" : "Inactive"}
//         </button>
//       ),
//     },
//     {
//       key: "actions",
//       label: "Actions",
//       render: (row) => (
//         <>
//           <button onClick={(e) => handleDropdownClick(e, row._id)} className="p-2 rounded-full hover:bg-gray-100">
//             <FiMoreVertical size={18} />
//           </button>
//           {openDropdownId === row._id && (
//             <Dropdown articleId={row._id} top={dropdownPos.top} left={dropdownPos.left} />
//           )}
//         </>
//       ),
//     },
//   ];

//   const Dropdown = ({ articleId, top, left }: { articleId: string; top: number; left: number }) =>
//     createPortal(
//   <div
//   style={{ top, left, width: "8rem" }}
//   className="absolute bg-white border rounded-xl shadow-xl z-50"
// >
//   <button
//     onClick={() => {
//       navigate(`/${role}/article/view/${articleId}`);
//       setOpenDropdownId(null);
//     }}
//     className="flex items-center gap-2 px-4 py-2 w-full hover:bg-blue-50"
//   >
//     <FiEye className="text-lg" />
//     <span>View</span>
//   </button>

//   <button
//     onClick={() => {
//       navigate(`/${role}/article/edit/${articleId}`);
//       setOpenDropdownId(null);
//     }}
//     className="flex items-center gap-2 px-4 py-2 w-full hover:bg-indigo-50"
//   >
//     <FiEdit className="text-lg" />
//     <span>Edit</span>
//   </button>

//   <button
//     onClick={() => {
//       setDeleteModalId(articleId);
//       setOpenDropdownId(null);
//     }}
//     className="flex items-center gap-2 px-4 py-2 w-full text-red-600 hover:bg-red-50"
//   >
//     <FiTrash2 className="text-lg" />
//     <span>Delete</span>
//   </button>
// </div>,
//       document.body
//     );

//   return (
//     <div className="bg-gray-50 min-h-screen p-4 relative">
//       <div className="flex justify-between items-center mb-6">
//         <h2 className="text-xl font-medium text-gray-800">Articles</h2>
//         {(role === "admin" || role === "editor") && (
//           <button
//             onClick={() => navigate(`/${role}/article/create`)}
//             className="bg-[#043f79] text-white px-3 py-2 rounded-md flex items-center gap-2"
//           >
//             <FiPlus /> Add
//           </button>
//         )}
//       </div>

//       <DataTable
//         columns={columns}
//         data={articles}
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

//       {/* Delete Modal */}
//       {deleteModalId &&
//         createPortal(
//           <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-[99999]">
//             <div className="bg-white p-6 rounded-xl w-96">
//               <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
//               <p className="mb-6 text-gray-600">Are you sure you want to delete this article?</p>
//               <div className="flex justify-end gap-3">
//                 <button onClick={() => setDeleteModalId(null)} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
//                 <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded">Delete</button>
//               </div>
//             </div>
//           </div>,
//           document.body
//         )}

//       {/* Preview Image Modal */}
//       {previewImage &&
//         createPortal(
//           <div
//             onClick={() => setPreviewImage(null)}
//             className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[99999]"
//           >
//             <div className="relative max-w-4xl w-full">
//               <button
//                 onClick={() => setPreviewImage(null)}
//                 className="absolute top-3 right-3 text-white text-2xl"
//               >
//                 <FiX />
//               </button>
//               <img src={previewImage} className="max-h-[90vh] mx-auto rounded-lg shadow-xl" />
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
  FiEye,
  FiX,
} from "react-icons/fi";
import { createPortal } from "react-dom";
import { DataTable, TableColumn } from "../../PagesComponent/DataTable";
import { useCommonCrud } from "../../../hooks/useCommonCrud";
import { useDataTableStore } from "../../../store/dataTableStore";

interface Article {
  _id: string;
  title: string;
  topic_id?: { _id: string; title: string };
  hero_image?: string;
  is_active: number;
}

export default function ArticleListing() {
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  if (!role) {
    toast.error("Role is missing in URL");
    return null;
  }

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

  /* ------------------- Restore URL → Zustand ------------------- */
  useEffect(() => {
    setPage(Number(searchParams.get("page")) || 1);
    setRecordsPerPage(Number(searchParams.get("limit")) || 10);
  }, []);

  /* ------------------- Fetch Data ------------------- */
  const { data, isLoading, deleteRecord, toggleStatus, refetch, extractList } =
    useCommonCrud<Article>({
      role,
      module: "article",
      page,
      limit: recordsPerPage,
      searchValue,
      sortField,
      sortOrder,
    });

  const [articles, setArticles] = useState<Article[]>([]);
  useEffect(() => setArticles(extractList), [extractList]);

  const totalRecords = data?.total || 0;
  const totalPages = Math.max(Math.ceil(totalRecords / recordsPerPage), 1);

  /* ------------------- Debounced Refetch ------------------- */
  useEffect(() => {
    const timer = setTimeout(() => refetch(), 400);
    return () => clearTimeout(timer);
  }, [searchValue, sortField, sortOrder, page, recordsPerPage]);

  /* ------------------- Sync Zustand → URL ------------------- */
  useEffect(() => {
    setSearchParams({
      page: String(page),
      limit: String(recordsPerPage),
    });
  }, [page, recordsPerPage]);

  /* ------------------- Dropdown, Delete & Preview ------------------- */
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const handleDropdownClick = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
    e.stopPropagation();
    setOpenDropdownId(openDropdownId === id ? null : id);
  };

  /* ------------------- Close dropdown on outside click ------------------- */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  /* ------------------- Toggle Status ------------------- */
  const handleToggleStatus = async (id: string, currentStatus: number) => {
    const newStatus = currentStatus === 1 ? 0 : 1;

    setArticles((prev) =>
      prev.map((a) => (a._id === id ? { ...a, is_active: newStatus } : a))
    );

    try {
      await toggleStatus(id, newStatus === 1);
    } catch {
      toast.error("Failed to update status");
      setArticles((prev) =>
        prev.map((a) => (a._id === id ? { ...a, is_active: currentStatus } : a))
      );
    }
  };

  /* ------------------- Delete ------------------- */
  const handleDelete = async () => {
    if (!deleteModalId) return;
    const res = await deleteRecord(deleteModalId);
    res?.success ? toast.success("Article deleted") : toast.error("Delete failed");
    setDeleteModalId(null);
    setOpenDropdownId(null);
    refetch();
  };

  const SERVER_URL = import.meta.env.VITE_API_BASE.replace("/api", "");
  const getHeroImageUrl = (path?: string | File) => {
    if (!path) return "/no-image.png";
    if (typeof path === "object") return URL.createObjectURL(path);
    const filename = path.replace(/\\/g, "/").split("/").pop();
    return filename ? `${SERVER_URL}/uploads/hero/${filename}` : "/no-image.png";
  };

  const truncateText = (text: string, max: number) => (text.length > max ? text.slice(0, max) + "…" : text);

  /* ------------------- Table Columns ------------------- */
  const columns: TableColumn<Article>[] = [
    { key: "index", label: "#", render: (_row, idx) => (page - 1) * recordsPerPage + idx + 1 },
    {
      key: "hero_image",
      label: "Image",
      render: (row) => (
        <div
          className="w-20 h-14 border border-gray-200 rounded-md overflow-hidden bg-gray-50 flex items-center justify-center cursor-pointer group"
          onClick={() => row.hero_image && setPreviewImage(getHeroImageUrl(row.hero_image))}
        >
          {row.hero_image ? (
            <img
              src={getHeroImageUrl(row.hero_image)}
              alt={row.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <span className="text-gray-400 text-sm">No Image</span>
          )}
        </div>
      ),
    },
    { key: "title", label: "Title", sortable: true, render: (row) => truncateText(row.title, 30) },
    { key: "topic_id", label: "Topic", sortable: true, render: (row) => truncateText(row.topic_id?.title || "-", 30) },
    {
      key: "is_active",
      label: "Active",
      render: (row) => (
        <button
          onClick={() => handleToggleStatus(row._id, row.is_active)}
          className={`px-4 py-1 rounded text-white ${row.is_active ? "bg-green-600" : "bg-gray-600"}`}
        >
          {row.is_active ? "Active" : "Inactive"}
        </button>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="relative">
          <button onClick={(e) => handleDropdownClick(e, row._id)} className="p-2 rounded-full hover:bg-gray-100">
            <FiMoreVertical />
          </button>

          {openDropdownId === row._id && (
            <div
              ref={dropdownRef}
              className="absolute right-0 top-full mt-2 w-36 bg-white border rounded-xl shadow-lg z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  navigate(`/${role}/article/view/${row._id}`);
                  setOpenDropdownId(null);
                }}
                className="flex items-center gap-2 px-4 py-2 hover:bg-blue-50 w-full"
              >
                <FiEye /> View
              </button>

              <button
                onClick={() => {
                  navigate(`/${role}/article/edit/${row._id}`);
                  setOpenDropdownId(null);
                }}
                className="flex items-center gap-2 px-4 py-2 hover:bg-indigo-50 w-full"
              >
                <FiEdit /> Edit
              </button>

              <button
                onClick={() => {
                  setDeleteModalId(row._id);
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
    <div className="bg-gray-50 min-h-screen p-4 relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium text-gray-800">Articles</h2>
        {(role === "admin" || role === "editor") && (
          <button
            onClick={() => navigate(`/${role}/article/create`)}
            className="bg-[#043f79] text-white px-3 py-2 rounded-md flex items-center gap-2"
          >
            <FiPlus /> Add
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={articles}
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

      {/* Delete Modal */}
      {deleteModalId &&
        createPortal(
          <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-[99999]">
            <div className="bg-white p-6 rounded-xl w-96">
              <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
              <p className="mb-6 text-gray-600">Are you sure you want to delete this article?</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setDeleteModalId(null)} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
                <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded">Delete</button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Preview Image Modal */}
      {previewImage &&
        createPortal(
          <div
            onClick={() => setPreviewImage(null)}
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[99999]"
          >
            <div className="relative max-w-4xl w-full">
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-3 right-3 text-white text-2xl"
              >
                <FiX />
              </button>
              <img src={previewImage} className="max-h-[90vh] mx-auto rounded-lg shadow-xl" />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
