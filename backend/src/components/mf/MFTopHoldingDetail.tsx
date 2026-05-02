import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { axiosApi, axiosInstance } from "../../api/axios";
import { MFFormContainer, MFFormHeader } from "./MFFormShared";
import { DataTable, type TableColumn } from "../PagesComponent/DataTable";
import MFRowActions from "../tables/ListingComponents/MFRowActions";

type HoldingEntry = {
  __index?: number;
  name?: string;
  net_assets_pct?: number | null;
  market_value?: number | null;
  share_amount?: number | null;
  share_change?: number | null;
  security_type?: string;
  sector?: string;
  maturity?: string;
  credit_quality_india?: string;
  country?: string;
};

type TopHoldingDetail = {
  _id: string;
  fund_name: string;
  scheme_code?: string;
  source_isin?: string;
  portfolio_date?: string;
  uploaded_at?: string;
  holdings?: HoldingEntry[];
  top_holdings_summary?: string[];
  holdings_count?: number;
  is_active?: number;
};

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString("en-GB") : "-";

const formatValue = (value: unknown) =>
  value === null || value === undefined || value === "" ? "-" : String(value);

export default function MFTopHoldingDetail() {
  const { id = "", role = "admin" } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState<TopHoldingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const response = await axiosApi.getOne<TopHoldingDetail>(
          `/${role}/mf/top-holdings/${id}`,
        );
        setRecord((response.data || null) as TopHoldingDetail | null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, role]);

  const holdings = record?.holdings || [];
  const totalPages = Math.max(Math.ceil(holdings.length / recordsPerPage), 1);
  const pageStart = (page - 1) * recordsPerPage;
  const paginatedHoldings = holdings
    .slice(pageStart, page * recordsPerPage)
    .map((holding, index) => ({ ...holding, __index: pageStart + index }));

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      const response = await axiosInstance.delete(
        `/${role}/mf/top-holdings/delete/${id}`,
      );
      toast.success(
        response.data?.message || "Top holding scheme marked inactive",
      );
      navigate(`/${role}/mf/top-holdings`);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to delete top holding",
      );
    } finally {
      setDeleting(false);
    }
  };

  const columns: TableColumn<HoldingEntry>[] = [
    { key: "name", label: "Holding", render: (row) => formatValue(row.name) },
    {
      key: "net_assets_pct",
      label: "Net Assets %",
      render: (row) => formatValue(row.net_assets_pct),
    },
    {
      key: "market_value",
      label: "Market Value",
      render: (row) => formatValue(row.market_value),
    },
    {
      key: "share_amount",
      label: "Share Amount",
      render: (row) => formatValue(row.share_amount),
    },
    {
      key: "share_change",
      label: "Share Change",
      render: (row) => formatValue(row.share_change),
    },
    {
      key: "security_type",
      label: "Security Type",
      render: (row) => formatValue(row.security_type),
    },
    {
      key: "sector",
      label: "Sector",
      render: (row) => formatValue(row.sector),
    },
    {
      key: "maturity",
      label: "Maturity",
      render: (row) => formatValue(row.maturity),
    },
    {
      key: "credit_quality_india",
      label: "Credit Quality",
      render: (row) => formatValue(row.credit_quality_india),
    },
    {
      key: "country",
      label: "Country",
      render: (row) => formatValue(row.country),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <MFRowActions
          // onEdit={() =>
          //   navigate(
          //     `/${role}/mf/top-holdings/edit/${id}?focusHolding=${row.__index ?? 0}`,
          //   )
          // }
          onDelete={() => setDeleteOpen(true)}
        />
      ),
    },
  ];

  return (
    <MFFormContainer>
      <MFFormHeader
        title="MF Top Holding Details"
        onBack={() => navigate(`/${role}/mf/top-holdings`)}
      />

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500">
          Loading...
        </div>
      ) : !record ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500">
          Record not found.
        </div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-xs font-medium uppercase text-gray-500">
                  Fund
                </p>
                <p className="mt-1 font-medium text-gray-900">
                  {record.fund_name}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-gray-500">
                  Scheme Code
                </p>
                <p className="mt-1 text-gray-800">
                  {formatValue(record.scheme_code)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-gray-500">
                  Source ISIN
                </p>
                <p className="mt-1 text-gray-800">
                  {formatValue(record.source_isin)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-gray-500">
                  Portfolio Date
                </p>
                <p className="mt-1 text-gray-800">
                  {formatDate(record.portfolio_date)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-gray-500">
                  Uploaded
                </p>
                <p className="mt-1 text-gray-800">
                  {formatDate(record.uploaded_at)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-gray-500">
                  Status
                </p>
                <p className="mt-1 text-gray-800">
                  {record.is_active === 1 ? "Active" : "Inactive"}
                </p>
              </div>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={paginatedHoldings}
            loading={false}
            page={page}
            totalPages={totalPages}
            totalRecords={holdings.length}
            recordsPerPage={recordsPerPage}
            onPageChange={setPage}
            onRecordsPerPageChange={(value) => {
              setRecordsPerPage(value);
              setPage(1);
            }}
            sortField=""
            sortOrder="desc"
          />

          {deleteOpen && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 px-4">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <h3 className="text-lg font-semibold text-gray-900">
                  Mark Scheme Inactive?
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  This keeps all historical snapshots intact and removes the
                  scheme from the default active listing.
                </p>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setDeleteOpen(false)}
                    disabled={deleting}
                    className="h-10 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => void handleDelete()}
                    disabled={deleting}
                    className="h-10 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </MFFormContainer>
  );
}
