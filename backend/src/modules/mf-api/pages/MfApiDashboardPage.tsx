import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import StatusPill from "../components/StatusPill";
import SyncProgressModal from "../components/SyncProgressModal";
import {
  useMfApiDashboard,
  useMfApiSchemes,
  useMfApiSyncAll,
  useMfApiSyncLogs,
  useMfApiResyncToManual,
} from "../hooks";
import {
  formatDateTime,
  formatNumber,
  getMfApiAmcName,
  getMfApiSyncStatus,
  getMfApiSchemeName,
} from "../utils";

export default function MfApiDashboardPage() {
  const { role = "admin" } = useParams();
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const dashboardQuery = useMfApiDashboard(role, {
    refetchInterval: isRunning ? 3000 : false,
  });
  const schemesQuery = useMfApiSchemes(
    role,
    { page: 1, limit: 5 },
    { refetchInterval: isRunning ? 3000 : false }
  );
  const logsQuery = useMfApiSyncLogs(
    role,
    { page: 1, limit: 5 },
    { refetchInterval: isRunning ? 3000 : false }
  );
  const syncAllMutation = useMfApiSyncAll(role);
  const resyncToManualMutation = useMfApiResyncToManual(role);

  const dashboard = dashboardQuery.data?.data;

  useEffect(() => {
    const latestJob = dashboard?.latestSyncJob || null;
    const phase = String(latestJob?.response?.phase || "").toLowerCase();
    const running =
      latestJob?.status === "running" ||
      ["active", "inactive", "processing"].includes(phase);
    setIsRunning(running);
  }, [dashboard]);

  const recentSchemes = dashboard?.recentSchemes ?? schemesQuery.data?.data ?? [];
  const recentLogs = dashboard?.recentLogs ?? logsQuery.data?.data ?? [];

  const totalSchemes = dashboard?.totalSchemes ?? schemesQuery.data?.total ?? recentSchemes.length;
  const activeSchemes = dashboard?.activeSchemes ?? 0;
  const inactiveSchemes = dashboard?.inactiveSchemes ?? 0;
  const newSchemes = dashboard?.newSchemes ?? 0;

  const syncedSchemes =
    dashboard?.syncedSchemes ??
    recentSchemes.filter((scheme) => getMfApiSyncStatus(scheme) === "success").length;
  const failedSchemes =
    dashboard?.failedSchemes ??
    recentLogs.filter((log) => log.status === "failed").length;
  const pendingSchemes =
    dashboard?.pendingSchemes ?? Math.max(totalSchemes - syncedSchemes - failedSchemes, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <PageHeader
        title="MF API Dashboard"
        description="Isolated API-driven mutual fund sync module."
        actions={
          <>
            <button
              type="button"
              onClick={() => setIsSyncModalOpen(true)}
              className="rounded-lg border border-[#043f79] text-[#043f79] bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              View Sync Progress
            </button>

            <button
              type="button"
              onClick={() => {
                syncAllMutation.mutate(undefined, {
                  onSuccess: () => setIsSyncModalOpen(true),
                });
              }}
              disabled={syncAllMutation.isPending || isRunning}
              title={
                isRunning
                  ? "A sync is already in progress. Check the sync progress or wait for it to finish."
                  : "Start a full MF API sync"
              }
              className="rounded-lg bg-[#043f79] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {syncAllMutation.isPending
                ? "Syncing..."
                : isRunning
                  ? "Sync In Progress"
                  : "Sync All"}
            </button>

            <button
              type="button"
              onClick={() => {
                resyncToManualMutation.mutate(undefined, {
                  onSuccess: () => setIsSyncModalOpen(true),
                });
              }}
              disabled={resyncToManualMutation.isPending}
              className="rounded-lg border border-emerald-500 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
            >
              {resyncToManualMutation.isPending ? "Reconciling..." : "Reconcile Manual"}
            </button>

            <button
              type="button"
              onClick={() => {
                void dashboardQuery.refetch();
                void schemesQuery.refetch();
                void logsQuery.refetch();
              }}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700"
            >
              Refresh
            </button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Schemes"
          value={formatNumber(totalSchemes)}
          meta="Synced from external MF API"
        />
        <StatCard
          label="Active (Managed)"
          value={formatNumber(activeSchemes)}
          meta="Receiving daily sync"
          tone="positive"
        />
        <StatCard
          label="Inactive"
          value={formatNumber(inactiveSchemes)}
          meta="Not syncing"
        />
        <StatCard
          label="New This Sync"
          value={formatNumber(newSchemes)}
          meta="Awaiting review"
        />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <StatCard
          label="Synced"
          value={formatNumber(syncedSchemes)}
          meta="Active funds with fresh data"
          tone="positive"
        />
        <StatCard
          label="Failed"
          value={formatNumber(failedSchemes)}
          meta="Active funds with errors"
          tone="negative"
        />
        <StatCard
          label="Pending"
          value={formatNumber(pendingSchemes)}
          meta={`Last sync: ${formatDateTime(dashboard?.lastSyncAt)}`}
        />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <StatCard
          label="Bridged Funds"
          value={formatNumber(dashboard?.bridgedFunds ?? 0)}
          meta="Linked to manual MFFund"
        />
        <StatCard
          label="Active Bridged Funds"
          value={formatNumber(dashboard?.activeBridgedFunds ?? 0)}
          meta="Active & linked to manual MFFund"
          tone="positive"
        />
      </div>

      {newSchemes > 0 && (
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="font-semibold">{newSchemes} new schemes</span> were discovered in the latest sync and are awaiting your review.
          <a href={`/${role}/mf-api/schemes?is_new=true`} className="ml-auto font-medium underline">Review now -&gt;</a>
        </div>
      )}

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Recent Schemes</h2>
              <p className="text-sm text-gray-500">Latest records from the isolated MF API store.</p>
            </div>
            {dashboardQuery.isFetching ? (
              <StatusPill status="running" />
            ) : null}
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="py-3 pr-4">Active</th>
                  <th className="py-3 pr-4">Scheme</th>
                  <th className="py-3 pr-4">AMC</th>
                  <th className="py-3 pr-4">Plan</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Last Synced</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentSchemes.length === 0 ? (
                  <tr>
                    <td className="py-6 text-sm text-gray-500" colSpan={5}>
                      No schemes available yet.
                    </td>
                  </tr>
                ) : (
                  recentSchemes.map((scheme) => (
                    <tr key={scheme._id}>
                      <td className="py-3 pr-4">
                        <span className={`inline-block h-2 w-2 rounded-full ${scheme.is_active ? "bg-green-500" : "bg-gray-300"}`} />
                      </td>
                      <td className="py-3 pr-4 text-sm font-medium text-gray-900">
                        {getMfApiSchemeName(scheme)}
                      </td>
                      <td className="py-3 pr-4 text-sm text-gray-600">
                        {getMfApiAmcName(scheme)}
                      </td>
                      <td className="py-3 pr-4 text-sm text-gray-600">
                        {scheme.planType || scheme.plan_type || "-"}
                      </td>
                      <td className="py-3 pr-4">
                        <StatusPill status={getMfApiSyncStatus(scheme)} />
                      </td>
                      <td className="py-3 pr-4 text-sm text-gray-600">
                        {formatDateTime(scheme.lastSyncedAt || scheme.last_synced_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Recent Sync Logs</h2>
          <p className="mt-1 text-sm text-gray-500">Track successful and failed syncs separately.</p>

          <div className="mt-4 space-y-3">
            {recentLogs.length === 0 ? (
              <p className="text-sm text-gray-500">No sync logs available yet.</p>
            ) : (
              recentLogs.map((log) => (
                <div key={log._id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {log.schemeName || log.schemeId || log.action || "Sync event"}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {log.message || log.error || "No additional message"}
                      </p>
                    </div>
                    <StatusPill status={log.status} />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {formatDateTime(log.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <SyncProgressModal
        role={role}
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
      />
    </div>
  );
}
