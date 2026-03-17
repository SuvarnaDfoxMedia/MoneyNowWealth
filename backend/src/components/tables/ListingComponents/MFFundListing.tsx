import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { DataTable, TableColumn } from "../../PagesComponent/DataTable";
import { useCommonCrud } from "../../../hooks/useCommonCrud";
import MFRowActions from "./MFRowActions";
import MFListingHeader from "./MFListingHeader";
import { useDataTableStore } from "../../../store/dataTableStore";

interface MFFund {
  _id: string;
  fund_name: string;
  amc_id?: { name?: string };
  category_id?: { name?: string };
  expense_ratio?: number;
  returns?: { y1?: number; y3_cagr?: number };
  is_featured?: boolean;
  is_popular?: boolean;
  is_active: number;
}

export default function MFFundListing() {
  const { role = "admin" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const MODULE_KEY = `${role}-mf-funds`;
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
      !storedPath.includes("/mf/funds") &&
      currentPath.includes("/mf/funds")
    ) {
      markTabSwitch();
    }

    sessionStorage.setItem("lastPath", currentPath);
  }, [location.pathname, markTabSwitch]);

  /* ------------------- Initialize module state ------------------- */
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

  const { data, extractList, isLoading, deleteRecord, toggleStatus } =
    useCommonCrud<MFFund>({
      role,
      module: "mf/funds",
      listKey: "data",
      page,
      limit: recordsPerPage,
      searchValue,
      sortField,
      sortOrder,
      liveIntervalMs: 10000,
      enabled: isMounted,
    });

  const rows = extractList as MFFund[];
  const totalRecords = data?.total ?? 0;
  const totalPages = Math.max(data?.totalPages ?? Math.ceil(totalRecords / recordsPerPage), 1);

  const columns: TableColumn<MFFund>[] = [
    { key: "index", label: "#", render: (_, i) => (page - 1) * recordsPerPage + i + 1 },
    { key: "fund_name", label: "Fund Name", sortable: true },
    { key: "amc", label: "AMC", render: (r) => r.amc_id?.name || "-" },
    { key: "category", label: "Category", render: (r) => r.category_id?.name || "-" },
    { key: "y1", label: "1Y", render: (r) => (r.returns?.y1 ?? "-") as any },
    {
      key: "is_featured",
      label: "Featured",
      render: (r) => (
        <span className={`px-2 py-1 rounded text-xs ${r.is_featured ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
          {r.is_featured ? "Yes" : "No"}
        </span>
      ),
    },
    {
      key: "is_popular",
      label: "Popular",
      render: (r) => (
        <span className={`px-2 py-1 rounded text-xs ${r.is_popular ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}`}>
          {r.is_popular ? "Yes" : "No"}
        </span>
      ),
    },
    {
      key: "is_active",
      label: "Status",
      render: (row) => (
        <button
          onClick={() => toggleStatus(row._id, row.is_active !== 1)}
          className={`px-4 py-1 min-w-[90px] rounded-sm text-white text-sm font-medium ${row.is_active === 1 ? "bg-green-600" : "bg-gray-500"}`}
        >
          {row.is_active === 1 ? "Active" : "Inactive"}
        </button>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <MFRowActions
          onEdit={() => {
            markEditNavigation();
            cacheModuleState(MODULE_KEY);
            navigate(`/${role}/mf/funds/edit/${row._id}`);
          }}
          onDelete={async () => {
            if (!window.confirm("Delete this fund?")) return;
            await deleteRecord(row._id);
          }}
        />
      ),
    },
  ];

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <MFListingHeader
        title="MF Funds"
        onAdd={() => {
          cacheModuleState(MODULE_KEY);
          navigate(`/${role}/mf/funds/create`);
        }}
      />

      <DataTable
        columns={columns}
        data={rows}
        loading={isLoading}
        page={page}
        totalPages={totalPages}
        totalRecords={totalRecords}
        recordsPerPage={recordsPerPage}
        onPageChange={(value) => setPage(value)}
        onRecordsPerPageChange={(value) => setRecordsPerPage(value)}
        searchValue={searchValue}
        onSearchChange={(value) => setSearchValue(value)}
        sortField={sortField}
        sortOrder={sortOrder}
        onSortChange={(field, order) => {
          setSort(field, order);
        }}
      />
    </div>
  );
}
