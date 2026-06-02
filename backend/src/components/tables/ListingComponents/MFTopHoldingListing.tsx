import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DataTable, TableColumn } from "../../PagesComponent/DataTable";
import { useCommonCrud } from "../../../hooks/useCommonCrud";
import MFImportExportActions from "./MFImportExportActions";
import MFListingHeader from "./MFListingHeader";
import { axiosInstance } from "../../../api/axios";
import { toast } from "react-hot-toast";
import MFRowActions from "./MFRowActions";

interface MFTopHoldingRow {
  _id: string;
  scheme_identity: string;
  fund_name: string;
  scheme_code?: string;
  source_standard_name?: string;
  source_isin?: string;
  portfolio_date?: string;
  uploaded_at?: string;
  holdings_count?: number;
  stock_holdings?: number;
  bond_holdings?: number;
  top_holdings_summary?: string[];
  assets_top_10_holdings_pct?: number;
  is_active: number;
}

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString("en-GB") : "-";

export default function MFTopHoldingListing() {
  const { role = "admin" } = useParams();
  const navigate = useNavigate();
  const [selectedEntity, setSelectedEntity] = useState<"top-holdings">("top-holdings");
  const [isExporting, setIsExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [searchValue, setSearchValue] = useState("");
  const [sortField, setSortField] = useState("portfolio_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [activeFilter, setActiveFilter] = useState<"all" | "1" | "0">("1");
  const [togglingId, setTogglingId] = useState("");
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);

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

  const handleDelete = async () => {
    if (!deleteModalId) return;
    try {
      const response = await axiosInstance.delete(
        `/${role}/mf/top-holdings/delete/${deleteModalId}`,
      );
      toast.success(response.data?.message || "Top holding scheme marked inactive");
      setDeleteModalId(null);
      await refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete top holding");
    }
  };

  const { data, extractList, isLoading, refetch } = useCommonCrud<MFTopHoldingRow>({
    role,
    module: "mf/top-holdings",
    listKey: "data",
    page,
    limit: recordsPerPage,
    searchValue,
    sortField,
    sortOrder,
    enabled: true,
    extraParams: {
      is_active: activeFilter === "all" ? undefined : Number(activeFilter),
    },
  });

  const rows = extractList as MFTopHoldingRow[];
  const totalRecords = data?.total ?? 0;
  const totalPages = Math.max(data?.totalPages ?? Math.ceil(totalRecords / recordsPerPage), 1);

  const toggleSchemeStatus = async (schemeIdentity: string) => {
    setTogglingId(schemeIdentity);
    try {
      const response = await axiosInstance.patch(
        `/${role}/mf/top-holdings/toggle-status/${encodeURIComponent(schemeIdentity)}`,
      );
      toast.success(response.data?.message || "Status updated");
      await refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update status");
    } finally {
      setTogglingId("");
    }
  };

  const columns: TableColumn<MFTopHoldingRow>[] = [
    {
      key: "index",
      label: "#",
      render: (_, i) => (page - 1) * recordsPerPage + i + 1,
    },
    { key: "fund_name", label: "Fund Name", sortable: true },
    { key: "scheme_code", label: "Scheme Code", sortable: true },
    { key: "stock_holdings", label: "Stock Holdings", render: (row) => row.stock_holdings ?? 0 },
    { key: "bond_holdings", label: "Bond Holdings", render: (row) => row.bond_holdings ?? 0 },
    {
      key: "summary",
      label: "Top Holdings",
      render: (row) =>
        Array.isArray(row.top_holdings_summary) && row.top_holdings_summary.length > 0
          ? row.top_holdings_summary.slice(0, 3).join(", ")
          : "-",
    },
    {
      key: "portfolio_date",
      label: "Portfolio Date",
      sortable: true,
      render: (row) => formatDate(row.portfolio_date),
    },
    {
      key: "uploaded_at",
      label: "Uploaded",
      sortable: true,
      render: (row) => formatDate(row.uploaded_at),
    },
    {
      key: "is_active",
      label: "Status",
      render: (row) => (
        <button
          type="button"
          disabled={togglingId === row.scheme_identity}
          onClick={() => void toggleSchemeStatus(row.scheme_identity)}
          className={`min-w-[90px] rounded-sm px-4 py-1 text-sm font-medium text-white disabled:opacity-60 ${
            row.is_active === 1 ? "bg-green-600" : "bg-gray-500"
          }`}
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
          onView={() => navigate(`/${role}/mf/top-holdings/view/${row._id}`)}
          onHistory={() =>
            navigate(`/${role}/mf/top-holdings/history/${encodeURIComponent(row.scheme_identity)}`)
          }
          onEdit={() => navigate(`/${role}/mf/top-holdings/edit/${row._id}`)}
          onDelete={() => setDeleteModalId(row._id)}
        />
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <MFListingHeader
        title="MF Top Holdings"
        onAdd={() => navigate(`/${role}/mf/top-holdings/create`)}
        selectedEntity={selectedEntity}
        onEntityChange={(entity) => setSelectedEntity(entity as "top-holdings")}
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
            options={[{ value: "top-holdings", label: "Top Holdings" }]}
            selectedEntity={selectedEntity}
            onEntityChange={(entity) => setSelectedEntity(entity as "top-holdings")}
            onImported={async () => {
              await refetch();
            }}
            trailingActions={
              <label className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700">
                <span className="whitespace-nowrap">Status:</span>
                <select
                  value={activeFilter}
                  onChange={(event) => {
                    setActiveFilter(event.target.value as "all" | "1" | "0");
                    setPage(1);
                  }}
                  className="h-8 rounded-md border-0 bg-transparent text-sm text-gray-700 focus:outline-none"
                >
                  <option value="all">All</option>
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
              </label>
            }
          />
        }
        page={page}
        totalPages={totalPages}
        totalRecords={totalRecords}
        recordsPerPage={recordsPerPage}
        onPageChange={setPage}
        onRecordsPerPageChange={(value) => {
          setRecordsPerPage(value);
          setPage(1);
        }}
        searchValue={searchValue}
        onSearchChange={(value) => {
          setSearchValue(value);
          setPage(1);
        }}
        sortField={sortField}
        sortOrder={sortOrder}
        onSortChange={(field, order) => {
          setSortField(field);
          setSortOrder(order);
        }}
      />

      {deleteModalId && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              Mark Scheme Inactive?
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              This keeps all historical snapshots intact and removes the scheme
              from the default active listing.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteModalId(null)}
                className="h-10 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleDelete()}
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
