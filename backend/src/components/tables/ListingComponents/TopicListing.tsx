// "use client";

// import { useEffect, useState } from "react";
// import { useNavigate, useParams, useSearchParams } from "react-router-dom";
// import { toast } from "react-hot-toast";
// import { FiEdit, FiTrash2, FiMoreVertical, FiPlus } from "react-icons/fi";
// import { DataTable, TableColumn } from "../../PagesComponent/DataTable";
// import { useCommonCrud } from "../../../hooks/useCommonCrud";
// import { useDataTableStore } from "../../../store/dataTableStore";

// interface Topic {
//   _id: string;
//   cluster_id?: { _id: string; cluster_code?: string; title?: string } | string;
//   title: string;
//   slug: string;
//   status: "draft" | "published" | "archived" | "live";
//   is_active: number;
//   access_type?: "free" | "premium";
//   publish_date?: string;
// }

// export default function TopicListing() {
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

//   const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
//   const [deleteModalId, setDeleteModalId] = useState<string | null>(null);

//   // Use latest useCommonCrud
//   const { data, extractList, refetch, deleteRecord, toggleStatus, isLoading } =
//     useCommonCrud<Topic>({
//       role,
//       module: "topic",
//       page,
//       limit: recordsPerPage,
//       searchValue,
//       sortField,
//       sortOrder,
//       listKey: "topics", // optional but explicit
//     });

//   const [topics, setTopics] = useState<Topic[]>([]);

//   // Sync API data → local state
//   useEffect(() => {
//     setTopics(extractList);
//   }, [extractList]);

//   const totalRecords = data?.total || 0;
//   const totalPages = Math.max(Math.ceil(totalRecords / recordsPerPage), 1);

//   // // Restore page/limit from URL
//   // useEffect(() => {
//   //   const urlPage = Number(searchParams.get("page")) || 1;
//   //   const urlLimit = Number(searchParams.get("limit")) || 10;
//   //   const navSource = searchParams.get("nav");

//   //   // FIX: Check navigation source
//   //   if (navSource === "sidebar") {
//   //     // Sidebar navigation - start at page 1
//   //     setPage(1);
//   //   } else {
//   //     // Edit operation or direct URL - use the page parameter
//   //     setPage(urlPage);
//   //   }

//   //   setRecordsPerPage(urlLimit);
//   // }, [searchParams]);

//   // Auto refetch on table changes
//   useEffect(() => {
//     const timer = setTimeout(() => refetch(), 300);
//     return () => clearTimeout(timer);
//   }, [page, recordsPerPage, searchValue, sortField, sortOrder]);

//   // Sync URL
//   // useEffect(() => {
//   //   setSearchParams({ page: String(page), limit: String(recordsPerPage) });
//   // }, [page, recordsPerPage]);

//   // Close dropdown on outside click
//   useEffect(() => {
//     const handler = (e: MouseEvent) => {
//       if (!(e.target as HTMLElement).closest(".dropdown"))
//         setOpenDropdownId(null);
//     };
//     window.addEventListener("click", handler);
//     return () => window.removeEventListener("click", handler);
//   }, []);

//   const handleSort = (field: string) => {
//     setSort(field, sortField === field && sortOrder === "asc" ? "desc" : "asc");
//   };

//   const handleToggle = async (id: string, currentStatus: number) => {
//     const newStatus = currentStatus === 1 ? 0 : 1;
//     setTopics((prev) =>
//       prev.map((t) => (t._id === id ? { ...t, is_active: newStatus } : t)),
//     );
//     try {
//       await toggleStatus(id, newStatus === 1);
//     } catch {
//       toast.error("Failed to update status");
//       setTopics((prev) =>
//         prev.map((t) =>
//           t._id === id ? { ...t, is_active: currentStatus } : t,
//         ),
//       );
//     }
//   };

//   const handleDelete = async () => {
//     if (!deleteModalId) return;
//     const result = await deleteRecord(deleteModalId);
//     if (result.success) {
//       toast.success("Topic deleted");
//       refetch();
//     } else {
//       toast.error(result.message || "Delete failed");
//     }
//     setDeleteModalId(null);
//   };

//   const renderStatusBadge = (status: Topic["status"]) => {
//     const map = {
//       published: "text-green-600",
//       draft: "text-yellow-600",
//       archived: "text-gray-600",
//       live: "text-blue-600",
//     };
//     return (
//       <span className={`text-sm font-semibold ${map[status]}`}>
//         {status[0].toUpperCase() + status.slice(1)}
//       </span>
//     );
//   };

//   const columns: TableColumn<Topic>[] = [
//     {
//       key: "index",
//       label: "#",
//       render: (_row, idx) => (page - 1) * recordsPerPage + idx + 1,
//     },
//     {
//       key: "title",
//       label: "Title",
//       sortable: true,
//       render: (row) =>
//         row.title.length > 35 ? row.title.substring(0, 35) + "..." : row.title,
//     },
//     {
//       key: "cluster_id",
//       label: "Cluster",
//       sortable: true,
//       render: (row) =>
//         typeof row.cluster_id === "string" ? "-" : row.cluster_id?.title || "-",
//     },
//     {
//       key: "status",
//       label: "Publish Status",
//       sortable: true,
//       render: (row) => renderStatusBadge(row.status),
//     },
//     {
//       key: "publish_date",
//       label: "Publish Date",
//       sortable: true,
//       render: (row) =>
//         row.publish_date
//           ? new Date(row.publish_date).toLocaleDateString("en-GB")
//           : "-",
//     },
//     {
//       key: "access_type",
//       label: "Topic Type",
//       sortable: true,
//       render: (row) =>
//         row.access_type ? (
//           <span
//             className={`text-sm font-medium ${
//               row.access_type === "premium"
//                 ? "text-purple-600"
//                 : "text-gray-700"
//             }`}
//           >
//             {row.access_type[0].toUpperCase() + row.access_type.slice(1)}
//           </span>
//         ) : (
//           "-"
//         ),
//     },
//     {
//       key: "is_active",
//       label: "Visibility",
//       render: (row) => (
//         <button
//           onClick={() => handleToggle(row._id, row.is_active)}
//           className={`px-4 py-1 min-w-[90px] rounded-sm text-white text-sm font-medium transition-all ${
//             row.is_active ? "bg-green-600" : "bg-gray-500"
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
//         <div className="relative dropdown">
//           <button
//             onClick={(e) => {
//               e.stopPropagation();
//               setOpenDropdownId(openDropdownId === row._id ? null : row._id);
//             }}
//             className="p-2 rounded-full hover:bg-gray-100"
//           >
//             <FiMoreVertical size={18} />
//           </button>

//           {openDropdownId === row._id && (
//             <div className="absolute top-full right-0 mt-2 bg-white border rounded-xl shadow-lg w-30 z-50">
//               <button
//                 onClick={() => navigate(`/${role}/topic/edit/${row._id}`)}
//                 className="flex items-center gap-2 px-4 py-2 hover:bg-indigo-50 w-full"
//               >
//                 <FiEdit className="text-lg" />
//                 <span>Edit</span>
//               </button>

//               <button
//                 onClick={() => setDeleteModalId(row._id)}
//                 className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 w-full"
//               >
//                 <FiTrash2 className="text-lg" />
//                 <span>Delete</span>
//               </button>
//             </div>
//           )}
//         </div>
//       ),
//     },
//   ];

//   return (
//     <div className="bg-gray-50 min-h-screen p-4">
//       <div className="flex justify-between mb-6">
//         <h2 className="text-xl font-medium">Topics</h2>

//         {(role === "admin" || role === "editor") && (
//           <button
//             onClick={() => navigate(`/${role}/topic/create`)}
//             className="bg-[#043f79] text-white px-3 py-2 rounded-md shadow-md flex items-center gap-2"
//           >
//             <FiPlus /> Add
//           </button>
//         )}
//       </div>

//       <DataTable
//         columns={columns}
//         data={topics}
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
//         onSortChange={handleSort}
//       />

//       {/* Delete Modal */}
//       {deleteModalId && (
//         <div className="fixed inset-0 bg-black/70 bg-opacity-70 flex justify-center items-center z-[99999]">
//           <div className="bg-white p-6 rounded-xl w-96">
//             <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
//             <p className="mb-6 text-gray-600">
//               Are you sure you want to delete this topic?
//             </p>
//             <div className="flex justify-end gap-4">
//               <button
//                 onClick={() => setDeleteModalId(null)}
//                 className="px-4 py-2 border rounded"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleDelete}
//                 className="px-4 py-2 bg-red-600 text-white rounded"
//               >
//                 Delete
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FiEdit, FiTrash2, FiMoreVertical, FiPlus } from "react-icons/fi";
import { DataTable, TableColumn } from "../../PagesComponent/DataTable";
import { useCommonCrud } from "../../../hooks/useCommonCrud";
import { useDataTableStore } from "../../../store/dataTableStore";

interface Topic {
  _id: string;
  cluster_id?: { _id: string; cluster_code?: string; title?: string } | string;
  title: string;
  slug: string;
  status: "draft" | "published" | "archived" | "live";
  is_active: number;
  access_type?: "free" | "premium";
  publish_date?: string;
}

export default function TopicListing() {
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const MODULE_KEY = `${role}-topics`;
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

  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);

  /* ------------------- Detect tab switching ------------------- */
  useEffect(() => {
    // Store current path to detect tab switches
    const currentPath = location.pathname;
    const storedPath = sessionStorage.getItem("lastPath");

    // Check if we're switching tabs (different module)
    if (
      storedPath &&
      !storedPath.includes("/topic") &&
      currentPath.includes("/topic")
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

  /* ------------------- Navigation to edit ------------------- */
  const handleEditClick = (id: string) => {
    // Mark that we're going to edit
    markEditNavigation();
    // Cache current state
    cacheModuleState(MODULE_KEY);

    navigate(`/${role}/topic/edit/${id}`);
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
        if (!currentPath.includes("/topic")) {
          // User navigated away from topics
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

  /* ------------------- Fetch Data ------------------- */
  const { data, extractList, refetch, deleteRecord, toggleStatus, isLoading } =
    useCommonCrud<Topic>({
      role,
      module: "topic",
      page,
      limit: recordsPerPage,
      searchValue,
      sortField,
      sortOrder,
      listKey: "topics",
      enabled: isMounted,
    });

  const [topics, setTopics] = useState<Topic[]>([]);

  // Sync API data → local state
  useEffect(() => {
    setTopics(extractList);
  }, [extractList]);

  const totalRecords = data?.total || 0;
  const totalPages = Math.max(Math.ceil(totalRecords / recordsPerPage), 1);

  // Auto refetch on table changes
  useEffect(() => {
    if (!isMounted) return;

    const timer = setTimeout(() => refetch(), 300);
    return () => clearTimeout(timer);
  }, [page, recordsPerPage, searchValue, sortField, sortOrder, isMounted]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".dropdown"))
        setOpenDropdownId(null);
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  const handleToggle = async (id: string, currentStatus: number) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    setTopics((prev) =>
      prev.map((t) => (t._id === id ? { ...t, is_active: newStatus } : t)),
    );
    try {
      await toggleStatus(id, newStatus === 1);
    } catch {
      toast.error("Failed to update status");
      setTopics((prev) =>
        prev.map((t) =>
          t._id === id ? { ...t, is_active: currentStatus } : t,
        ),
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteModalId) return;
    const result = await deleteRecord(deleteModalId);
    if (result.success) {
      toast.success("Topic deleted");
      refetch();
    } else {
      toast.error(result.message || "Delete failed");
    }
    setDeleteModalId(null);
  };

  const renderStatusBadge = (status: Topic["status"]) => {
    const map = {
      published: "text-green-600",
      draft: "text-yellow-600",
      archived: "text-gray-600",
      live: "text-blue-600",
    };
    return (
      <span className={`text-sm font-semibold ${map[status]}`}>
        {status[0].toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const columns: TableColumn<Topic>[] = [
    {
      key: "index",
      label: "#",
      render: (_row, idx) => (page - 1) * recordsPerPage + idx + 1,
    },
    {
      key: "title",
      label: "Title",
      sortable: true,
      render: (row) =>
        row.title.length > 35 ? row.title.substring(0, 35) + "..." : row.title,
    },
    {
      key: "cluster_id",
      label: "Cluster",
      sortable: true,
      render: (row) =>
        typeof row.cluster_id === "string" ? "-" : row.cluster_id?.title || "-",
    },
    {
      key: "status",
      label: "Publish Status",
      sortable: true,
      render: (row) => renderStatusBadge(row.status),
    },
    {
      key: "publish_date",
      label: "Publish Date",
      sortable: true,
      render: (row) =>
        row.publish_date
          ? new Date(row.publish_date).toLocaleDateString("en-GB")
          : "-",
    },
    {
      key: "access_type",
      label: "Topic Type",
      sortable: true,
      render: (row) =>
        row.access_type ? (
          <span
            className={`text-sm font-medium ${
              row.access_type === "premium"
                ? "text-purple-600"
                : "text-gray-700"
            }`}
          >
            {row.access_type[0].toUpperCase() + row.access_type.slice(1)}
          </span>
        ) : (
          "-"
        ),
    },
    {
      key: "is_active",
      label: "Visibility",
      render: (row) => (
        <button
          onClick={() => handleToggle(row._id, row.is_active)}
          className={`px-4 py-1 min-w-[90px] rounded-sm text-white text-sm font-medium transition-all ${
            row.is_active ? "bg-green-600" : "bg-gray-500"
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
        <div className="relative dropdown">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenDropdownId(openDropdownId === row._id ? null : row._id);
            }}
            className="rounded-full p-2 text-gray-600 transition hover:bg-gray-100"
          >
            <FiMoreVertical size={18} />
          </button>

          {openDropdownId === row._id && (
            <div className="absolute right-0 top-full z-50 mt-2 w-36 rounded-xl border border-gray-200 bg-white p-1 shadow-lg">
              <button
                onClick={() => handleEditClick(row._id)}
                className="flex h-9 w-full items-center gap-2 rounded-lg px-3 text-sm text-gray-700 transition hover:bg-gray-100"
              >
                <FiEdit className="text-lg" />
                <span>Edit</span>
              </button>

              <button
                onClick={() => setDeleteModalId(row._id)}
                className="flex h-9 w-full items-center gap-2 rounded-lg px-3 text-sm text-red-600 transition hover:bg-red-50"
              >
                <FiTrash2 className="text-lg" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
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
    <div className="bg-gray-50 min-h-screen p-4">
      <div className="flex justify-between mb-6">
        <h2 className="text-xl font-medium">Topics</h2>

        {(role === "admin" || role === "editor") && (
          <button
            onClick={() => {
              cacheModuleState(MODULE_KEY);
              navigate(`/${role}/topic/create`);
            }}
            className="bg-[#043f79] text-white px-3 py-2 rounded-md shadow-md flex items-center gap-2"
          >
            <FiPlus /> Add
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={topics}
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
      {deleteModalId && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              Confirm Delete
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete this topic?
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
        </div>
      )}
    </div>
  );
}

