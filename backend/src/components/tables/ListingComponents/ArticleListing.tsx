// import React, { useEffect, useRef, useState } from "react";
// import { useNavigate, useParams, useLocation } from "react-router-dom";
// import { toast } from "react-hot-toast";
// import {
//   FiEdit,
//   FiTrash2,
//   FiMoreVertical,
//   FiPlus,
//   FiEye,
//   FiX,
// } from "react-icons/fi";
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
//   const location = useLocation();
//   const effectiveRole = role || "admin";

//   const MODULE_KEY = `${effectiveRole}-article`;
//   const [isMounted, setIsMounted] = useState(false);

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
//     setCurrentModule,
//     cacheModuleState,
//     restoreModuleState,
//     markEditNavigation,
//     markTabSwitch,
//     lastAction,
//   } = useDataTableStore();

//   /* ------------------- Detect tab switching ------------------- */
//   useEffect(() => {
//     // Store current path to detect tab switches
//     const currentPath = location.pathname;
//     const storedPath = sessionStorage.getItem("lastPath");

//     // Check if we're switching tabs (different module)
//     if (
//       storedPath &&
//       !storedPath.includes("/article") &&
//       currentPath.includes("/article")
//     ) {
//       // Coming from different tab, mark as tab switch
//       markTabSwitch();
//     }

//     // Store current path for next navigation
//     sessionStorage.setItem("lastPath", currentPath);
//   }, [location.pathname, markTabSwitch]);

//   /* ------------------- Initialize module state ------------------- */
//   useEffect(() => {
//     // Set current module
//     setCurrentModule(MODULE_KEY);

//     // Check if we should restore from edit
//     if (lastAction === "edit") {
//       restoreModuleState(MODULE_KEY);
//     } else if (lastAction === "tab-switch") {
//       setPage(1);
//     }

//     setIsMounted(true);

//     // Cache state before unmounting
//     return () => {
//       cacheModuleState(MODULE_KEY);
//     };
//   }, [
//     MODULE_KEY,
//     cacheModuleState,
//     lastAction,
//     restoreModuleState,
//     setCurrentModule,
//     setPage,
//   ]);

//   useEffect(() => {
//     if (!isMounted) return;
//     if (!sortField) {
//       setSort("publish_date", "desc");
//     }
//   }, [isMounted, sortField, setSort]);

//   /* ------------------- Fetch Data ------------------- */
//   const { data, isLoading, deleteRecord, toggleStatus, refetch, extractList } =
//     useCommonCrud<Article>({
//       role: effectiveRole,
//       module: "article",
//       page,
//       limit: recordsPerPage,
//       searchValue,
//       sortField,
//       sortOrder,
//       enabled: isMounted,
//     });

//   const [articles, setArticles] = useState<Article[]>([]);
//   useEffect(() => setArticles(extractList), [extractList]);

//   const totalRecords = data?.total || 0;
//   const totalPages = Math.max(Math.ceil(totalRecords / recordsPerPage), 1);

//   /* ------------------- Debounced Refetch ------------------- */
//   useEffect(() => {
//     if (!isMounted) return;

//     const timer = setTimeout(() => refetch(), 400);
//     return () => clearTimeout(timer);
//   }, [searchValue, sortField, sortOrder, page, recordsPerPage, isMounted]);

//   /* ------------------- Navigation handlers ------------------- */
//   const handleEditClick = (id: string) => {
//     // Mark that we're going to edit
//     markEditNavigation();
//     // Cache current state
//     cacheModuleState(MODULE_KEY);

//     navigate(`/${effectiveRole}/article/edit/${id}`);
//   };

//   const handleViewClick = (id: string) => {
//     // Mark that we're going to view
//     markEditNavigation();
//     // Cache current state
//     cacheModuleState(MODULE_KEY);

//     navigate(`/${effectiveRole}/article/view/${id}`);
//   };

//   /* ------------------- Handlers ------------------- */
//   const handlePageChange = (newPage: number) => {
//     setPage(newPage);
//   };

//   const handleRecordsPerPageChange = (value: number) => {
//     setRecordsPerPage(value);
//   };

//   const handleSearchChange = (value: string) => {
//     setSearchValue(value);
//   };

//   const handleSortChange = (field: string, order: "asc" | "desc") => {
//     setSort(field, order);
//   };

//   /* ------------------- Track tab clicks globally ------------------- */
//   useEffect(() => {
//     // Listen for clicks on navigation links
//     const handleNavClick = () => {
//       // Use setTimeout to detect after the click
//       setTimeout(() => {
//         const currentPath = window.location.pathname;
//         if (!currentPath.includes("/article")) {
//           // User navigated away from articles
//           markTabSwitch();
//         }
//       }, 100);
//     };

//     // Listen for clicks on any link
//     document.addEventListener("click", handleNavClick);

//     return () => {
//       document.removeEventListener("click", handleNavClick);
//     };
//   }, [markTabSwitch]);

//   /* ------------------- Dropdown, Delete & Preview ------------------- */
//   const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
//   const [previewImage, setPreviewImage] = useState<string | null>(null);
//   const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
//   const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
//   const dropdownRef = useRef<HTMLDivElement | null>(null);

//   const handleDropdownClick = (
//     e: React.MouseEvent<HTMLButtonElement>,
//     id: string,
//   ) => {
//     e.stopPropagation();
//     const rect = e.currentTarget.getBoundingClientRect();
//     setDropdownPos({
//       top: rect.bottom + 6,
//       left: rect.right - 144,
//     });
//     setOpenDropdownId(openDropdownId === id ? null : id);
//   };

//   /* ------------------- Close dropdown on outside click ------------------- */
//   useEffect(() => {
//     if (!openDropdownId) return;

//     const handleClickOutside = (e: MouseEvent) => {
//       if (
//         dropdownRef.current &&
//         !dropdownRef.current.contains(e.target as Node)
//       ) {
//         setOpenDropdownId(null);
//       }
//     };
//     const handleScroll = () => setOpenDropdownId(null);

//     document.addEventListener("click", handleClickOutside);
//     window.addEventListener("scroll", handleScroll, true);
//     return () => {
//       document.removeEventListener("click", handleClickOutside);
//       window.removeEventListener("scroll", handleScroll, true);
//     };
//   }, [openDropdownId]);

//   /* ------------------- Toggle Status ------------------- */
//   const handleToggleStatus = async (id: string, currentStatus: number) => {
//     const newStatus = currentStatus === 1 ? 0 : 1;

//     setArticles((prev) =>
//       prev.map((a) => (a._id === id ? { ...a, is_active: newStatus } : a)),
//     );

//     try {
//       await toggleStatus(id, newStatus === 1);
//     } catch {
//       toast.error("Failed to update status");
//       setArticles((prev) =>
//         prev.map((a) =>
//           a._id === id ? { ...a, is_active: currentStatus } : a,
//         ),
//       );
//     }
//   };

//   /* ------------------- Delete ------------------- */
//   const handleDelete = async () => {
//     if (!deleteModalId) return;
//     const res = await deleteRecord(deleteModalId);
//     if (!res?.success) {
//       toast.error("Delete failed");
//     }
//     setDeleteModalId(null);
//     setOpenDropdownId(null);
//     refetch();
//   };

//   const SERVER_URL =
//     (import.meta.env.VITE_API_BASE as string | undefined)?.replace(
//       "/api",
//       "",
//     ) || "";
//   const getHeroImageUrl = (path?: string | File) => {
//     if (!path) return "/no-image.png";
//     if (typeof path === "object") return URL.createObjectURL(path);
//     const filename = path.replace(/\\/g, "/").split("/").pop();
//     return filename
//       ? `${SERVER_URL}/uploads/hero/${filename}`
//       : "/no-image.png";
//   };

//   const truncateText = (text: string, max: number) =>
//     text.length > max ? text.slice(0, max) + "…" : text;

//   const Dropdown = ({
//     articleId,
//     top,
//     left,
//   }: {
//     articleId: string;
//     top: number;
//     left: number;
//   }) =>
//     createPortal(
//       <div
//         ref={dropdownRef}
//         className="absolute z-50 w-36 rounded-xl border border-gray-200 bg-white p-1 shadow-lg"
//         style={{ top, left }}
//         onClick={(e) => e.stopPropagation()}
//       >
//         <button
//           onClick={() => {
//             handleViewClick(articleId);
//             setOpenDropdownId(null);
//           }}
//           className="flex h-9 w-full items-center gap-2 rounded-lg px-3 text-sm text-gray-700 transition hover:bg-gray-100"
//         >
//           <FiEye /> View
//         </button>

//         <button
//           onClick={() => {
//             handleEditClick(articleId);
//             setOpenDropdownId(null);
//           }}
//           className="flex h-9 w-full items-center gap-2 rounded-lg px-3 text-sm text-gray-700 transition hover:bg-gray-100"
//         >
//           <FiEdit /> Edit
//         </button>

//         <button
//           onClick={() => {
//             setDeleteModalId(articleId);
//             setOpenDropdownId(null);
//           }}
//           className="flex h-9 w-full items-center gap-2 rounded-lg px-3 text-sm text-red-600 transition hover:bg-red-50"
//         >
//           <FiTrash2 /> Delete
//         </button>
//       </div>,
//       document.body,
//     );

//   /* ------------------- Table Columns ------------------- */
//   const columns: TableColumn<Article>[] = [
//     {
//       key: "index",
//       label: "#",
//       render: (_row, idx) => (page - 1) * recordsPerPage + idx + 1,
//     },
//     {
//       key: "hero_image",
//       label: "Image",
//       render: (row) => (
//         <div
//           className="w-20 h-14 border border-gray-200 rounded-md overflow-hidden bg-gray-50 flex items-center justify-center cursor-pointer group"
//           onClick={() =>
//             row.hero_image && setPreviewImage(getHeroImageUrl(row.hero_image))
//           }
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
//     {
//       key: "title",
//       label: "Title",
//       sortable: true,
//       render: (row) => truncateText(row.title, 30),
//     },
//     {
//       key: "topic_id",
//       label: "Topic",
//       sortable: true,
//       render: (row) => truncateText(row.topic_id?.title || "-", 30),
//     },
//     {
//       key: "is_active",
//       label: "Active",
//       render: (row) => (
//         <button
//           onClick={() => handleToggleStatus(row._id, row.is_active)}
//           className={`px-4 py-1 rounded text-white ${
//             row.is_active ? "bg-green-600" : "bg-gray-600"
//           }`}
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
//           <button
//             onClick={(e) => handleDropdownClick(e, row._id)}
//             className="rounded-full p-2 text-gray-600 transition hover:bg-gray-100"
//           >
//             <FiMoreVertical />
//           </button>

//           {openDropdownId === row._id && (
//             <Dropdown
//               articleId={row._id}
//               top={dropdownPos.top}
//               left={dropdownPos.left}
//             />
//           )}
//         </>
//       ),
//     },
//   ];

//   if (!isMounted) {
//     return (
//       <div className="bg-gray-50 min-h-screen p-4 flex items-center justify-center">
//         <div className="text-gray-500">Loading...</div>
//       </div>
//     );
//   }

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
//         onPageChange={handlePageChange}
//         onRecordsPerPageChange={handleRecordsPerPageChange}
//         searchValue={searchValue}
//         onSearchChange={handleSearchChange}
//         sortField={sortField}
//         sortOrder={sortOrder}
//         onSortChange={handleSortChange}
//       />

//       {/* Delete Modal */}
//       {deleteModalId &&
//         createPortal(
//           <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 px-4">
//             <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
//               <h3 className="text-lg font-semibold text-gray-900">
//                 Confirm Delete
//               </h3>
//               <p className="mt-2 text-sm text-gray-600">
//                 Are you sure you want to delete this article?
//               </p>
//               <div className="mt-6 flex justify-end gap-3">
//                 <button
//                   onClick={() => setDeleteModalId(null)}
//                   className="h-10 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleDelete}
//                   className="h-10 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700"
//                 >
//                   Delete
//                 </button>
//               </div>
//             </div>
//           </div>,
//           document.body,
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
//               <img
//                 src={previewImage}
//                 className="max-h-[90vh] mx-auto rounded-lg shadow-xl"
//               />
//             </div>
//           </div>,
//           document.body,
//         )}
//     </div>
//   );
// }

import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
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
  const location = useLocation();
  const effectiveRole = role || "admin";

  const MODULE_KEY = `${effectiveRole}-article`;
  const [isMounted, setIsMounted] = useState(false);

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
    markEditNavigation,
    markTabSwitch,
    lastAction,
  } = useDataTableStore();

  /* ------------------- Detect tab switching ------------------- */
  useEffect(() => {
    // Store current path to detect tab switches
    const currentPath = location.pathname;
    const storedPath = sessionStorage.getItem("lastPath");

    // Check if we're switching tabs (different module)
    if (
      storedPath &&
      !storedPath.includes("/article") &&
      currentPath.includes("/article")
    ) {
      // Coming from different tab, mark as tab switch
      markTabSwitch();
    }

    // Store current path for next navigation
    sessionStorage.setItem("lastPath", currentPath);
  }, [location.pathname, markTabSwitch]);

  /* ------------------- Initialize module state ------------------- */
  useEffect(() => {
    // Set current module
    setCurrentModule(MODULE_KEY);

    // Check if we should restore from edit
    if (lastAction === "edit") {
      restoreModuleState(MODULE_KEY);
    } else if (lastAction === "tab-switch") {
      setPage(1);
    }

    setIsMounted(true);

    // Cache state before unmounting
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
    if (!isMounted) return;
    if (!sortField) {
      setSort("publish_date", "desc");
    }
  }, [isMounted, sortField, setSort]);

  /* ------------------- Fetch Data ------------------- */
  const { data, isLoading, deleteRecord, toggleStatus, refetch, extractList } =
    useCommonCrud<Article>({
      role: effectiveRole,
      module: "article",
      page,
      limit: recordsPerPage,
      searchValue,
      sortField,
      sortOrder,
      enabled: isMounted,
    });

  const [articles, setArticles] = useState<Article[]>([]);
  useEffect(() => setArticles(extractList), [extractList]);

  const totalRecords = data?.total || 0;
  const totalPages = Math.max(Math.ceil(totalRecords / recordsPerPage), 1);

  /* ------------------- Debounced Refetch ------------------- */
  useEffect(() => {
    if (!isMounted) return;

    const timer = setTimeout(() => refetch(), 400);
    return () => clearTimeout(timer);
  }, [searchValue, sortField, sortOrder, page, recordsPerPage, isMounted]);

  /* ------------------- Navigation handlers ------------------- */
  const handleEditClick = (id: string) => {
    // Mark that we're going to edit
    markEditNavigation();
    // Cache current state
    cacheModuleState(MODULE_KEY);

    navigate(`/${effectiveRole}/article/edit/${id}`);
  };

  const handleViewClick = (id: string) => {
    // Mark that we're going to view
    markEditNavigation();
    // Cache current state
    cacheModuleState(MODULE_KEY);

    navigate(`/${effectiveRole}/article/view/${id}`);
  };

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
    // Listen for clicks on navigation links
    const handleNavClick = () => {
      // Use setTimeout to detect after the click
      setTimeout(() => {
        const currentPath = window.location.pathname;
        if (!currentPath.includes("/article")) {
          // User navigated away from articles
          markTabSwitch();
        }
      }, 100);
    };

    // Listen for clicks on any link
    document.addEventListener("click", handleNavClick);

    return () => {
      document.removeEventListener("click", handleNavClick);
    };
  }, [markTabSwitch]);

  /* ------------------- Dropdown, Delete & Preview ------------------- */
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const handleDropdownClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    id: string,
  ) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + window.scrollY + 6,
      left: rect.right + window.scrollX - 144,
    });
    setOpenDropdownId(openDropdownId === id ? null : id);
  };

  /* ------------------- Close dropdown on outside click ------------------- */
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

  /* ------------------- Toggle Status ------------------- */
  const handleToggleStatus = async (id: string, currentStatus: number) => {
    const newStatus = currentStatus === 1 ? 0 : 1;

    setArticles((prev) =>
      prev.map((a) => (a._id === id ? { ...a, is_active: newStatus } : a)),
    );

    try {
      await toggleStatus(id, newStatus === 1);
    } catch {
      toast.error("Failed to update status");
      setArticles((prev) =>
        prev.map((a) =>
          a._id === id ? { ...a, is_active: currentStatus } : a,
        ),
      );
    }
  };

  /* ------------------- Delete ------------------- */
  const handleDelete = async () => {
    if (!deleteModalId) return;
    const res = await deleteRecord(deleteModalId);
    if (!res?.success) {
      toast.error("Delete failed");
    }
    setDeleteModalId(null);
    setOpenDropdownId(null);
    refetch();
  };

  const SERVER_URL =
    (import.meta.env.VITE_API_BASE as string | undefined)?.replace(
      "/api",
      "",
    ) || "";
  const getHeroImageUrl = (path?: string | File) => {
    if (!path) return "/no-image.png";
    if (typeof path === "object") return URL.createObjectURL(path);
    const filename = path.replace(/\\/g, "/").split("/").pop();
    return filename
      ? `${SERVER_URL}/uploads/hero/${filename}`
      : "/no-image.png";
  };

  const truncateText = (text: string, max: number) =>
    text.length > max ? text.slice(0, max) + "…" : text;

  const Dropdown = ({
    articleId,
    top,
    left,
  }: {
    articleId: string;
    top: number;
    left: number;
  }) =>
    createPortal(
      <div
        ref={dropdownRef}
        className="absolute z-50 w-36 rounded-xl border border-gray-200 bg-white p-1 shadow-lg"
        style={{ top, left }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => {
            handleViewClick(articleId);
            setOpenDropdownId(null);
          }}
          className="flex h-9 w-full items-center gap-2 rounded-lg px-3 text-sm text-gray-700 transition hover:bg-gray-100"
        >
          <FiEye /> View
        </button>

        <button
          onClick={() => {
            handleEditClick(articleId);
            setOpenDropdownId(null);
          }}
          className="flex h-9 w-full items-center gap-2 rounded-lg px-3 text-sm text-gray-700 transition hover:bg-gray-100"
        >
          <FiEdit /> Edit
        </button>

        <button
          onClick={() => {
            setDeleteModalId(articleId);
            setOpenDropdownId(null);
          }}
          className="flex h-9 w-full items-center gap-2 rounded-lg px-3 text-sm text-red-600 transition hover:bg-red-50"
        >
          <FiTrash2 /> Delete
        </button>
      </div>,
      document.body,
    );

  /* ------------------- Table Columns ------------------- */
  const columns: TableColumn<Article>[] = [
    {
      key: "index",
      label: "#",
      render: (_row, idx) => (page - 1) * recordsPerPage + idx + 1,
    },
    {
      key: "hero_image",
      label: "Image",
      render: (row) => (
        <div
          className="w-20 h-14 border border-gray-200 rounded-md overflow-hidden bg-gray-50 flex items-center justify-center cursor-pointer group"
          onClick={() =>
            row.hero_image && setPreviewImage(getHeroImageUrl(row.hero_image))
          }
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
    {
      key: "title",
      label: "Title",
      sortable: true,
      render: (row) => truncateText(row.title, 30),
    },
    {
      key: "topic_id",
      label: "Topic",
      sortable: true,
      render: (row) => truncateText(row.topic_id?.title || "-", 30),
    },
    {
      key: "is_active",
      label: "Active",
      render: (row) => (
        <button
          onClick={() => handleToggleStatus(row._id, row.is_active)}
          className={`px-4 py-1 rounded text-white ${
            row.is_active ? "bg-green-600" : "bg-gray-600"
          }`}
        >
          {row.is_active ? "Active" : "Inactive"}
        </button>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <>
          <button
            onClick={(e) => handleDropdownClick(e, row._id)}
            className="rounded-full p-2 text-gray-600 transition hover:bg-gray-100"
          >
            <FiMoreVertical />
          </button>

          {openDropdownId === row._id && (
            <Dropdown
              articleId={row._id}
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
        onPageChange={handlePageChange}
        onRecordsPerPageChange={handleRecordsPerPageChange}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        sortField={sortField}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
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
                Are you sure you want to delete this article?
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
              <img
                src={previewImage}
                className="max-h-[90vh] mx-auto rounded-lg shadow-xl"
              />
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
