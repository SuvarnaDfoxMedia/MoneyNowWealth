import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { DataTable, TableColumn } from "../../PagesComponent/DataTable";
import { useCommonCrud } from "../../../hooks/useCommonCrud";
import MFRowActions from "./MFRowActions";
import MFListingHeader from "./MFListingHeader";
import { useDataTableStore } from "../../../store/dataTableStore";

interface MFIndexSnapshot {
  _id: string;
  benchmark_index_name: string;
  main_category_id?: { name?: string };
  returns?: { y1?: number; y3?: number; y5?: number; y10?: number };
  last_updated_date: string;
  is_active: number;
}

export default function MFIndexSnapshotListing() {
  const { role = "admin" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const MODULE_KEY = `${role}-mf-index-snapshots`;
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

  const { data, extractList, isLoading, isFetching, deleteRecord, toggleStatus } =
    useCommonCrud<MFIndexSnapshot>({
      role,
      module: "mf/index-snapshots",
      listKey: "data",
      page,
      limit: recordsPerPage,
      searchValue,
      sortField,
      sortOrder,
      enabled: isMounted,
    });

  const rows = extractList as MFIndexSnapshot[];
  const totalRecords = data?.total ?? 0;
  const totalPages = Math.max(data?.totalPages ?? Math.ceil(totalRecords / recordsPerPage), 1);

  const columns: TableColumn<MFIndexSnapshot>[] = useMemo(() => [
    { key: "index", label: "#", render: (_, i) => (page - 1) * recordsPerPage + i + 1 },
    { key: "benchmark_index_name", label: "Benchmark", sortable: true },
    { key: "main_category", label: "Main Category", render: (r) => r.main_category_id?.name || "-" },
    { key: "y1", label: "1Y", render: (r) => (r.returns?.y1 ?? "-") as any },
    { key: "y3", label: "3Y", render: (r) => (r.returns?.y3 ?? "-") as any },
    {
      key: "last_updated_date",
      label: "Last Updated",
      sortable: true,
      render: (r) => new Date(r.last_updated_date).toLocaleDateString("en-GB"),
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
            navigate(`/${role}/mf/index-snapshots/edit/${row._id}`);
          }}
          deleteLabel="Delete"
          onDelete={async () => {
            if (!window.confirm("Delete this index snapshot?")) return;
            await deleteRecord(row._id);
          }}
        />
      ),
    },
  ], [page, recordsPerPage, role, cacheModuleState, MODULE_KEY, deleteRecord, markEditNavigation, navigate, toggleStatus]);

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <MFListingHeader
        title="MF Index Snapshots"
        onAdd={() => {
          cacheModuleState(MODULE_KEY);
          navigate(`/${role}/mf/index-snapshots/create`);
        }}
      />

      <DataTable
        columns={columns}
        data={rows}
        loading={isLoading}
        isFetching={isFetching}
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

