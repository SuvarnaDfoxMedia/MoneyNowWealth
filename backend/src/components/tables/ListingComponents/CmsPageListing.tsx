// import React, { useState, useEffect, useRef } from "react";
// import { useNavigate, useSearchParams } from "react-router-dom";
// import { toast } from "react-hot-toast";
// import {
//   FiEdit,
//   FiTrash2,
//   FiMoreVertical,
//   FiPlus,
//   FiEye,
// } from "react-icons/fi";
// import { createPortal } from "react-dom";
// import { DataTable, TableColumn } from "../../PagesComponent/DataTable";
// import { useCommonCrud } from "../../../hooks/useCommonCrud";
// import { useDataTableStore } from "../../../store/dataTableStore";

// interface CmsPage {
//   _id: string;
//   page_code: string;
//   title: string;
//   status: "draft" | "published" | "archived";
//   is_active: number;
// }

// export default function CmsPageListing() {
//   const navigate = useNavigate();
//   const [searchParams, setSearchParams] = useSearchParams();
//   const dropdownRef = useRef<HTMLDivElement | null>(null);

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

//   /** Restore URL → Zustand */
//   useEffect(() => {
//     const urlPage = Number(searchParams.get("page")) || 1;
//     const urlLimit = Number(searchParams.get("limit")) || 10;
//     const navSource = searchParams.get("nav");

//     //  FIX: Check navigation source
//     if (navSource === "sidebar") {
//       // Sidebar navigation - start at page 1
//       setPage(1);
//     } else {
//       // Edit operation or direct URL - use the page parameter
//       setPage(urlPage);
//     }

//     setRecordsPerPage(urlLimit);
//   }, [searchParams]);

//   /** Fetch CMS Pages */
//   const { data, isLoading, refetch, deleteRecord } = useCommonCrud({
//     module: "cmspages",
//     role: "admin",
//     page,
//     limit: recordsPerPage,
//     searchValue,
//     sortField,
//     sortOrder,
//   });

//   const [pages, setPages] = useState<CmsPage[]>([]);
//   const totalRecords = data?.total || 0;
//   const totalPages = Math.max(Math.ceil(totalRecords / recordsPerPage), 1);

//   /** Sync API → State */
//   useEffect(() => {
//     if (data?.pages) {
//       const filtered = data.pages.filter(
//         (p: CmsPage) => p.status !== "archived",
//       );
//       setPages(filtered);
//     }
//   }, [data]);

//   /** Zustand → URL */
//   // useEffect(() => {
//   //   setSearchParams({
//   //     page: String(page),
//   //     limit: String(recordsPerPage),
//   //   });

//   //   // Save to sessionStorage for AddCmsPage fallback
//   //   sessionStorage.setItem("lastCmsPagePage", String(page));
//   //   sessionStorage.setItem("lastCmsPageLimit", String(recordsPerPage));
//   // }, [page, recordsPerPage]);

//   /** Debounced search + sort + pagination */
//   useEffect(() => {
//     const timer = setTimeout(() => refetch(), 400);
//     return () => clearTimeout(timer);
//   }, [searchValue, sortField, sortOrder, page, recordsPerPage]);

//   /** Dropdown + Delete */
//   const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
//   const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
//   const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

//   /** Toggle dropdown */
//   const handleDropdownClick = (
//     e: React.MouseEvent<HTMLButtonElement>,
//     id: string,
//   ) => {
//     e.stopPropagation();
//     const rect = e.currentTarget.getBoundingClientRect();
//     setDropdownPos({
//       top: rect.bottom + window.scrollY,
//       left: rect.right - 144,
//     });
//     setOpenDropdownId(openDropdownId === id ? null : id);
//   };

//   /** Close dropdown on outside click */
//   useEffect(() => {
//     const handleClickOutside = (e: MouseEvent) => {
//       if (
//         dropdownRef.current &&
//         !dropdownRef.current.contains(e.target as Node)
//       ) {
//         setOpenDropdownId(null);
//       }
//     };
//     document.addEventListener("click", handleClickOutside);
//     return () => document.removeEventListener("click", handleClickOutside);
//   }, []);

//   /** Local toggle Active/Inactive */
//   const handleToggleStatus = (id: string) => {
//     setPages((prev) =>
//       prev.map((p) =>
//         p._id === id ? { ...p, is_active: p.is_active === 1 ? 0 : 1 } : p,
//       ),
//     );
//     toast.success("Status updated locally");
//   };

//   /** Delete page */
//   const handleDelete = async () => {
//     if (!deleteModalId) return;
//     try {
//       const res = await deleteRecord(deleteModalId);
//       if (res?.success) {
//         toast.success("Page deleted");
//         setPages((prev) => prev.filter((p) => p._id !== deleteModalId));
//         refetch();
//       } else {
//         toast.error("Failed to delete");
//       }
//     } catch {
//       toast.error("Failed to delete");
//     } finally {
//       setDeleteModalId(null);
//     }
//   };

//   /** Dropdown component */
//   const Dropdown = ({
//     pageId,
//     top,
//     left,
//   }: {
//     pageId: string;
//     top: number;
//     left: number;
//   }) =>
//     createPortal(
//       <div
//         ref={dropdownRef}
//         className="absolute bg-white border rounded-xl shadow-lg z-50"
//         style={{ top, left, width: "9rem" }}
//         onClick={(e) => e.stopPropagation()}
//       >
//         <button
//           onClick={() => {
//             navigate(`/admin/cmspages/view/${pageId}`);
//             setOpenDropdownId(null);
//           }}
//           className="flex items-center gap-2 px-4 py-2 hover:bg-blue-50 w-full"
//         >
//           <FiEye /> View
//         </button>

//         <button
//           onClick={() => {
//             navigate(`/admin/cmspages/edit/${pageId}`);
//             setOpenDropdownId(null);
//           }}
//           className="flex items-center gap-2 px-4 py-2 hover:bg-indigo-50 w-full"
//         >
//           <FiEdit /> Edit
//         </button>

//         <button
//           onClick={() => {
//             setDeleteModalId(pageId);
//             setOpenDropdownId(null);
//           }}
//           className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 w-full"
//         >
//           <FiTrash2 /> Delete
//         </button>
//       </div>,
//       document.body,
//     );

//   /** Table columns */
//   const columns: TableColumn<CmsPage>[] = [
//     {
//       key: "index",
//       label: "#",
//       render: (_row, idx) => (page - 1) * recordsPerPage + idx + 1,
//     },
//     {
//       key: "title",
//       label: "Title",
//       sortable: true,
//       render: (row) => row.title,
//     },
//     {
//       key: "is_active",
//       label: "Status",
//       render: (row) => (
//         <button
//           onClick={() => handleToggleStatus(row._id)}
//           className={`px-3 py-1 rounded text-sm text-white ${
//             row.is_active === 1 ? "bg-green-600" : "bg-gray-500"
//           }`}
//         >
//           {row.is_active === 1 ? "Active" : "Inactive"}
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
//             className="p-2 hover:bg-gray-100 rounded-full"
//           >
//             <FiMoreVertical size={18} />
//           </button>
//           {openDropdownId === row._id && (
//             <Dropdown
//               pageId={row._id}
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
//         <h2 className="text-xl font-medium">CMS Pages</h2>
//         <button
//           onClick={() => navigate(`/admin/cmspages/create`)}
//           className="bg-[#043f79] text-white px-3 py-2 rounded-md shadow-md flex items-center gap-2"
//         >
//           <FiPlus /> Add
//         </button>
//       </div>

//       <DataTable
//         columns={columns}
//         data={pages}
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
//               <h3 className="text-lg font-semibold">Confirm Delete</h3>
//               <p className="my-4 text-gray-600">
//                 Are you sure you want to delete this page?
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
//           document.body,
//         )}
//     </div>
//   );
// }

"use client";

import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  FiEdit,
  FiTrash2,
  FiMoreVertical,
  FiPlus,
  FiEye,
} from "react-icons/fi";
import { createPortal } from "react-dom";
import { DataTable, TableColumn } from "../../PagesComponent/DataTable";
import { useCommonCrud } from "../../../hooks/useCommonCrud";
import { useDataTableStore } from "../../../store/dataTableStore";

interface CmsPage {
  _id: string;
  page_code: string;
  title: string;
  status: "draft" | "published" | "archived";
  is_active: number;
}

export default function CmsPageListing() {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const MODULE_KEY = "admin-cmspages";
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
      !storedPath.includes("/cmspages") &&
      currentPath.includes("/cmspages")
    ) {
      // Coming from different tab, mark as tab switch
      markTabSwitch();
    }

    // Store current path for next navigation
    sessionStorage.setItem("lastPath", currentPath);
  }, [location.pathname]);

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
  }, [MODULE_KEY]);

  /* ------------------- Fetch CMS Pages ------------------- */
  const { data, isLoading, refetch, deleteRecord } = useCommonCrud({
    module: "cmspages",
    role: "admin",
    page,
    limit: recordsPerPage,
    searchValue,
    sortField,
    sortOrder,
    enabled: isMounted,
  });

  const [pages, setPages] = useState<CmsPage[]>([]);
  const totalRecords = data?.total || 0;
  const totalPages = Math.max(Math.ceil(totalRecords / recordsPerPage), 1);

  /* ------------------- Sync API → State ------------------- */
  useEffect(() => {
    if (data?.pages) {
      const filtered = data.pages.filter(
        (p: CmsPage) => p.status !== "archived",
      );
      setPages(filtered);
    }
  }, [data]);

  /* ------------------- Debounced search + sort + pagination ------------------- */
  useEffect(() => {
    if (!isMounted) return;

    const timer = setTimeout(() => refetch(), 400);
    return () => clearTimeout(timer);
  }, [searchValue, sortField, sortOrder, page, recordsPerPage, isMounted]);

  /* ------------------- Navigation handlers ------------------- */
  const handleEditClick = (id: string) => {
    markEditNavigation();
    cacheModuleState(MODULE_KEY);
    navigate(`/admin/cmspages/edit/${id}`);
  };

  const handleViewClick = (id: string) => {
    markEditNavigation();
    cacheModuleState(MODULE_KEY);
    navigate(`/admin/cmspages/view/${id}`);
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
    const handleNavClick = () => {
      setTimeout(() => {
        const currentPath = window.location.pathname;
        if (!currentPath.includes("/cmspages")) {
          markTabSwitch();
        }
      }, 100);
    };

    document.addEventListener("click", handleNavClick);
    return () => document.removeEventListener("click", handleNavClick);
  }, []);

  /* ------------------- Dropdown + Delete ------------------- */
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  /** Toggle dropdown */
  const handleDropdownClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    id: string,
  ) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + window.scrollY,
      left: rect.right - 144,
    });
    setOpenDropdownId(openDropdownId === id ? null : id);
  };

  /** Close dropdown on outside click */
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

  /** Local toggle Active/Inactive */
  const handleToggleStatus = (id: string) => {
    setPages((prev) =>
      prev.map((p) =>
        p._id === id ? { ...p, is_active: p.is_active === 1 ? 0 : 1 } : p,
      ),
    );
    toast.success("Status updated locally");
  };

  /** Delete page */
  const handleDelete = async () => {
    if (!deleteModalId) return;
    try {
      const res = await deleteRecord(deleteModalId);
      if (res?.success) {
        toast.success("Page deleted");
        setPages((prev) => prev.filter((p) => p._id !== deleteModalId));
        refetch();
      } else {
        toast.error("Failed to delete");
      }
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleteModalId(null);
    }
  };

  /** Dropdown component */
  const Dropdown = ({
    pageId,
    top,
    left,
  }: {
    pageId: string;
    top: number;
    left: number;
  }) =>
    createPortal(
      <div
        ref={dropdownRef}
        className="absolute bg-white border rounded-xl shadow-lg z-50"
        style={{ top, left, width: "9rem" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => {
            handleViewClick(pageId);
            setOpenDropdownId(null);
          }}
          className="flex items-center gap-2 px-4 py-2 hover:bg-blue-50 w-full"
        >
          <FiEye /> View
        </button>

        <button
          onClick={() => {
            handleEditClick(pageId);
            setOpenDropdownId(null);
          }}
          className="flex items-center gap-2 px-4 py-2 hover:bg-indigo-50 w-full"
        >
          <FiEdit /> Edit
        </button>

        <button
          onClick={() => {
            setDeleteModalId(pageId);
            setOpenDropdownId(null);
          }}
          className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 w-full"
        >
          <FiTrash2 /> Delete
        </button>
      </div>,
      document.body,
    );

  /** Table columns */
  const columns: TableColumn<CmsPage>[] = [
    {
      key: "index",
      label: "#",
      render: (_row, idx) => (page - 1) * recordsPerPage + idx + 1,
    },
    {
      key: "title",
      label: "Title",
      sortable: true,
      render: (row) => row.title,
    },
    {
      key: "is_active",
      label: "Status",
      render: (row) => (
        <button
          onClick={() => handleToggleStatus(row._id)}
          className={`px-3 py-1 rounded text-sm text-white ${
            row.is_active === 1 ? "bg-green-600" : "bg-gray-500"
          }`}
        >
          {row.is_active === 1 ? "Active" : "Inactive"}
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
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <FiMoreVertical size={18} />
          </button>
          {openDropdownId === row._id && (
            <Dropdown
              pageId={row._id}
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
      <div className="flex justify-between mb-6">
        <h2 className="text-xl font-medium">CMS Pages</h2>
        <button
          onClick={() => {
            cacheModuleState(MODULE_KEY);
            navigate(`/admin/cmspages/create`);
          }}
          className="bg-[#043f79] text-white px-3 py-2 rounded-md shadow-md flex items-center gap-2"
        >
          <FiPlus /> Add
        </button>
      </div>

      <DataTable
        columns={columns}
        data={pages}
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
          <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-[99999]">
            <div className="bg-white p-6 rounded-xl w-96">
              <h3 className="text-lg font-semibold">Confirm Delete</h3>
              <p className="my-4 text-gray-600">
                Are you sure you want to delete this page?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteModalId(null)}
                  className="border px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg"
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
