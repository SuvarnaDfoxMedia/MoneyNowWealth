import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { FiX, FiCheckCircle, FiRefreshCw, FiAlertCircle, FiAlertTriangle } from "react-icons/fi";
import { useQueryClient } from "@tanstack/react-query";
import { useMfApiDashboard, useMfApiSyncActive, useMfApiSyncLogs } from "../hooks";

interface SyncProgressModalProps {
  role: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function SyncProgressModal({ role, isOpen, onClose }: SyncProgressModalProps) {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, refetch } = useMfApiDashboard(role, {
    refetchInterval: isOpen ? 2000 : false,
    enabled: isOpen,
  });
  const { data: logsData } = useMfApiSyncLogs(role, { page: 1, limit: 8 }, {
    refetchInterval: isOpen ? 2000 : false,
  });
  const retrySyncMutation = useMfApiSyncActive(role);

  const dashboard = data?.data;
  const logRows: any[] = logsData?.data ?? [];
  const latestLogJob: any = useMemo(() => {
    const sorted = [...logRows].sort((a, b) => {
      const aTime = new Date((a as any)?.updated_at ?? (a as any)?.created_at ?? a.updatedAt ?? a.createdAt ?? 0).getTime();
      const bTime = new Date((b as any)?.updated_at ?? (b as any)?.created_at ?? b.updatedAt ?? b.createdAt ?? 0).getTime();
      return bTime - aTime;
    });

    return (
      sorted.find((log) =>
        ["running", "rate_limited", "queued", "processing"].includes(String(log.status)),
      ) ||
      sorted.find((log) => log.action === "sync-all" || log.action === "sync-resume") ||
      null
    );
  }, [logRows]);
  const latestJob = latestLogJob || dashboard?.latestSyncJob || null;
  const totalSchemes = Number(latestJob?.response?.total ?? dashboard?.totalSchemes ?? 0) || 0;
  const activeSchemes = Number(latestJob?.response?.active ?? dashboard?.activeSchemes ?? 0) || 0;
  const inactiveSchemes = Number(latestJob?.response?.inactive ?? dashboard?.inactiveSchemes ?? 0) || 0;
  const processedSchemes = Number(latestJob?.response?.processed ?? 0) || 0;
  const failedSchemes = Number(latestJob?.response?.errors ?? dashboard?.failedSchemes ?? 0) || 0;
  const currentPhase = String(latestJob?.response?.phase || "idle");
  const currentPhaseLabel = currentPhase === "idle"
    ? "Idle"
    : currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1);
  const syncMessage = latestJob?.message || dashboard?.lastSyncMessage || dashboard?.runningMessage || "";
  const isCurrentlyRunning =
    ["running", "rate_limited", "queued"].includes(String(latestJob?.status)) ||
    ["active", "inactive", "processing"].includes(currentPhase);
  const isRateLimited = latestJob?.status === "rate_limited";
  const isCompleted = latestJob
    ? (latestJob.status === "success" ||
      latestJob.status === "failed" ||
      String(latestJob.status).startsWith("partial"))
    : false;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({
        queryKey: [role, "mf-api"],
      });
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!isOpen) return null;

  const progressPercentage =
    totalSchemes > 0
      ? Math.min(100, Math.round((processedSchemes / totalSchemes) * 100))
      : 0;

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Background Sync Progress</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isCurrentlyRunning ? (
            <div className="mb-6 flex items-center gap-3 text-blue-600">
              <FiRefreshCw className="h-5 w-5 animate-spin" />
              <div>
                <p className="font-medium">Sync is currently running...</p>
                {syncMessage ? (
                  <p className="mt-1 max-w-full truncate text-xs text-blue-500" title={syncMessage}>
                    {syncMessage}
                  </p>
                ) : null}
              </div>
            </div>
          ) : isRateLimited ? (
            // Rate-limited state — amber warning, not red error
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3 text-amber-700">
                <FiAlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">API is currently busy (rate limited)</p>
                  <p className="mt-1 text-sm text-amber-600">
                    Your sync has been paused. Schemes not yet synced will continue
                    automatically on the next sync run. Please wait a few minutes before
                    trying again.
                  </p>
                  {syncMessage ? (
                    <p className="mt-2 text-xs text-amber-500 truncate" title={syncMessage}>
                      {syncMessage}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : isCompleted ? (
            <div className="mb-6 flex items-center gap-3 text-green-600">
              <FiCheckCircle className="h-5 w-5" />
              <div>
                <p className="font-medium">Sync process completed!</p>
                <p className="mt-1 text-xs text-green-500">
                  Phase: {currentPhase}. Processed {processedSchemes} of {totalSchemes}.
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-6 flex items-center gap-3 text-gray-600">
              <FiAlertCircle className="h-5 w-5" />
              <div>
                <p className="font-medium">Sync is currently idle.</p>
                <p className="mt-1 text-xs text-gray-500">
                  Processed {processedSchemes} of {totalSchemes} schemes.
                </p>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">Overall Progress</span>
            <span className="font-semibold text-gray-900">{progressPercentage}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full transition-all duration-500 ${
                isCurrentlyRunning ? "bg-blue-500" : "bg-green-500"
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Processed {processedSchemes} of {totalSchemes} schemes{currentPhase !== "idle" ? ` • Phase: ${currentPhase}` : ""}.
          </p>

          {/* Stats Grid */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center">
              <p className="text-sm font-medium text-gray-500">Total Schemes</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{totalSchemes}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center">
              <p className="text-sm font-medium text-gray-500">Active</p>
              <p className="mt-1 text-2xl font-semibold text-blue-600">{activeSchemes}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center">
              <p className="text-sm font-medium text-gray-500">Processed</p>
              <p className="mt-1 text-2xl font-semibold text-green-600">{processedSchemes}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center">
              <p className="text-sm font-medium text-gray-500">Inactive / Errors</p>
              <p className="mt-1 text-2xl font-semibold text-red-600">{failedSchemes}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 flex justify-between items-center">
          <p className="text-xs text-gray-500">Updates every 1.5 seconds while the job is running</p>
          <div className="flex gap-3">
            {isRateLimited && (
              <button
                onClick={() => retrySyncMutation.mutate()}
                disabled={retrySyncMutation.isPending}
                className="rounded-lg border border-amber-400 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {retrySyncMutation.isPending ? "Starting..." : "Retry Sync"}
              </button>
            )}
            <button
              onClick={() => void handleRefresh()}
              disabled={isRefreshing}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
            <button
              onClick={onClose}
              className="rounded-lg bg-[#043f79] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#032e59]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
