import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import PageHeader from "../components/PageHeader";
import StatusPill from "../components/StatusPill";
import { useMfApiSyncLogs } from "../hooks";
import { formatDateTime } from "../utils";

export default function MfApiSyncLogsPage() {
  const { role = "admin" } = useParams();
  const [search, setSearch] = useState("");
  const params = useMemo(() => ({ search, page: 1, limit: 50 }), [search]);
  const logsQuery = useMfApiSyncLogs(role, params);
  const rows = logsQuery.data?.data ?? [];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <PageHeader
        title="Sync Logs"
        description="Separate audit trail for the new MF API sync pipeline."
      />

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm font-medium text-gray-500">
            {logsQuery.data?.total ?? rows.length} log entries
          </p>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by scheme, action or status..."
            className="h-11 w-full rounded-md border border-gray-300 px-3 text-sm outline-none md:max-w-sm"
          />
        </div>

        <div className="mt-4 space-y-3">
          {rows.length === 0 ? (
            <p className="py-6 text-sm text-gray-500">No logs available yet.</p>
          ) : (
            rows.map((log) => {
              // Model uses custom timestamps: created_at / updated_at — fall back to camelCase aliases
              const createdAt = (log as any).created_at ?? log.createdAt;
              const updatedAt = (log as any).updated_at ?? log.updatedAt;

              // Title: prefer scheme name, fall back to action label
              const title = (log as any).scheme_name || log.schemeName || log.action || "Sync event";

              // For import/export logs — show key counts from response
              const resp = (log as any).response as Record<string, number> | null | undefined;
              const isImport = log.action === "import";
              const isExport = log.action === "export";

              return (
                <div key={log._id} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 flex-1">
                      {/* Action badge always visible */}
                      <span className="mb-1 inline-block rounded bg-gray-200 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-gray-600">
                        {log.action || "event"}
                      </span>
                      <p className="text-sm font-semibold text-gray-900">{title}</p>
                      <p className="mt-1 text-sm text-gray-600">
                        {log.message || log.error || "No message provided."}
                      </p>

                      {/* Import-specific counts */}
                      {isImport && resp && (
                        <div className="mt-2 flex flex-wrap gap-3 text-xs">
                          {resp.inserted != null && (
                            <span className="text-green-700 font-medium">+{resp.inserted} new</span>
                          )}
                          {resp.updated != null && (
                            <span className="text-blue-700 font-medium">{resp.updated} updated</span>
                          )}
                          {resp.activated != null && (
                            <span className="text-emerald-700 font-medium">{resp.activated} bridged</span>
                          )}
                          {(resp.syncFailed ?? 0) > 0 && (
                            <span className="text-amber-700 font-medium">⚠ {resp.syncFailed} bridge failed</span>
                          )}
                          {resp.rejected != null && resp.rejected > 0 && (
                            <span className="text-red-600 font-medium">{resp.rejected} rejected</span>
                          )}
                          {resp.totalRows != null && (
                            <span className="text-gray-500">{resp.totalRows} rows</span>
                          )}
                        </div>
                      )}

                      {/* Export row count */}
                      {isExport && resp?.totalRows != null && (
                        <p className="mt-1 text-xs text-gray-500">{resp.totalRows} rows exported</p>
                      )}
                    </div>
                    <StatusPill status={log.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                    <span>Action: {log.action || "-"}</span>
                    <span>Created: {formatDateTime(createdAt)}</span>
                    <span>Updated: {formatDateTime(updatedAt)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
