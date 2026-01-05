


// import React from "react";
// import { FiArrowUp, FiArrowDown } from "react-icons/fi";

// export interface TableColumn<T> {
//   key: keyof T | string;
//   label: string;
//   render?: (row: T, index: number) => React.ReactNode;
//   sortable?: boolean;
// }

// interface DataTableProps<T> {
//   columns: TableColumn<T>[];
//   data: T[];
//   loading?: boolean;

//   // Pagination
//   page: number;
//   totalPages: number;
//   totalRecords: number;
//   recordsPerPage: number;
//   onPageChange: (page: number) => void;
//   onRecordsPerPageChange: (value: number) => void;

//   // Search & Sort
//   searchValue?: string;
//   onSearchChange?: (value: string) => void;
//   sortField?: string;
//   sortOrder?: "asc" | "desc";
//   onSortChange?: (field: string, order: "asc" | "desc") => void;
// }

// function DataTableComponent<T = any>({
//   columns,
//   data,
//   loading = false,
//   page,
//   totalPages,
//   totalRecords,
//   recordsPerPage,
//   onPageChange,
//   onRecordsPerPageChange,
//   searchValue = "",
//   onSearchChange,
//   sortField = "",
//   sortOrder = "asc",
//   onSortChange,
// }: DataTableProps<T>) {
//   const startIdx = (page - 1) * recordsPerPage + 1;
//   const endIdx = Math.min(startIdx + data.length - 1, totalRecords);

//   const handleSort = (col: TableColumn<T>) => {
//     if (!col.sortable || !onSortChange) return;
//     const newOrder = sortField === col.key && sortOrder === "asc" ? "desc" : "asc";
//     onSortChange(col.key as string, newOrder);
//   };

//   return (
//     <div className="bg-white p-4 rounded-lg shadow-md w-full">
//       {/* Top Controls */}
//       <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
//         {/* Records Per Page */}
//         <div className="flex items-center gap-2">
//           <label className="text-gray-700">Show</label>
//           <select
//             value={recordsPerPage}
//             onChange={(e) => onRecordsPerPageChange(Number(e.target.value))}
//             className="border border-gray-300 rounded px-2 py-1 text-gray-700"
//           >
//             {[5, 10, 25, 50, 100].map((num) => (
//               <option key={num} value={num}>
//                 {num}
//               </option>
//             ))}
//           </select>
//           <span className="text-gray-700">entries</span>
//         </div>

//         {/* Search */}
//         {onSearchChange && (
//           <div className="flex items-center gap-2 w-full md:w-auto">
//             <label className="text-gray-700 whitespace-nowrap">Search:</label>
//             <input
//               type="text"
//               value={searchValue}
//               onChange={(e) => onSearchChange(e.target.value)}
//               placeholder="Type to search..."
//               className="border border-gray-300 rounded px-3 py-1 text-gray-700 w-full md:w-auto"
//             />
//           </div>
//         )}
//       </div>

//       {/* Table */}
//       <div className="border rounded-md">
//         <table className="min-w-full text-sm text-left border-collapse">
//           <thead className="text-gray-700 border-b bg-gray-100">
//             <tr>
//               {columns.map((col) => {
//                 const isSorted = sortField === col.key;
//                 return (
//                   <th
//                     key={col.key as string}
//                     onClick={() => handleSort(col)}
//                     className={`px-4 py-3 font-medium whitespace-nowrap border-r last:border-r-0
//                       ${col.sortable ? "cursor-pointer hover:bg-gray-200" : "cursor-default"}
//                       ${isSorted ? "bg-gray-200" : ""}`}
//                   >
//                     <div className="flex items-center justify-between">
//                       <span>{col.label}</span>
//                       {col.sortable && (
//                         <span className="flex flex-col ml-2">
//                           <FiArrowUp
//                             className={`text-xs ${
//                               isSorted && sortOrder === "asc" ? "text-blue-500" : "text-gray-400"
//                             }`}
//                           />
//                           <FiArrowDown
//                             className={`text-xs -mt-1 ${
//                               isSorted && sortOrder === "desc" ? "text-blue-500" : "text-gray-400"
//                             }`}
//                           />
//                         </span>
//                       )}
//                     </div>
//                   </th>
//                 );
//               })}
//             </tr>
//           </thead>

//           <tbody>
//             {loading && (
//               <tr>
//                 <td colSpan={columns.length} className="text-center py-6 text-gray-500">
//                   Loading...
//                 </td>
//               </tr>
//             )}
//             {!loading && data.length === 0 && (
//               <tr>
//                 <td colSpan={columns.length} className="text-center py-6 text-gray-500">
//                   No records found
//                 </td>
//               </tr>
//             )}
//             {!loading &&
//               data.map((row, idx) => (
//                 <tr
//                   key={idx}
//                   className={`border-b ${
//                     idx % 2 === 0 ? "bg-white" : "bg-gray-50"
//                   } hover:bg-gray-100 transition`}
//                 >
//                   {columns.map((col) => (
//                     <td
//                       key={col.key as string}
//                       className="px-4 py-2 border-r last:border-r-0 whitespace-nowrap"
//                     >
//                       {col.render ? col.render(row, idx) : (row as any)[col.key]}
//                     </td>
//                   ))}
//                 </tr>
//               ))}
//           </tbody>
//         </table>
//       </div>

//       {/* Pagination */}
//       <div className="flex flex-col md:flex-row justify-between items-center mt-4 text-sm text-gray-700">
//         <p>
//           Showing <strong>{startIdx}</strong> to <strong>{endIdx}</strong> of{" "}
//           <strong>{totalRecords}</strong> entries
//         </p>

//         <div className="flex items-center gap-1 mt-2 md:mt-0 flex-wrap">
//           <button
//             disabled={page === 1}
//             onClick={() => onPageChange(page - 1)}
//             className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-100"
//           >
//             Prev
//           </button>

//           {Array.from({ length: totalPages }).map((_, i) => (
//             <button
//               key={i}
//               onClick={() => onPageChange(i + 1)}
//               className={`px-3 py-1 border rounded min-w-[38px] ${
//                 page === i + 1 ? "bg-blue-500 text-white" : "hover:bg-gray-100"
//               }`}
//             >
//               {i + 1}
//             </button>
//           ))}

//           <button
//             disabled={page === totalPages}
//             onClick={() => onPageChange(page + 1)}
//             className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-100"
//           >
//             Next
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// // Export with memo for performance
// export const DataTable = React.memo(DataTableComponent) as typeof DataTableComponent;



import React from "react";
import { FiArrowUp, FiArrowDown } from "react-icons/fi";

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;

  // Pagination
  page: number;
  totalPages: number;
  totalRecords?: number; // made optional
  recordsPerPage: number;
  onPageChange: (page: number) => void;
  onRecordsPerPageChange: (value: number) => void;

  // Search & Sort
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  sortField?: string;
  sortOrder?: "asc" | "desc";
  onSortChange?: (field: string, order: "asc" | "desc") => void;
}

function DataTableComponent<T = any>({
  columns,
  data,
  loading = false,
  page,
  totalPages,
  totalRecords = 0, // default value
  recordsPerPage,
  onPageChange,
  onRecordsPerPageChange,
  searchValue = "",
  onSearchChange,
  sortField = "",
  sortOrder = "asc",
  onSortChange,
}: DataTableProps<T>) {
  const startIdx = data.length === 0 ? 0 : (page - 1) * recordsPerPage + 1;
  const endIdx = Math.min(startIdx + data.length - 1, totalRecords);

  const handleSort = (col: TableColumn<T>) => {
    if (!col.sortable || !onSortChange) return;
    const newOrder = sortField === col.key && sortOrder === "asc" ? "desc" : "asc";
    onSortChange(col.key as string, newOrder);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md w-full">
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        {/* Records Per Page */}
        <div className="flex items-center gap-2">
          <label className="text-gray-700">Show</label>
          <select
            value={recordsPerPage}
            onChange={(e) => onRecordsPerPageChange(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1 text-gray-700"
          >
            {[5, 10, 25, 50, 100].map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
          <span className="text-gray-700">entries</span>
        </div>

        {/* Search */}
        {onSearchChange && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <label className="text-gray-700 whitespace-nowrap">Search:</label>
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Type to search..."
              className="border border-gray-300 rounded px-3 py-1 text-gray-700 w-full md:w-auto"
            />
          </div>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-md">
        <table className="min-w-full text-sm text-left border-collapse">
          <thead className="text-gray-700 border-b bg-gray-100">
            <tr>
              {columns.map((col) => {
                const isSorted = sortField === col.key;
                return (
                  <th
                    key={col.key as string}
                    onClick={() => handleSort(col)}
                    className={`px-4 py-3 font-medium whitespace-nowrap border-r last:border-r-0
                      ${col.sortable ? "cursor-pointer hover:bg-gray-200" : "cursor-default"}
                      ${isSorted ? "bg-gray-200" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{col.label}</span>
                      {col.sortable && (
                        <span className="flex flex-col ml-2">
                          <FiArrowUp
                            className={`text-xs ${
                              isSorted && sortOrder === "asc" ? "text-blue-500" : "text-gray-400"
                            }`}
                          />
                          <FiArrowDown
                            className={`text-xs  ${
                              isSorted && sortOrder === "desc" ? "text-blue-500" : "text-gray-400"
                            }`}
                          />
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={columns.length} className="text-center py-6 text-gray-500">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && data.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="text-center py-6 text-gray-500">
                  No records found
                </td>
              </tr>
            )}
            {!loading &&
              data.map((row, idx) => (
                <tr
                  key={idx}
                  className={`border-b ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100 transition`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key as string}
                      className="px-4 py-2 border-r last:border-r-0 whitespace-nowrap"
                    >
                      {col.render ? col.render(row, idx) : (row as any)[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col md:flex-row justify-between items-center mt-4 text-sm text-gray-700">
        <p>
          Showing <strong>{startIdx}</strong> to <strong>{endIdx}</strong> of{" "}
          <strong>{totalRecords}</strong> entries
        </p>

        <div className="flex items-center gap-1 mt-2 md:mt-0 flex-wrap">
          <button
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
            className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-100"
          >
            Prev
          </button>

          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => onPageChange(i + 1)}
              className={`px-3 py-1 border rounded min-w-[38px] ${
                page === i + 1 ? "bg-blue-500 text-white" : "hover:bg-gray-100"
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            disabled={page === totalPages}
            onClick={() => onPageChange(page + 1)}
            className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-100"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

// Export with memo for performance
export const DataTable = React.memo(DataTableComponent) as typeof DataTableComponent;
