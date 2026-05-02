import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FiArrowLeft, FiEye } from "react-icons/fi";
import { axiosApi } from "../../api/axios";
import { DataTable, TableColumn } from "../PagesComponent/DataTable";

type HistoryRow = {
  _id: string;
  scheme_identity: string;
  fund_name: string;
  scheme_code?: string;
  source_isin?: string;
  portfolio_date?: string;
  uploaded_at?: string;
  holdings_count?: number;
  top_holdings_summary?: string[];
  is_latest?: boolean;
  is_active?: number;
};

type HistoryResponse = {
  data?: HistoryRow[];
  total?: number;
  totalPages?: number;
};

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString("en-GB") : "-";

export default function MFTopHoldingHistoryPage() {
  const { role = "admin", schemeId = "" } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);

  const decodedSchemeId = decodeURIComponent(schemeId);
  const historyQuery = useQuery({
    queryKey: [
      role,
      "mf-top-holdings-history",
      decodedSchemeId,
      page,
      recordsPerPage,
    ],
    queryFn: () =>
      axiosApi.get<HistoryRow[]>(
        `/${role}/mf/top-holdings/history/${encodeURIComponent(decodedSchemeId)}`,
        {
          page,
          limit: recordsPerPage,
        },
      ),
    enabled: Boolean(decodedSchemeId),
  });

  const response = historyQuery.data as HistoryResponse | undefined;
  const rows = Array.isArray(response?.data) ? response.data : [];
  const totalRecords = response?.total ?? 0;
  const totalPages = Math.max(response?.totalPages ?? 1, 1);
  const title = rows[0]?.fund_name || decodedSchemeId || "Top Holdings";

  const columns: TableColumn<HistoryRow>[] = [
    {
      key: "index",
      label: "#",
      render: (_row, index) => (page - 1) * recordsPerPage + index + 1,
    },
    {
      key: "portfolio_date",
      label: "Portfolio Date",
      render: (row) => formatDate(row.portfolio_date),
    },
    {
      key: "uploaded_at",
      label: "Uploaded",
      render: (row) => formatDate(row.uploaded_at),
    },
    {
      key: "holdings_count",
      label: "Holdings",
      render: (row) => row.holdings_count ?? 0,
    },
    {
      key: "summary",
      label: "Top Holdings",
      render: (row) =>
        Array.isArray(row.top_holdings_summary) &&
        row.top_holdings_summary.length > 0
          ? row.top_holdings_summary.slice(0, 4).join(", ")
          : "-",
    },
    {
      key: "is_latest",
      label: "Snapshot",
      render: (row) => (row.is_latest ? "Latest" : "Historical"),
    },
    {
      key: "is_active",
      label: "Status",
      render: (row) => (row.is_active === 1 ? "Active" : "Inactive"),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <button
          type="button"
          onClick={() => navigate(`/${role}/mf/top-holdings/view/${row._id}`)}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
        >
          <FiEye /> View
        </button>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-medium">MF Top Holdings History</h2>
          <p className="mt-1 text-sm text-gray-500">{title}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/${role}/mf/top-holdings`)}
          className="flex items-center gap-2 rounded-md bg-[#043f79] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0654a4]"
        >
          <FiArrowLeft />
          Back
        </button>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        loading={historyQuery.isLoading}
        isFetching={historyQuery.isFetching}
        page={page}
        totalPages={totalPages}
        totalRecords={totalRecords}
        recordsPerPage={recordsPerPage}
        onPageChange={setPage}
        onRecordsPerPageChange={(value) => {
          setRecordsPerPage(value);
          setPage(1);
        }}
        sortField=""
        sortOrder="desc"
      />
    </div>
  );
}
