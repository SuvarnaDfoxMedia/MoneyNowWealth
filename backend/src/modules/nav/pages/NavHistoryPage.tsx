import { useState } from "react";
import { useParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  DataTable,
  type TableColumn,
} from "../../../components/PagesComponent/DataTable";
import NavImportActions from "../components/NavImportActions";
import PageHeader from "../components/PageHeader";
import SchemeSelect from "../components/SchemeSelect";
import { formatDate, formatNav, formatNumber } from "../format";
import { useNavHistory } from "../hooks";
import type { NavHistoryItem } from "../types";

const toApiDate = (date?: Date) => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function NavHistoryPage() {
  const { role = "admin" } = useParams();
  const [selectedSchemeId, setSelectedSchemeId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const fromDateValue = fromDate ? new Date(fromDate) : null;
  const toDateValue = toDate ? new Date(toDate) : null;

  const schemeId = selectedSchemeId;
  const historyQuery = useNavHistory(role, schemeId, {
    page,
    limit: recordsPerPage,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  });

  const rows = historyQuery.data?.data ?? [];
  const totalRecords = historyQuery.data?.total ?? 0;
  const totalPages = Math.max(historyQuery.data?.totalPages ?? 1, 1);

  const columns: TableColumn<NavHistoryItem>[] = [
    {
      key: "index",
      label: "#",
      render: (_row, index) => (page - 1) * recordsPerPage + index + 1,
    },
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (row) => formatDate(row.date),
    },
    {
      key: "nav",
      label: "NAV",
      sortable: true,
      render: (row) => formatNav(row.nav),
    },
    {
      key: "totalAssets",
      label: "Total Assets",
      render: (row) => formatNumber(row.totalAssets),
    },
    {
      key: "totalLiabilities",
      label: "Total Liabilities",
      render: (row) => formatNumber(row.totalLiabilities),
    },
    {
      key: "totalUnits",
      label: "Total Units",
      render: (row) => formatNumber(row.totalUnits),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <PageHeader
        title="NAV History"
        actions={
          <>
            <SchemeSelect
              role={role}
              value={schemeId}
              onChange={(value) => {
                setSelectedSchemeId(value);
                setPage(1);
              }}
            />
            <NavImportActions
              role={role}
              onImported={async () => {
                await historyQuery.refetch();
              }}
            />
          </>
        }
      />

      <div className="mb-5 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[minmax(180px,240px)_minmax(180px,240px)_auto] md:items-end">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              From
            </label>
            <DatePicker
              selected={fromDateValue}
              onChange={(date) => {
                const next = date instanceof Date ? toApiDate(date) : "";
                setFromDate(next);
                if (date && toDateValue && date > toDateValue) {
                  setToDate(next);
                }
                setPage(1);
              }}
              maxDate={toDateValue || today}
              dateFormat="dd/MM/yyyy"
              placeholderText="Select from date"
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              To
            </label>
            <DatePicker
              selected={toDateValue}
              onChange={(date) => {
                setToDate(date instanceof Date ? toApiDate(date) : "");
                if (date && fromDateValue && date < fromDateValue) {
                  setFromDate(toApiDate(date));
                }
                setPage(1);
              }}
              minDate={fromDateValue || undefined}
              maxDate={today}
              dateFormat="dd/MM/yyyy"
              placeholderText="Select to date"
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setFromDate("");
              setToDate("");
              setPage(1);
            }}
            className="h-11 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            Reset
          </button>
        </div>
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
