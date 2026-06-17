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
            rows.map((log) => (
              <div key={log._id} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {log.schemeName || log.schemeId || log.action || "Sync event"}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      {log.message || log.error || "No message provided."}
                    </p>
                  </div>
                  <StatusPill status={log.status} />
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                  <span>Action: {log.action || "-"}</span>
                  <span>Created: {formatDateTime(log.createdAt)}</span>
                  <span>Updated: {formatDateTime(log.updatedAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
