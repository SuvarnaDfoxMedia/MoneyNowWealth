// import React, { useState, useEffect, useRef, useMemo } from "react";
// import { useLocation } from "react-router-dom";
// import { toast } from "react-hot-toast";
// import {
//   FiTrash2,
//   FiMoreVertical,
//   FiClock,
//   FiRefreshCw,
//   FiCheckCircle,
//   FiMail,
//   FiPhone,
//   FiMapPin,
//   FiEdit2,
// } from "react-icons/fi";
// import { createPortal } from "react-dom";
// import { DataTable, TableColumn } from "../../PagesComponent/DataTable";
// import { useCommonCrud } from "../../../hooks/useCommonCrud";
// import { useDataTableStore } from "../../../store/dataTableStore";
// import { axiosApi } from "../../../api/axios";
// import Badge from "../../ui/badge/Badge";

// type EnquiryStatus = "new" | "in-progress" | "resolved";

// interface PartnershipEnquiry {
//   _id: string;
//   full_name: string;
//   email: string;
//   mobile: string;
//   country_code?: string;
//   city: string;
//   organisation_name?: string;
//   current_status: string;
//   arn_number?: string;
//   terms_accepted?: boolean;
//   status: EnquiryStatus;
//   is_active: number;
//   created_at: string;
//   updated_at?: string;
// }

// const formatDate = (value?: string) => {
//   if (!value) return "N/A";

//   const date = new Date(value);
//   return Number.isNaN(date.getTime())
//     ? "N/A"
//     : date.toLocaleString("en-GB");
// };

// const formatStatus = (value?: string) => {
//   if (!value) return "N/A";

//   return value
//     .split("-")
//     .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
//     .join(" ");
// };

// const getStatusBadgeColor = (status: EnquiryStatus) => {
//   if (status === "resolved") return "success";
//   if (status === "in-progress") return "warning";
//   return "primary";
// };

// const getPartnerTypeLabel = (value?: string) => {
//   const normalizedValue = value?.trim().toLowerCase() || "";

//   if (normalizedValue.includes("ifa") || normalizedValue.includes("arn holder")) {
//     return "IFA / ARN Holder";
//   }

//   if (normalizedValue.includes("wealth firm")) {
//     return "Wealth Firm";
//   }

//   if (normalizedValue.includes("planning")) {
//     return "Prospective Distributor";
//   }

//   return value || "N/A";
// };

// export default function PartnershipEnquiryListing() {
//   const location = useLocation();

//   const MODULE_KEY = "admin-partnership-enquiries";
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
//     markTabSwitch,
//     lastAction,
//   } = useDataTableStore();

//   useEffect(() => {
//     const currentPath = location.pathname;
//     const storedPath = sessionStorage.getItem("lastPath");

//     if (
//       storedPath &&
//       !storedPath.includes("/partnershipenquiry") &&
//       currentPath.includes("/partnershipenquiry")
//     ) {
//       markTabSwitch();
//     }

//     sessionStorage.setItem("lastPath", currentPath);
//   }, [location.pathname, markTabSwitch]);

//   useEffect(() => {
//     setCurrentModule(MODULE_KEY);

//     if (lastAction === "edit") {
//       restoreModuleState(MODULE_KEY);
//     } else if (lastAction === "tab-switch") {
//       setPage(1);
//     }

//     setIsMounted(true);

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

//   useEffect(() => {
//     const handleNavClick = () => {
//       setTimeout(() => {
//         const currentPath = window.location.pathname;
//         if (!currentPath.includes("/partnershipenquiry")) {
//           markTabSwitch();
//         }
//       }, 100);
//     };

//     document.addEventListener("click", handleNavClick);
//     return () => document.removeEventListener("click", handleNavClick);
//   }, [markTabSwitch]);

//   const { data, extractList, isLoading, refetch, deleteRecord } = useCommonCrud<PartnershipEnquiry>({
//     module: "partner-enquiries",
//     role: "admin",
//     page,
//     limit: recordsPerPage,
//     searchValue,
//     sortField,
//     sortOrder,
//     enabled: isMounted,
//   });

//   const [enquiries, setEnquiries] = useState<PartnershipEnquiry[]>([]);

//   const totalRecords = data?.total || 0;
//   const totalPages = Math.max(Math.ceil(totalRecords / recordsPerPage), 1);

//   useEffect(() => {
//     if (Array.isArray(data?.enquiries)) {
//       setEnquiries(data.enquiries);
//       return;
//     }

//     setEnquiries(Array.isArray(extractList) ? extractList : []);
//   }, [data, extractList]);

//   useEffect(() => {
//     if (!isMounted) return;

//     const timer = setTimeout(() => refetch(), 300);
//     return () => clearTimeout(timer);
//   }, [searchValue, sortField, sortOrder, page, recordsPerPage, isMounted]);

//   const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
//   const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
//   const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
//   const [editModalRow, setEditModalRow] = useState<PartnershipEnquiry | null>(null);
//   const [editStatus, setEditStatus] = useState<EnquiryStatus>("new");
//   const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
//   const dropdownRef = useRef<HTMLDivElement | null>(null);

//   const handleDropdownClick = (e: React.MouseEvent, id: string) => {
//     e.stopPropagation();
//     const rect = e.currentTarget.getBoundingClientRect();
//     setDropdownPos({
//       top: rect.bottom + 6,
//       left: rect.left - 80,
//     });
//     setOpenDropdownId(openDropdownId === id ? null : id);
//   };

//   useEffect(() => {
//     const handleOutside = (event: MouseEvent) => {
//       if (!dropdownRef.current?.contains(event.target as Node)) {
//         setOpenDropdownId(null);
//       }
//     };

//     window.addEventListener("click", handleOutside);
//     return () => window.removeEventListener("click", handleOutside);
//   }, []);

//   const handleDelete = async () => {
//     if (!deleteModalId) return;

//     try {
//       const res = await deleteRecord(deleteModalId);
//       if (res?.success) {
//         toast.success("Partnership enquiry deleted successfully");
//         setEnquiries((prev) => prev.filter((entry) => entry._id !== deleteModalId));
//       } else {
//         toast.error(res?.message || "Failed to delete partnership enquiry");
//       }
//     } catch {
//       toast.error("Error deleting partnership enquiry");
//     } finally {
//       setDeleteModalId(null);
//       setOpenDropdownId(null);
//       refetch();
//     }
//   };

//   const handleStatusUpdate = async (
//     id: string,
//     nextStatus: EnquiryStatus,
//   ) => {
//     try {
//       setUpdatingStatusId(id);

//       const res = await axiosApi.patch(`/admin/partner-enquiries/status/${id}`, {
//         status: nextStatus,
//       });

//       if (res?.success) {
//         setEnquiries((prev) =>
//           prev.map((entry) =>
//             entry._id === id ? { ...entry, status: nextStatus } : entry,
//           ),
//         );
//         toast.success(res.message || "Enquiry status updated successfully");
//       } else {
//         toast.error(res?.message || "Failed to update enquiry status");
//       }
//     } catch {
//       toast.error("Error updating enquiry status");
//     } finally {
//       setUpdatingStatusId(null);
//     }
//   };

//   const handleOpenEditModal = (row: PartnershipEnquiry) => {
//     setEditModalRow(row);
//     setEditStatus(row.status);
//     setOpenDropdownId(null);
//   };

//   const handleSaveStatus = async () => {
//     if (!editModalRow) return;
//     await handleStatusUpdate(editModalRow._id, editStatus);
//     setEditModalRow((prev) =>
//       prev ? { ...prev, status: editStatus } : null,
//     );
//     setTimeout(() => {
//       setEditModalRow(null);
//     }, 0);
//   };

//   const stats = useMemo(() => {
//     const newCount = enquiries.filter((item) => item.status === "new").length;
//     const inProgressCount = enquiries.filter(
//       (item) => item.status === "in-progress",
//     ).length;
//     const resolvedCount = enquiries.filter(
//       (item) => item.status === "resolved",
//     ).length;

//     return [
//       {
//         label: "New Leads",
//         value: newCount,
//         icon: <FiClock className="text-brand-500" />,
//         tone: "bg-brand-50 border-brand-100",
//       },
//       {
//         label: "In Progress",
//         value: inProgressCount,
//         icon: <FiRefreshCw className="text-warning-600" />,
//         tone: "bg-warning-50 border-warning-100",
//       },
//       {
//         label: "Resolved",
//         value: resolvedCount,
//         icon: <FiCheckCircle className="text-success-600" />,
//         tone: "bg-success-50 border-success-100",
//       },
//       {
//         label: "Visible On Page",
//         value: totalRecords,
//         icon: <FiMail className="text-blue-light-500" />,
//         tone: "bg-blue-light-50 border-blue-light-100",
//       },
//     ];
//   }, [enquiries, totalRecords]);

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
//         ref={dropdownRef}
//         className="fixed z-[99999] rounded-xl border border-gray-200 bg-white p-1 shadow-lg"
//         style={{ top, left, width: "8rem" }}
//         onClick={(e) => e.stopPropagation()}
//       >
//         <button
//           onClick={() => {
//             const row = enquiries.find((entry) => entry._id === id);
//             if (row) handleOpenEditModal(row);
//           }}
//           className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-left text-gray-700 transition hover:bg-gray-100"
//         >
//           <FiEdit2 /> Edit
//         </button>
//         <button
//           onClick={() => {
//             setDeleteModalId(id);
//             setOpenDropdownId(null);
//           }}
//           className="flex w-full items-center gap-2 px-4 py-2 text-left text-red-600 transition hover:bg-red-50"
//         >
//           <FiTrash2 /> Delete
//         </button>
//       </div>,
//       document.body,
//     );

//   const columns: TableColumn<PartnershipEnquiry>[] = [
//     {
//       key: "index",
//       label: "#",
//       render: (_row, idx) => (page - 1) * recordsPerPage + idx + 1,
//     },
//     {
//       key: "full_name",
//       label: "Lead",
//       sortable: true,
//       render: (row) => (
//         <div className="min-w-[180px]">
//           <div className="font-medium text-gray-900">{row.full_name || "N/A"}</div>
//           <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
//             <FiMapPin size={12} />
//             <span>{row.city || "City not shared"}</span>
//           </div>
//         </div>
//       ),
//     },
//     {
//       key: "email",
//       label: "Contact",
//       sortable: true,
//       render: (row) => (
//         <div className="min-w-[220px]">
//           <div className="flex items-center gap-2 text-sm text-gray-700">
//             <FiMail size={14} className="text-gray-400" />
//             <span className="truncate">{row.email || "N/A"}</span>
//           </div>
//           <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
//             <FiPhone size={14} className="text-gray-400" />
//             <span>
//               {`${row.country_code ? `${row.country_code} ` : ""}${row.mobile}`.trim() ||
//                 "N/A"}
//             </span>
//           </div>
//         </div>
//       ),
//     },
//     {
//       key: "organisation_name",
//       label: "Business",
//       sortable: true,
//       render: (row) => (
//         <div className="min-w-[180px]">
//           <div className="font-medium text-gray-800">
//             {row.organisation_name || "Independent / Not specified"}
//           </div>
//           <div className="mt-1 text-xs text-gray-500">
//             ARN: {row.arn_number || "Not shared"}
//           </div>
//         </div>
//       ),
//     },
//     {
//       key: "current_status",
//       label: "Partner Profile",
//       sortable: true,
//       render: (row) => (
//         <div className="min-w-[200px]">
//           <Badge
//             size="sm"
//             color={
//               row.current_status.toLowerCase().includes("planning")
//                 ? "warning"
//                 : row.current_status.toLowerCase().includes("wealth firm")
//                   ? "success"
//                   : "info"
//             }
//           >
//             {getPartnerTypeLabel(row.current_status)}
//           </Badge>
//           <div className="mt-2 text-xs leading-5 text-gray-500">
//             {row.current_status || "N/A"}
//           </div>
//         </div>
//       ),
//     },
//     {
//       key: "status",
//       label: "Enquiry Status",
//       sortable: true,
//       render: (row) => (
//         <div className="min-w-[140px]">
//           <Badge size="sm" color={getStatusBadgeColor(row.status)}>
//             {formatStatus(row.status)}
//           </Badge>
//           <div className="mt-2 text-xs text-gray-500">
//             Update from Actions
//           </div>
//         </div>
//       ),
//     },
//     {
//       key: "created_at",
//       label: "Timeline",
//       sortable: true,
//       render: (row) => (
//         <div className="min-w-[160px]">
//           <div className="font-medium text-gray-800">
//             {formatDate(row.created_at)}
//           </div>
//           <div className="mt-1 text-xs text-gray-500">
//             Updated: {formatDate(row.updated_at)}
//           </div>
//         </div>
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
//             className="rounded-full p-2 hover:bg-gray-100"
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

//   if (!isMounted) {
//     return (
//       <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
//         <div className="text-gray-500">Loading...</div>
//       </div>
//     );
//   }

//   return (
//     <div className="relative min-h-screen bg-gray-50 p-4">
//       <h2 className="mb-6 text-xl font-medium text-gray-800">
//         Partnership Enquiries
//       </h2>

//       <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
//         {stats.map((item) => (
//           <div
//             key={item.label}
//             className={`rounded-2xl border p-4 shadow-sm ${item.tone}`}
//           >
//             <div className="flex items-start justify-between">
//               <div>
//                 <p className="text-sm font-medium text-gray-600">{item.label}</p>
//                 <p className="mt-2 text-2xl font-semibold text-gray-900">
//                   {item.value}
//                 </p>
//               </div>
//               <div className="rounded-xl bg-white/80 p-2 shadow-sm">
//                 {item.icon}
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       <DataTable
//         columns={columns}
//         data={enquiries}
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

//       {deleteModalId &&
//         createPortal(
//           <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 px-4">
//             <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
//               <h3 className="text-lg font-semibold text-gray-900">
//                 Confirm Delete
//               </h3>
//               <p className="mt-2 text-sm text-gray-600">
//                 Are you sure you want to delete this partnership enquiry?
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

//       {editModalRow &&
//         createPortal(
//           <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 px-4">
//             <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
//               <h3 className="text-lg font-semibold text-gray-900">
//                 Edit Partnership Enquiry
//               </h3>
//               <p className="mt-1 text-sm text-gray-500">
//                 Update the handling status for this lead without changing the table layout.
//               </p>

//               <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50 p-4">
//                 <div className="font-medium text-gray-900">{editModalRow.full_name}</div>
//                 <div className="mt-1 text-sm text-gray-600">{editModalRow.email}</div>
//                 <div className="mt-1 text-sm text-gray-500">
//                   {editModalRow.organisation_name || "Independent / Not specified"}
//                 </div>
//               </div>

//               <div className="mt-5">
//                 <label className="mb-2 block text-sm font-medium text-gray-700">
//                   Enquiry Status
//                 </label>
//                 <select
//                   value={editStatus}
//                   onChange={(e) => setEditStatus(e.target.value as EnquiryStatus)}
//                   disabled={updatingStatusId === editModalRow._id}
//                   className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-[#043f79] focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100"
//                 >
//                   <option value="new">New</option>
//                   <option value="in-progress">In Progress</option>
//                   <option value="resolved">Resolved</option>
//                 </select>
//               </div>

//               <div className="mt-6 flex justify-end gap-3">
//                 <button
//                   onClick={() => setEditModalRow(null)}
//                   className="h-10 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleSaveStatus}
//                   disabled={updatingStatusId === editModalRow._id}
//                   className="h-10 rounded-lg bg-[#043f79] px-4 text-sm font-medium text-white transition hover:bg-[#032f5a] disabled:cursor-not-allowed disabled:opacity-60"
//                 >
//                   {updatingStatusId === editModalRow._id ? "Saving..." : "Save Changes"}
//                 </button>
//               </div>
//             </div>
//           </div>,
//           document.body,
//         )}
//     </div>
//   );
// }

import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FiTrash2, FiMoreVertical } from "react-icons/fi";
import { createPortal } from "react-dom";
import { DataTable, TableColumn } from "../../PagesComponent/DataTable";
import { useCommonCrud } from "../../../hooks/useCommonCrud";
import { useEnquiryUnread } from "../../../hooks/useEnquiryUnread";
import { useDataTableStore } from "../../../store/dataTableStore";

interface PartnershipEnquiry {
  _id: string;
  full_name: string;
  email: string;
  mobile: string;
  country_code?: string;
  city: string;
  organisation_name?: string;
  current_status: string;
  arn_number?: string;
  terms_accepted?: boolean;
  status: string;
  is_active: number;
  created_at: string;
  updated_at?: string;
}

const formatDate = (value?: string) => {
  if (!value) return "N/A";

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleString("en-GB");
};

const formatStatus = (value?: string) => {
  if (!value) return "N/A";

  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

export default function PartnershipEnquiryListing() {
  const location = useLocation();

  const MODULE_KEY = "admin-partnership-enquiries";
  const [isMounted, setIsMounted] = useState(false);
  const { markModulesAsRead } = useEnquiryUnread();

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
    markTabSwitch,
    lastAction,
  } = useDataTableStore();

  useEffect(() => {
    const currentPath = location.pathname;
    const storedPath = sessionStorage.getItem("lastPath");

    if (
      storedPath &&
      !storedPath.includes("/partnershipenquiry") &&
      currentPath.includes("/partnershipenquiry")
    ) {
      markTabSwitch();
    }

    sessionStorage.setItem("lastPath", currentPath);
  }, [location.pathname, markTabSwitch]);

  useEffect(() => {
    setCurrentModule(MODULE_KEY);

    if (lastAction === "edit") {
      restoreModuleState(MODULE_KEY);
    } else if (lastAction === "tab-switch") {
      setPage(1);
    }

    setIsMounted(true);

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
    void markModulesAsRead(["partner-enquiries"]);
  }, [isMounted, markModulesAsRead]);

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

  useEffect(() => {
    const handleNavClick = () => {
      setTimeout(() => {
        const currentPath = window.location.pathname;
        if (!currentPath.includes("/partnershipenquiry")) {
          markTabSwitch();
        }
      }, 100);
    };

    document.addEventListener("click", handleNavClick);
    return () => document.removeEventListener("click", handleNavClick);
  }, [markTabSwitch]);

  const { data, extractList, isLoading, refetch, deleteRecord } =
    useCommonCrud<PartnershipEnquiry>({
      module: "partner-enquiries",
      role: "admin",
      page,
      limit: recordsPerPage,
      searchValue,
      sortField,
      sortOrder,
      enabled: isMounted,
    });

  const [enquiries, setEnquiries] = useState<PartnershipEnquiry[]>([]);

  const totalRecords = data?.total || 0;
  const totalPages = Math.max(Math.ceil(totalRecords / recordsPerPage), 1);

  useEffect(() => {
    if (Array.isArray(data?.enquiries)) {
      setEnquiries(data.enquiries);
      return;
    }

    setEnquiries(Array.isArray(extractList) ? extractList : []);
  }, [data, extractList]);

  useEffect(() => {
    if (!isMounted) return;

    const timer = setTimeout(() => refetch(), 300);
    return () => clearTimeout(timer);
  }, [searchValue, sortField, sortOrder, page, recordsPerPage, isMounted]);

  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const handleDropdownClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + 6,
      left: rect.left - 80,
    });
    setOpenDropdownId(openDropdownId === id ? null : id);
  };

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };

    window.addEventListener("click", handleOutside);
    return () => window.removeEventListener("click", handleOutside);
  }, []);

  const handleDelete = async () => {
    if (!deleteModalId) return;

    try {
      const res = await deleteRecord(deleteModalId);
      if (res?.success) {
        toast.success("Partnership enquiry deleted successfully");
        setEnquiries((prev) =>
          prev.filter((entry) => entry._id !== deleteModalId),
        );
      } else {
        toast.error(res?.message || "Failed to delete partnership enquiry");
      }
    } catch {
      toast.error("Error deleting partnership enquiry");
    } finally {
      setDeleteModalId(null);
      setOpenDropdownId(null);
      refetch();
    }
  };

  const Dropdown = ({
    id,
    top,
    left,
  }: {
    id: string;
    top: number;
    left: number;
  }) =>
    createPortal(
      <div
        ref={dropdownRef}
        className="fixed z-[99999] rounded-xl border border-gray-200 bg-white p-1 shadow-lg"
        style={{ top, left, width: "8rem" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => {
            setDeleteModalId(id);
            setOpenDropdownId(null);
          }}
          className="flex w-full items-center gap-2 px-4 py-2 text-left text-red-600 transition hover:bg-red-50"
        >
          <FiTrash2 /> Delete
        </button>
      </div>,
      document.body,
    );

  const columns: TableColumn<PartnershipEnquiry>[] = [
    {
      key: "index",
      label: "#",
      render: (_row, idx) => (page - 1) * recordsPerPage + idx + 1,
    },
    { key: "full_name", label: "Name", sortable: true },
    { key: "email", label: "Email", sortable: true },
    {
      key: "mobile",
      label: "Mobile",
      render: (row) =>
        `${row.country_code ? `${row.country_code} ` : ""}${row.mobile}`.trim() ||
        "N/A",
    },
    { key: "city", label: "City", sortable: true },
    {
      key: "organisation_name",
      label: "Organisation",
      sortable: true,
      render: (row) => row.organisation_name || "N/A",
    },
    {
      key: "current_status",
      label: "Current Status",
      sortable: true,
    },
    {
      key: "arn_number",
      label: "ARN Number",
      render: (row) => row.arn_number || "N/A",
    },
    // {
    //   key: "status",
    //   label: "Enquiry Status",
    //   sortable: true,
    //   render: (row) => formatStatus(row.status),
    // },
    {
      key: "created_at",
      label: "Date",
      sortable: true,
      render: (row) => formatDate(row.created_at),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => handleDropdownClick(e, row._id)}
            className="rounded-full p-2 hover:bg-gray-100"
          >
            <FiMoreVertical size={18} />
          </button>
          {openDropdownId === row._id && (
            <Dropdown
              id={row._id}
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-50 p-4">
      <h2 className="mb-6 text-xl font-medium text-gray-800">
        Partnership Enquiries
      </h2>

      <DataTable
        columns={columns}
        data={enquiries}
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
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900">
                Confirm Delete
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete this partnership enquiry?
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
    </div>
  );
}
