import { useState } from "react";
import { useParams } from "react-router-dom";
import DatePicker from "../../../components/form/date-picker";
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
  const [datePickerKey, setDatePickerKey] = useState(0);
  const [page, setPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);

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
          <DatePicker
            key={`from-${datePickerKey}`}
            id={`nav-history-from-${datePickerKey}`}
            label="From"
            placeholder="Select from date"
            defaultDate={fromDate || undefined}
            onChange={(selectedDates) => {
              setFromDate(toApiDate(selectedDates[0]));
              setPage(1);
            }}
          />
          <DatePicker
            key={`to-${datePickerKey}`}
            id={`nav-history-to-${datePickerKey}`}
            label="To"
            placeholder="Select to date"
            defaultDate={toDate || undefined}
            onChange={(selectedDates) => {
              setToDate(toApiDate(selectedDates[0]));
              setPage(1);
            }}
          />
          <button
            type="button"
            onClick={() => {
              setFromDate("");
              setToDate("");
              setDatePickerKey((current) => current + 1);
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
