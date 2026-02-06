// "use client";

// import React, { useState, useEffect, useRef } from "react";
// import { useNavigate, useParams, useSearchParams } from "react-router-dom";
// import { toast } from "react-hot-toast";
// import { FiEdit, FiTrash2, FiMoreVertical, FiPlus } from "react-icons/fi";
// import { createPortal } from "react-dom";
// import { DataTable, TableColumn } from "../../PagesComponent/DataTable";
// import { useCommonCrud } from "../../../hooks/useCommonCrud";
// import { useDataTableStore } from "../../../store/dataTableStore";

// interface SubscriptionPlan {
//   _id: string;
//   name: string;
//   description: string;
//   price: number;
//   currency: string;
//   duration: { value: number; unit: string };
//   features: string[];
//   is_active: boolean;
//   is_deleted?: boolean;
//   created_at: string;
// }

// export default function SubscriptionListing() {
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

//   useEffect(() => {
//     if (!sortField || !sortOrder) {
//       console.log("Setting default sort to created_at desc");
//       setSort("created_at", "desc");
//     }
//   }, [sortField, sortOrder, setSort]);

//   // ------------------ Fetch Data ------------------
//   const { data, refetch, deleteRecord, toggleStatus, isLoading } =
//     useCommonCrud<SubscriptionPlan>({
//       role,
//       module: "subscription-plan",
//       page,
//       limit: recordsPerPage,
//       searchValue,
//       sortField,
//       sortOrder,
//       listKey: "plans",
//     });

//   console.log("Sort params being sent:", { sortField, sortOrder });

//   const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
//   const totalRecords = data?.total || 0;
//   const totalPages = Math.max(Math.ceil(totalRecords / recordsPerPage), 1);

//   // ------------------ Sync data → local state ------------------
//   useEffect(() => {
//     if (data?.plans) {
//       const validPlans: SubscriptionPlan[] = (
//         data.plans as SubscriptionPlan[]
//       ).filter((p) => !p.is_deleted);

//       let sortedPlans = validPlans;
//       if (sortField === "created_at" && sortOrder === "desc") {
//         // Sort by created_at descending (newest first)
//         sortedPlans = validPlans.sort(
//           (a, b) =>
//             new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
//         );
//         console.log("Client-side sorting: newest first");
//       } else if (sortField === "created_at" && sortOrder === "asc") {
//         // Sort by created_at ascending (oldest first)
//         sortedPlans = validPlans.sort(
//           (a, b) =>
//             new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
//         );
//         console.log("Client-side sorting: oldest first");
//       }

//       console.log("Sorted plans count:", sortedPlans.length);

//       console.log(
//         "First 3 plans:",
//         sortedPlans.slice(0, 3).map((p) => ({
//           name: p.name,
//           created_at: p.created_at,
//         })),
//       );

//       setPlans(sortedPlans);
//     }
//   }, [data, sortField, sortOrder]);

//   // ------------------ Debounced refetch ------------------
//   useEffect(() => {
//     const timer = setTimeout(() => refetch(), 300);
//     return () => clearTimeout(timer);
//   }, [searchValue, sortField, sortOrder, page, recordsPerPage]);

//   // ------------------ Dropdown ------------------
//   const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
//   const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
//   const dropdownRef = useRef<HTMLDivElement | null>(null);

//   const handleDropdownClick = (e: React.MouseEvent, id: string) => {
//     e.stopPropagation();
//     const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
//     setDropdownPos({
//       top: rect.bottom + window.scrollY + 6,
//       left: rect.left + window.scrollX - 80,
//     });
//     setOpenDropdownId((prev) => (prev === id ? null : id));
//   };

//   useEffect(() => {
//     function handleOutsideClick(e: MouseEvent) {
//       if (
//         dropdownRef.current &&
//         !dropdownRef.current.contains(e.target as Node)
//       ) {
//         setOpenDropdownId(null);
//       }
//     }
//     window.addEventListener("mousedown", handleOutsideClick);
//     return () => window.removeEventListener("mousedown", handleOutsideClick);
//   }, []);

//   // ------------------ Delete ------------------
//   const [deleteModalId, setDeleteModalId] = useState<string | null>(null);

//   const handleDelete = async () => {
//     if (!deleteModalId) return;

//     const res = await deleteRecord(deleteModalId);
//     if (res?.success) {
//       toast.success("Plan deleted");
//       setPlans((prev) => prev.filter((p) => p._id !== deleteModalId));
//       refetch();
//     } else {
//       toast.error(res?.message || "Failed to delete plan");
//     }
//     setDeleteModalId(null);
//   };

//   // ------------------ Columns ------------------
//   const columns: TableColumn<SubscriptionPlan>[] = [
//     {
//       key: "index",
//       label: "#",
//       render: (_row, idx) => (page - 1) * recordsPerPage + idx + 1,
//     },
//     { key: "name", label: "Name", sortable: true },
//     {
//       key: "price",
//       label: "Price",
//       sortable: true,
//       render: (row) => `${row.currency} ${row.price}`,
//     },
//     {
//       key: "duration",
//       label: "Duration",
//       sortable: true,
//       render: (row) => {
//         const u = row.duration.unit;
//         const formatted = `${row.duration.value} ${u}`;
//         return formatted.charAt(0).toUpperCase() + formatted.slice(1);
//       },
//     },
//     {
//       key: "is_active",
//       label: "Activation",
//       render: (row) => (
//         <button
//           onClick={async () => {
//             try {
//               const newStatus = !row.is_active;
//               const res = await toggleStatus(row._id, newStatus);
//               setPlans((prev) =>
//                 prev.map((p) =>
//                   p._id === row._id ? { ...p, is_active: newStatus } : p,
//                 ),
//               );
//               toast.success(res?.message || "Status updated");
//             } catch (err: any) {
//               toast.error(err?.message || "Failed to update status");
//             }
//           }}
//           className={`px-4 py-1 rounded-md text-white ${
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
//             onMouseDown={(e) => e.stopPropagation()}
//             onClick={(e) => handleDropdownClick(e, row._id)}
//             className="p-2 rounded-full hover:bg-gray-100"
//           >
//             <FiMoreVertical size={18} />
//           </button>

//           {openDropdownId === row._id &&
//             createPortal(
//               <div
//                 ref={dropdownRef}
//                 className="fixed bg-white border rounded-xl shadow-lg z-[99999]"
//                 style={{
//                   top: dropdownPos.top,
//                   left: dropdownPos.left,
//                   width: "9rem",
//                 }}
//               >
//                 <button
//                   onClick={() => {
//                     navigate(`/${role}/subscriptionplan/edit/${row._id}`);
//                     setOpenDropdownId(null);
//                   }}
//                   className="flex items-center gap-2 px-4 py-2 hover:bg-indigo-50 w-full"
//                 >
//                   <FiEdit /> Edit
//                 </button>

//                 <button
//                   onClick={() => {
//                     setDeleteModalId(row._id);
//                     setOpenDropdownId(null);
//                   }}
//                   className="flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-red-600 w-full"
//                 >
//                   <FiTrash2 /> Delete
//                 </button>
//               </div>,
//               document.body,
//             )}
//         </>
//       ),
//     },
//   ];

//   return (
//     <div className="bg-gray-50 min-h-screen p-4 relative">
//       <div className="flex justify-between mb-6">
//         <h2 className="text-xl font-medium text-gray-800">
//           Subscription Plans
//         </h2>
//         <button
//           onClick={() => navigate(`/${role}/subscriptionplan/create`)}
//           className="bg-[#043f79] text-white px-3 py-2 rounded-md shadow-md flex items-center gap-2"
//         >
//           <FiPlus /> Add
//         </button>
//       </div>

//       <DataTable
//         columns={columns}
//         data={plans}
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
//         onSortChange={(field, order) => setSort(field, order)}
//       />

//       {deleteModalId &&
//         createPortal(
//           <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-[99999]">
//             <div className="bg-white p-6 rounded-xl w-96">
//               <h3 className="text-lg font-semibold">Confirm Delete</h3>
//               <p className="my-4 text-gray-600">
//                 Are you sure you want to delete this plan?
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
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FiEdit, FiTrash2, FiMoreVertical, FiPlus } from "react-icons/fi";
import { createPortal } from "react-dom";
import { DataTable, TableColumn } from "../../PagesComponent/DataTable";
import { useCommonCrud } from "../../../hooks/useCommonCrud";
import { useDataTableStore } from "../../../store/dataTableStore";

interface SubscriptionPlan {
  _id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration: { value: number; unit: string };
  features: string[];
  is_active: boolean;
  is_deleted?: boolean;
  created_at: string;
}

export default function SubscriptionListing() {
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const MODULE_KEY = `${role}-subscription-plans`;
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
    const currentPath = location.pathname;
    const storedPath = sessionStorage.getItem("lastPath");

    if (
      storedPath &&
      !storedPath.includes("/subscriptionplan") &&
      currentPath.includes("/subscriptionplan")
    ) {
      markTabSwitch();
    }

    sessionStorage.setItem("lastPath", currentPath);
  }, [location.pathname]);

  /* ------------------- Initialize module state ------------------- */
  useEffect(() => {
    setCurrentModule(MODULE_KEY);

    if (lastAction === "edit") {
      restoreModuleState(MODULE_KEY);
    } else if (lastAction === "tab-switch") {
      setPage(1);
    }

    // Set default sort if not set
    if (!sortField || !sortOrder) {
      console.log("Setting default sort to created_at desc");
      setSort("created_at", "desc");
    }

    setIsMounted(true);

    return () => {
      cacheModuleState(MODULE_KEY);
    };
  }, [MODULE_KEY]);

  /* ------------------- Navigation to edit ------------------- */
  const handleEditClick = (id: string) => {
    markEditNavigation();
    cacheModuleState(MODULE_KEY);
    navigate(`/${role}/subscriptionplan/edit/${id}`);
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
        if (!currentPath.includes("/subscriptionplan")) {
          markTabSwitch();
        }
      }, 100);
    };

    document.addEventListener("click", handleNavClick);
    return () => document.removeEventListener("click", handleNavClick);
  }, []);

  // ------------------ Fetch Data ------------------
  const { data, refetch, deleteRecord, toggleStatus, isLoading } =
    useCommonCrud<SubscriptionPlan>({
      role,
      module: "subscription-plan",
      page,
      limit: recordsPerPage,
      searchValue,
      sortField,
      sortOrder,
      listKey: "plans",
      enabled: isMounted,
    });

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const totalRecords = data?.total || 0;
  const totalPages = Math.max(Math.ceil(totalRecords / recordsPerPage), 1);

  // ------------------ Sync data → local state ------------------
  useEffect(() => {
    if (data?.plans) {
      const validPlans: SubscriptionPlan[] = (
        data.plans as SubscriptionPlan[]
      ).filter((p) => !p.is_deleted);

      let sortedPlans = validPlans;
      if (sortField === "created_at" && sortOrder === "desc") {
        sortedPlans = validPlans.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
      } else if (sortField === "created_at" && sortOrder === "asc") {
        sortedPlans = validPlans.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );
      }

      setPlans(sortedPlans);
    }
  }, [data, sortField, sortOrder]);

  // ------------------ Debounced refetch ------------------
  useEffect(() => {
    if (!isMounted) return;

    const timer = setTimeout(() => refetch(), 300);
    return () => clearTimeout(timer);
  }, [searchValue, sortField, sortOrder, page, recordsPerPage, isMounted]);

  // ------------------ Dropdown ------------------
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const handleDropdownClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + window.scrollY + 6,
      left: rect.left + window.scrollX - 80,
    });
    setOpenDropdownId((prev) => (prev === id ? null : id));
  };

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpenDropdownId(null);
      }
    }
    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // ------------------ Delete ------------------
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteModalId) return;

    const res = await deleteRecord(deleteModalId);
    if (res?.success) {
      toast.success("Plan deleted");
      setPlans((prev) => prev.filter((p) => p._id !== deleteModalId));
      refetch();
    } else {
      toast.error(res?.message || "Failed to delete plan");
    }
    setDeleteModalId(null);
  };

  // ------------------ Columns ------------------
  const columns: TableColumn<SubscriptionPlan>[] = [
    {
      key: "index",
      label: "#",
      render: (_row, idx) => (page - 1) * recordsPerPage + idx + 1,
    },
    { key: "name", label: "Name", sortable: true },
    {
      key: "price",
      label: "Price",
      sortable: true,
      render: (row) => `${row.currency} ${row.price}`,
    },
    {
      key: "duration",
      label: "Duration",
      sortable: true,
      render: (row) => {
        const u = row.duration.unit;
        const formatted = `${row.duration.value} ${u}`;
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
      },
    },
    {
      key: "is_active",
      label: "Activation",
      render: (row) => (
        <button
          onClick={async () => {
            try {
              const newStatus = !row.is_active;
              const res = await toggleStatus(row._id, newStatus);
              setPlans((prev) =>
                prev.map((p) =>
                  p._id === row._id ? { ...p, is_active: newStatus } : p,
                ),
              );
              toast.success(res?.message || "Status updated");
            } catch (err: any) {
              toast.error(err?.message || "Failed to update status");
            }
          }}
          className={`px-4 py-1 rounded-md text-white ${
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
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => handleDropdownClick(e, row._id)}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <FiMoreVertical size={18} />
          </button>

          {openDropdownId === row._id &&
            createPortal(
              <div
                ref={dropdownRef}
                className="fixed bg-white border rounded-xl shadow-lg z-[99999]"
                style={{
                  top: dropdownPos.top,
                  left: dropdownPos.left,
                  width: "9rem",
                }}
              >
                <button
                  onClick={() => {
                    handleEditClick(row._id);
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
                  className="flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-red-600 w-full"
                >
                  <FiTrash2 /> Delete
                </button>
              </div>,
              document.body,
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
        <h2 className="text-xl font-medium text-gray-800">
          Subscription Plans
        </h2>
        <button
          onClick={() => {
            cacheModuleState(MODULE_KEY);
            navigate(`/${role}/subscriptionplan/create`);
          }}
          className="bg-[#043f79] text-white px-3 py-2 rounded-md shadow-md flex items-center gap-2"
        >
          <FiPlus /> Add
        </button>
      </div>

      <DataTable
        columns={columns}
        data={plans}
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

      {deleteModalId &&
        createPortal(
          <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-[99999]">
            <div className="bg-white p-6 rounded-xl w-96">
              <h3 className="text-lg font-semibold">Confirm Delete</h3>
              <p className="my-4 text-gray-600">
                Are you sure you want to delete this plan?
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
