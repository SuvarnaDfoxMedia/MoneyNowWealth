import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { DataTable, TableColumn } from "../../PagesComponent/DataTable";
import { useCommonCrud } from "../../../hooks/useCommonCrud";
import MFRowActions from "./MFRowActions";
import MFListingHeader from "./MFListingHeader";
import { useDataTableStore } from "../../../store/dataTableStore";

interface MFMainCategory {
  _id: string;
  name: string;
  description?: string;
  sort_order?: number;
  is_active: number;
}

export default function MFMainCategoryListing() {
  const { role = "admin" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const MODULE_KEY = `${role}-mf-main-categories`;
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
      !storedPath.includes("/mf/main-categories") &&
      currentPath.includes("/mf/main-categories")
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
    useCommonCrud<MFMainCategory>({
      role,
      module: "mf/main-categories",
      listKey: "data",
      page,
      limit: recordsPerPage,
      searchValue,
      sortField,
      sortOrder,
      liveIntervalMs: 10000,
      enabled: isMounted,
    });

  const rows = extractList as MFMainCategory[];
  const totalRecords = data?.total ?? 0;
  const totalPages = Math.max(data?.totalPages ?? Math.ceil(totalRecords / recordsPerPage), 1);

  const columns: TableColumn<MFMainCategory>[] = [
    { key: "index", label: "#", render: (_, i) => (page - 1) * recordsPerPage + i + 1 },
    // { key: "code", label: "Code", sortable: true },
    { key: "name", label: "Name", sortable: true },
    // { key: "sort_order", label: "Sort", sortable: true },
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
            navigate(`/${role}/mf/main-categories/edit/${row._id}`);
          }}
          onDelete={async () => {
            if (!window.confirm("Delete this main category?")) return;
            await deleteRecord(row._id);
          }}
        />
      ),
    },
  ];

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <MFListingHeader
        title="MF Main Categories"
        onAdd={() => {
          cacheModuleState(MODULE_KEY);
          navigate(`/${role}/mf/main-categories/create`);
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
        onSortChange={(field, order) => setSort(field, order)}
      />
    </div>
  );
}
