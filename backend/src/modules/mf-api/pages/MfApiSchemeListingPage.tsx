import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import PageHeader from "../components/PageHeader";
import StatusPill from "../components/StatusPill";
import {
  useMfApiSchemes,
  useMfApiSyncActive,
  useMfApiSyncOne,
  useMfApiToggleActive,
  useMfApiBulkToggle,
  useMfApiMarkReviewed,
} from "../hooks";
import {
  formatDateTime,
  getMfApiAmcName,
  getMfApiSyncStatus,
  getMfApiSchemeName,
  toTitleCase,
} from "../utils";
import {
  DataTable,
  TableColumn,
} from "../../../components/PagesComponent/DataTable";
import { useDataTableStore } from "../../../store/dataTableStore";
import SyncProgressModal from "../components/SyncProgressModal";
import { useMfApiDashboard } from "../hooks";

type ActiveFilter = "all" | "active" | "inactive" | "new" | "failed";

export default function MfApiSchemeListingPage() {
  const { role = "admin" } = useParams();
  const navigate = useNavigate();

  const MODULE_KEY = `${role}-mf-api`;
  const [isMounted, setIsMounted] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("active");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
  } = useDataTableStore();

  useEffect(() => {
    setCurrentModule(MODULE_KEY);
    setIsMounted(true);
  }, [MODULE_KEY, setCurrentModule]);

  const params = useMemo(() => {
    const base: Record<string, any> = {
      search: searchValue,
      page,
      limit: recordsPerPage,
      sort_by: "active_first",
    };
    if (activeFilter === "active") base.is_active = "true";
    if (activeFilter === "inactive") base.is_active = "false";
    if (activeFilter === "new") base.is_new = "true";
    if (activeFilter === "failed") base.status = "failed";
    return base;
  }, [searchValue, page, recordsPerPage, activeFilter]);

  // Fix C: determine whether any visible row is still syncing, so we can auto-poll.
  const [isSyncing, setIsSyncing] = React.useState(false);
  const dashboardQuery = useMfApiDashboard(role, {
    refetchInterval: isSyncing ? 3000 : undefined,
  });

  React.useEffect(() => {
    const data = dashboardQuery.data?.data;
    const pending = (data?.pendingSchemes ?? 0) > 0;
    const running = data?.recentLogs?.[0]?.status === "running";
    setIsSyncing(pending || running);
  }, [dashboardQuery.data]);

  const schemesQuery = useMfApiSchemes(role, params, {
    refetchInterval: isSyncing ? 3000 : undefined,
  });
  const schemeRows = schemesQuery.data?.data ?? [];

  const syncActiveMutation = useMfApiSyncActive(role);
  const syncOneMutation = useMfApiSyncOne(role);
  const toggleActiveMutation = useMfApiToggleActive(role);
  const bulkToggleMutation = useMfApiBulkToggle(role);
  const markReviewedMutation = useMfApiMarkReviewed(role);

  const rows = schemeRows;
  const totalRecords = schemesQuery.data?.total ?? 0;
  const totalPages = Math.max(Math.ceil(totalRecords / recordsPerPage), 1);

  const handleBulkToggle = (is_active: boolean) => {
    bulkToggleMutation.mutate(
      { ids: Array.from(selectedIds), is_active },
      { onSuccess: () => setSelectedIds(new Set()) },
    );
  };

  const handleMarkReviewed = () => {
    markReviewedMutation.mutate(Array.from(selectedIds), {
      onSuccess: () => setSelectedIds(new Set()),
    });
  };

  const toggleRowSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSync = (scheme: any) => {
    syncOneMutation.mutate({
      schemeId: scheme._id,
      schemeName: getMfApiSchemeName(scheme),
      externalSchemeId: scheme.schemeCode || scheme.scheme_code,
    });
  };

  const columns: TableColumn<any>[] = [
    {
      key: "select",
      label: "",
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.has(row._id)}
          onChange={() => toggleRowSelection(row._id)}
          className="h-4 w-4 rounded border-gray-300 accent-[#043f79]"
        />
      ),
    },
    {
      key: "scheme_name",
      label: "Scheme",
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-gray-900 leading-tight">
            {getMfApiSchemeName(row)}
          </span>
          <span className="text-xs text-gray-400">
            {row.isin || row.scheme_code || ""}
          </span>
          {row.is_new && (
            <span className="inline-flex w-fit rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
              NEW
            </span>
          )}
        </div>
      ),
    },
    {
      key: "amc_name",
      label: "AMC",
      render: (row) => (
        <span className="text-sm text-gray-600">{getMfApiAmcName(row)}</span>
      ),
    },
    {
      key: "category",
      label: "Category",
      render: (row) => (
        <span className="text-sm text-gray-600">{row.category || "-"}</span>
      ),
    },
    {
      key: "plan_type",
      label: "Plan",
      render: (row) => toTitleCase(row.planType || row.plan_type),
    },
    {
      key: "sync_status",
      label: "Sync Status",
      render: (row) => <StatusPill status={getMfApiSyncStatus(row)} />,
    },
    // {
    //   key: "linked_status",
    //   label: "Link Status",
    //   render: (row) => (
    //     <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${
    //       row.linked_manual_fund
    //         ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
    //         : "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20"
    //     }`}>
    //       {row.linked_manual_fund ? (
    //         <>
    //           <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
    //             <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
    //           </svg>
    //           Bridged
    //         </>
    //       ) : (
    //         <>
    //           <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
    //             <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    //           </svg>
    //           Needs Review
    //         </>
    //       )}
    //     </span>
    //   ),
    // },
    {
      key: "is_active",
      label: "Active",
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            title={row.is_active ? "Click to deactivate" : "Click to activate"}
            onClick={() =>
              toggleActiveMutation.mutate({
                id: row._id,
                is_active: !row.is_active,
              })
            }
            disabled={toggleActiveMutation.isPending}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none disabled:opacity-60 ${
              row.is_active ? "bg-green-500" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                row.is_active ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </button>
          <span
            className={`text-xs font-medium ${row.is_active ? "text-green-700" : "text-gray-400"}`}
          >
            {row.is_active ? "Active" : "Inactive"}
          </span>
        </div>
      ),
    },
    {
      key: "last_synced_at",
      label: "Last Synced",
      render: (row) => (
        <span className="text-xs text-gray-500">
          {formatDateTime(row.lastSyncedAt || row.last_synced_at)}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate(`/${role}/mf-api/schemes/${row._id}`)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            View
          </button>
          <button
            type="button"
            onClick={() => handleSync(row)}
            disabled={!row.is_active || syncOneMutation.isPending}
            title={!row.is_active ? "Activate scheme to sync" : "Sync now"}
            className="rounded-md bg-[#043f79] px-3 py-1.5 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Sync
          </button>
        </div>
      ),
    },
  ];

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <PageHeader
        title="Scheme Master"
        description="Separate MF API scheme master records and sync actions."
        actions={
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsSyncModalOpen(true)}
              className="rounded-lg border border-[#043f79] text-[#043f79] px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              View Sync Progress
            </button>
            <button
              type="button"
              onClick={() => {
                syncActiveMutation.mutate();
                setIsSyncModalOpen(true);
              }}
              disabled={syncActiveMutation.isPending}
              className="rounded-lg bg-[#043f79] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {syncActiveMutation.isPending
                ? "Starting..."
                : "Sync Active Funds"}
            </button>
          </div>
        }
      />

      <div className="mt-4">
        <p className="text-sm text-gray-500 mb-3">
          Showing {totalRecords} schemes
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { key: "active", label: "Active (Syncing)" },
            { key: "all", label: "All Schemes" },
            { key: "inactive", label: "Inactive" },
            { key: "new", label: "New / Unreviewed" },
            { key: "failed", label: "Sync Failed" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => {
                setActiveFilter(key as ActiveFilter);
                setPage(1);
              }}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeFilter === key
                  ? "bg-[#043f79] text-white"
                  : "border border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 mb-3">
            <span className="text-sm font-medium text-blue-800">
              {selectedIds.size} selected
            </span>
            <button
              onClick={() => handleBulkToggle(true)}
              className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white"
            >
              Activate Selected
            </button>
            <button
              onClick={() => handleBulkToggle(false)}
              className="rounded-md bg-gray-500 px-3 py-1.5 text-xs font-medium text-white"
            >
              Deactivate Selected
            </button>
            <button
              onClick={handleMarkReviewed}
              className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-medium text-white"
            >
              Mark as Reviewed
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="ml-auto text-xs text-blue-600 underline"
            >
              Clear Selection
            </button>
          </div>
        )}

        <DataTable
          columns={columns}
          data={rows}
          loading={schemesQuery.isLoading}
          isFetching={schemesQuery.isFetching}
          page={page}
          totalPages={totalPages}
          totalRecords={totalRecords}
          recordsPerPage={recordsPerPage}
          onPageChange={setPage}
          onRecordsPerPageChange={setRecordsPerPage}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          sortField={sortField}
          sortOrder={sortOrder}
          onSortChange={setSort}
        />
      </div>

      <SyncProgressModal
        role={role}
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
      />
    </div>
  );
}
