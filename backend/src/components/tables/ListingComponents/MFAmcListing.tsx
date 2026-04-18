import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { DataTable, TableColumn } from "../../PagesComponent/DataTable";
import { useCommonCrud } from "../../../hooks/useCommonCrud";
import MFRowActions from "./MFRowActions";
import MFListingHeader from "./MFListingHeader";
import { useDataTableStore } from "../../../store/dataTableStore";
import { axiosInstance, axiosApi } from "../../../api/axios";
import { toast } from "react-hot-toast";
import MFDeleteImpactModal, {
  MFDeleteImpactSummary,
} from "./MFDeleteImpactModal";
import MFImportExportActions from "./MFImportExportActions";

interface MFAmcRow {
  _id: string;
  name: string;
  is_active: number;
}

type MfImportEntity =
  | "main-categories"
  | "categories"
  | "amcs"
  | "funds"
  | "nfo"
  | "index-snapshots"
  | "full-workbook";

type EntityOption = {
  value: MfImportEntity;
  label: string;
};

type ExportMode = "data" | "template";

export default function MFAmcListing() {
  const { role = "admin" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const MODULE_KEY = `${role}-mf-amcs`;
  const [isMounted, setIsMounted] = useState(false);

  const [selectedEntity, setSelectedEntity] =
    useState<MfImportEntity>("amcs");
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
    markTabSwitch,
    lastAction,
  } = useDataTableStore();

  /* ------------------- Detect tab switching ------------------- */
  useEffect(() => {
    const currentPath = location.pathname;
    const storedPath = sessionStorage.getItem("lastPath");

    if (
      storedPath &&
      !storedPath.includes("/mf/amcs") &&
      currentPath.includes("/mf/amcs")
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

  useEffect(() => {
    if (!sortField) {
      setSort("created_at", "desc");
    }
  }, [setSort, sortField]);

  const { data, extractList, isLoading, deleteRecord, toggleStatus, refetch } =
    useCommonCrud<MFAmcRow>({
      role,
      module: "mf/amcs",
      listKey: "data",
      page,
      limit: recordsPerPage,
      searchValue,
      sortField,
      sortOrder,
      enabled: isMounted,
    });

  const rows = extractList as MFAmcRow[];
  const totalRecords = data?.total ?? 0;
  const totalPages = Math.max(
    data?.totalPages ?? Math.ceil(totalRecords / recordsPerPage),
    1,
  );
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
  const [deleteImpact, setDeleteImpact] =
    useState<MFDeleteImpactSummary | null>(null);
  const [isDeleteImpactLoading, setIsDeleteImpactLoading] = useState(false);

  const openDeleteModal = async (row: MFAmcRow) => {
    setDeleteModalId(row._id);
    setDeleteImpact(null);
    setIsDeleteImpactLoading(true);

    try {
      const response = await axiosApi.getOne<MFDeleteImpactSummary>(
        `/${role}/mf/amcs/delete-impact/${row._id}`,
      );
      setDeleteImpact(response.data ?? null);
    } catch (error) {
      console.error("Failed to load AMC delete impact", error);
      toast.error(
        "Couldn't load related record counts. You can still continue if needed.",
      );
    } finally {
      setIsDeleteImpactLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModalId) return;
    await deleteRecord(deleteModalId);
    setDeleteModalId(null);
    setDeleteImpact(null);
    setIsDeleteImpactLoading(false);
  };

  const columns: TableColumn<MFAmcRow>[] = [
    {
      key: "index",
      label: "#",
      render: (_, i) => (page - 1) * recordsPerPage + i + 1,
    },
    { key: "name", label: "AMC Name", sortable: true },
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
            navigate(`/${role}/mf/amcs/edit/${row._id}`);
          }}
          onDelete={() => void openDeleteModal(row)}
        />
      ),
    },
  ];

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <MFListingHeader
        title="MF AMCs"
        onAdd={() => {
          cacheModuleState(MODULE_KEY);
          navigate(`/${role}/mf/amcs/create`);
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
        toolbarActions={
          <MFImportExportActions
            role={role}
            options={[{ value: "amcs", label: "AMCs" }]}
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
        <MFDeleteImpactModal
          title="Delete AMC?"
          fallbackMessage="Are you sure you want to delete this AMC?"
          impact={deleteImpact}
          loading={isDeleteImpactLoading}
          onClose={() => {
            setDeleteModalId(null);
            setDeleteImpact(null);
            setIsDeleteImpactLoading(false);
          }}
          onConfirm={() => void handleDelete()}
        />
      )}
    </div>
  );
}
