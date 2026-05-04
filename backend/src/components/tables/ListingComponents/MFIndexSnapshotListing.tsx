import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DataTable, TableColumn } from "../../PagesComponent/DataTable";
import { useCommonCrud } from "../../../hooks/useCommonCrud";
import MFRowActions from "./MFRowActions";
import MFListingHeader from "./MFListingHeader";
import { useDataTableStore } from "../../../store/dataTableStore";
import { axiosInstance } from "../../../api/axios";
import { toast } from "react-hot-toast";
import MFImportExportActions from "./MFImportExportActions";

interface MFIndexSnapshot {
  _id: string;
  benchmark_index_name: string;
  main_category_id?: { name?: string };
  returns?: { y1?: number; y3?: number; y5?: number; y10?: number };
  last_updated_date: string;
  is_active: number;
}

type MfImportEntity =
  | "main-categories"
  | "categories"
  | "amcs"
  | "funds"
  | "nfo"
  | "index-snapshots"
  | "top-holdings"
  | "full-workbook";

type EntityOption = {
  value: MfImportEntity;
  label: string;
};

type ExportMode = "data" | "template";

export default function MFIndexSnapshotListing() {
  const { role = "admin" } = useParams();
  const navigate = useNavigate();

  const MODULE_KEY = `${role}-mf-index-snapshots`;
  const [isMounted, setIsMounted] = useState(false);

  const [selectedEntity, setSelectedEntity] =
    useState<MfImportEntity>("index-snapshots");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (mode: ExportMode) => {
    setIsExporting(true);
    try {
      const response = await axiosInstance.get(`/${role}/mf/export/excel`, {
        params: { entity: selectedEntity, mode },
        responseType: "blob",
      });
      const blob = new Blob([response.data], {
        type:
          response.headers["content-type"] ||
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const disposition = String(response.headers["content-disposition"] || "");
      const filenameMatch = disposition.match(/filename="([^"]+)"/i);
      const filename =
        filenameMatch?.[1] || `mf-${selectedEntity}-${mode}.xlsx`;
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      toast.success(
        mode === "template"
          ? "Template download started."
          : "Data export started.",
      );
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || error?.message || "Export failed",
      );
    } finally {
      setIsExporting(false);
    }
  };

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

  useEffect(() => {
    if (!sortField) {
      setSort("last_updated_date", "desc");
    }
  }, [setSort, sortField]);

  const {
    data,
    extractList,
    isLoading,
    isFetching,
    deleteRecord,
    toggleStatus,
    refetch,
  } = useCommonCrud<MFIndexSnapshot>({
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
  const totalPages = Math.max(
    data?.totalPages ?? Math.ceil(totalRecords / recordsPerPage),
    1,
  );
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteModalId) return;
    await deleteRecord(deleteModalId);
    setDeleteModalId(null);
  };

  const columns: TableColumn<MFIndexSnapshot>[] = useMemo(
    () => [
      {
        key: "index",
        label: "#",
        render: (_, i) => (page - 1) * recordsPerPage + i + 1,
      },
      { key: "benchmark_index_name", label: "Benchmark", sortable: true },
      {
        key: "main_category",
        label: "Main Category",
        render: (r) => r.main_category_id?.name || "-",
      },
      { key: "y1", label: "1Y", render: (r) => (r.returns?.y1 ?? "-") as any },
      { key: "y3", label: "3Y", render: (r) => (r.returns?.y3 ?? "-") as any },
      {
        key: "last_updated_date",
        label: "Last Updated",
        sortable: true,
        render: (r) =>
          new Date(r.last_updated_date).toLocaleDateString("en-GB"),
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
            onDelete={() => setDeleteModalId(row._id)}
          />
        ),
      },
    ],
    [
      page,
      recordsPerPage,
      role,
      cacheModuleState,
      MODULE_KEY,
      markEditNavigation,
      navigate,
      toggleStatus,
    ],
  );

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <MFListingHeader
        title="MF Index Snapshots"
        onAdd={() => {
          cacheModuleState(MODULE_KEY);
          navigate(`/${role}/mf/index-snapshots/create`);
        }}
        selectedEntity={selectedEntity}
        onEntityChange={setSelectedEntity}
        role={role}
        isExporting={isExporting}
        onExport={handleExport}
      />

      <DataTable
        columns={columns}
        data={rows}
        loading={isLoading}
        isFetching={isFetching}
        toolbarActions={
          <MFImportExportActions
            role={role}
            options={[{ value: "index-snapshots", label: "Index Snapshots" }]}
            selectedEntity={selectedEntity}
            onEntityChange={setSelectedEntity}
            onImported={async () => {
              await refetch();
            }}
          />
        }
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

      {deleteModalId && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              Delete Index Snapshot?
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete this index snapshot?
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
