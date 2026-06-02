import React, { useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { DataTable, TableColumn } from "../../PagesComponent/DataTable";
import { useCommonCrud } from "../../../hooks/useCommonCrud";
import MFRowActions from "./MFRowActions";
import MFListingHeader from "./MFListingHeader";
import { useDataTableStore } from "../../../store/dataTableStore";
import MFImportExportActions, { MfImportEntity } from "./MFImportExportActions";
import { axiosInstance } from "../../../api/axios";
import { toast } from "react-hot-toast";

interface MFBenchmarkRow {
  _id: string;
  name: string;
  is_active: number;
}

export default function MFBenchmarkListing() {
  const { role = "admin" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const MODULE_KEY = `${role}-benchmark-master`;
  const [isMounted, setIsMounted] = React.useState(false);
  const [selectedEntity, setSelectedEntity] = React.useState<MfImportEntity>("benchmarks");
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = async (mode: "data" | "template") => {
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
      const filename = filenameMatch?.[1] || `mf-${selectedEntity}-${mode}.xlsx`;
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      toast.success(mode === "template" ? "Template download started." : "Data export started.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || "Export failed");
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
    markTabSwitch,
    lastAction,
  } = useDataTableStore();

  useEffect(() => {
    const currentPath = location.pathname;
    const storedPath = sessionStorage.getItem("lastPath");
    if (storedPath && !storedPath.includes("/benchmark/master") && currentPath.includes("/benchmark/master")) {
      markTabSwitch();
    }
    sessionStorage.setItem("lastPath", currentPath);
  }, [location.pathname, markTabSwitch]);

  useEffect(() => {
    setCurrentModule(MODULE_KEY);
    if (lastAction === "edit") restoreModuleState(MODULE_KEY);
    else if (lastAction === "tab-switch") setPage(1);
    setIsMounted(true);
    return () => cacheModuleState(MODULE_KEY);
  }, [MODULE_KEY, cacheModuleState, lastAction, restoreModuleState, setCurrentModule, setPage]);

  useEffect(() => {
    if (!sortField) setSort("created_at", "desc");
  }, [setSort, sortField]);

  const { data, extractList, isLoading, deleteRecord, refetch } = useCommonCrud<MFBenchmarkRow>({
    role,
    module: "mf/benchmarks",
    listKey: "data",
    page,
    limit: recordsPerPage,
    searchValue,
    sortField,
    sortOrder,
    enabled: isMounted,
  });

  const rows = extractList as MFBenchmarkRow[];
  const totalRecords = data?.total ?? 0;
  const totalPages = Math.max(data?.totalPages ?? Math.ceil(totalRecords / recordsPerPage), 1);

  const columns: TableColumn<MFBenchmarkRow>[] = [
    { key: "index", label: "#", render: (_, i) => (page - 1) * recordsPerPage + i + 1 },
    { key: "name", label: "Name", sortable: true },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <MFRowActions
          onEdit={() => {
            markEditNavigation();
            cacheModuleState(MODULE_KEY);
            navigate(`/${role}/benchmark/master/edit/${row._id}`);
          }}
          onDelete={() => void deleteRecord(row._id)}
        />
      ),
    },
  ];

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <MFListingHeader
        title="Benchmark Master"
        templateOptions={[
          { value: "benchmarks", label: "Benchmark Master + Returns" },
        ]}
        selectedEntity={selectedEntity}
        onEntityChange={setSelectedEntity}
        role={role}
        isExporting={isExporting}
        onExport={handleExport}
        onAdd={() => {
          cacheModuleState(MODULE_KEY);
          navigate(`/${role}/benchmark/master/create`);
        }}
      />
      <DataTable
        columns={columns}
        data={rows}
        loading={isLoading}
        toolbarActions={
          <MFImportExportActions
            role={role}
            options={[
              { value: "benchmarks", label: "Benchmark Master + Returns" },
            ]}
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
        onSortChange={(field, order) => setSort(field, order)}
      />
    </div>
  );
}
