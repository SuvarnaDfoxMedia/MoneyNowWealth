import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import PageHeader from "../components/PageHeader";
import StatusPill from "../components/StatusPill";
import { useMfApiSyncLogs } from "../hooks";
import { formatDateTime } from "../utils";

const LOG_PAGE_SIZE = 10;

export default function MfApiSyncLogsPage() {
  const { role = "admin" } = useParams();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const params = useMemo(() => ({ search, page, limit: LOG_PAGE_SIZE }), [search, page]);
  const logsQuery = useMfApiSyncLogs(role, params);
  const rows = logsQuery.data?.data ?? [];
  const totalPages = logsQuery.data?.totalPages ?? 1;

  useEffect(() => {
    setPage(1);
    setExpandedLogId(null);
  }, [search]);

  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const renderJson = (value: unknown) => {
    if (value == null) return "-";
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  };

  const getFailureStage = (log: any) =>
    log?.response?.failureStep ||
    log?.response?.failureStage ||
    log?.response?.failure_stage ||
    log?.response?.stage ||
    log?.response?.step ||
    log?.error ||
    "";

  const friendlyStage = (stage: string) => {
    const normalized = stage.toLowerCase();
    if (normalized.includes("normalize")) return "Preparing scheme data";
    if (normalized.includes("upsert")) return "Saving scheme record";
    if (normalized.includes("requestexternallatestinfo")) return "Fetching latest fund details";
    if (normalized.includes("processworkbook")) return "Processing fund update";
    if (normalized.includes("validatesyncpayload")) return "Checking fund data";
    if (normalized.includes("bridgetomanualfund")) return "Updating manual module";
    if (normalized.includes("rate")) return "Waiting for API to respond";
    if (normalized.includes("duplicate")) return "Saving scheme record";
    return stage || "Unknown step";
  };

  const friendlyError = (log: any) => {
    const raw = String(log?.error || log?.response?.error || log?.response?.technicalError || "");
    const duplicateMatch = raw.match(/external_key_1 dup key: \{\s*external_key:\s*"([^"]+)"\s*\}/i);
    if (duplicateMatch) {
      return `This MF scheme already exists in the system with code ${duplicateMatch[1]}. The sync tried to create it again instead of updating the existing record.`;
    }
    if (/validation failed/i.test(raw)) {
      return "The scheme data was incomplete or did not meet the required format.";
    }
    if (/rate limit/i.test(raw)) {
      return "The MF API is temporarily busy. The sync should be retried later.";
    }
    return raw || "No error details were provided.";
  };

  const friendlyAction = (log: any) => {
    if (log?.action === "sync-all-item") return "Single scheme sync during batch processing";
    if (log?.action === "sync-one") return "Single scheme sync";
    if (log?.action === "sync-all") return "Full MF API sync";
    if (log?.action === "sync-resume") return "Resume interrupted sync";
    return log?.action || "Sync event";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <PageHeader
        title="Sync Logs"
        description="Separate audit trail for the new MF API sync pipeline."
      />

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">
              {logsQuery.data?.total ?? rows.length} log entries
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Logs are retained for 7 days and older entries are purged automatically.
            </p>
          </div>
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
              const isExpanded = expandedLogId === log._id;
              const createdAt = (log as any).created_at ?? log.createdAt;
              const updatedAt = (log as any).updated_at ?? log.updatedAt;
              const title = (log as any).scheme_name || log.schemeName || log.action || "Sync event";
              const resp = (log as any).response as Record<string, unknown> | null | undefined;
              const isImport = log.action === "import";
              const isExport = log.action === "export";
              const failureStage = getFailureStage(log);
              const statusIsFailed = String(log.status).toLowerCase() === "failed";

              return (
                <div key={log._id} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <button
                    type="button"
                    onClick={() => setExpandedLogId(isExpanded ? null : log._id)}
                    className="flex w-full flex-col gap-3 text-left md:flex-row md:items-start md:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="mb-1 inline-block rounded bg-gray-200 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-gray-600">
                        {log.action || "event"}
                      </span>
                      <p className="text-sm font-semibold text-gray-900">{title}</p>
                      <p className="mt-1 text-sm text-gray-600">
                        {log.message || log.error || "No message provided."}
                      </p>

                      {failureStage && (
                        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                            What failed
                          </p>
                          <p className="mt-1 text-sm font-medium text-red-900">
                            {friendlyStage(failureStage)}
                          </p>
                          <p className="mt-2 text-xs text-red-800">
                            {friendlyError(log)}
                          </p>
                          {statusIsFailed && (
                            <p className="mt-2 text-xs text-red-700">
                              This item was not saved. The sync log below contains the technical details for support.
                            </p>
                          )}
                        </div>
                      )}

                      {isImport && resp && (
                        <div className="mt-2 flex flex-wrap gap-3 text-xs">
                          {resp.inserted != null && (
                            <span className="font-medium text-green-700">+{String(resp.inserted)} new</span>
                          )}
                          {resp.updated != null && (
                            <span className="font-medium text-blue-700">{String(resp.updated)} updated</span>
                          )}
                          {resp.activated != null && (
                            <span className="font-medium text-emerald-700">{String(resp.activated)} bridged</span>
                          )}
                          {(Number(resp.syncFailed ?? 0) > 0) && (
                            <span className="font-medium text-amber-700">
                              ! {String(resp.syncFailed)} bridge failed
                            </span>
                          )}
                          {resp.rejected != null && Number(resp.rejected) > 0 && (
                            <span className="font-medium text-red-600">{String(resp.rejected)} rejected</span>
                          )}
                          {resp.totalRows != null && (
                            <span className="text-gray-500">{String(resp.totalRows)} rows</span>
                          )}
                        </div>
                      )}

                      {isExport && resp?.totalRows != null && (
                        <p className="mt-1 text-xs text-gray-500">
                          {String(resp.totalRows)} rows exported
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-start gap-2 md:items-end">
                      <StatusPill status={log.status} />
                      <span className="text-xs font-medium text-gray-500">
                        {isExpanded ? "Hide details" : "View details"}
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="mt-4 grid gap-4 border-t border-gray-200 pt-4 md:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Plain-English summary
                        </p>
                        <dl className="mt-2 space-y-2 text-sm">
                          <div>
                            <dt className="text-gray-500">What this is</dt>
                            <dd className="font-medium text-gray-900">{friendlyAction(log)}</dd>
                          </div>
                          <div>
                            <dt className="text-gray-500">Status</dt>
                            <dd className="font-medium text-gray-900">{log.status || "-"}</dd>
                          </div>
                          <div>
                            <dt className="text-gray-500">Why it failed</dt>
                            <dd className="font-medium text-gray-900">
                              {friendlyError(log)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-gray-500">Where it stopped</dt>
                            <dd className="font-medium text-gray-900">{friendlyStage(failureStage) || "-"}</dd>
                          </div>
                          <div>
                            <dt className="text-gray-500">Scheme code</dt>
                            <dd className="font-medium text-gray-900">
                              {(log as any).scheme_code || (log as any).payload?.scheme_amfi_code || "-"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-gray-500">Scheme name</dt>
                            <dd className="font-medium text-gray-900">
                              {(log as any).scheme_name || (log as any).payload?.scheme_amfi || "-"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-gray-500">Created</dt>
                            <dd className="font-medium text-gray-900">{formatDateTime(createdAt)}</dd>
                          </div>
                          <div>
                            <dt className="text-gray-500">Updated</dt>
                            <dd className="font-medium text-gray-900">{formatDateTime(updatedAt)}</dd>
                          </div>
                        </dl>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Technical payload
                          </p>
                          <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-white p-3 text-xs text-gray-700">
                            {renderJson((log as any).payload)}
                          </pre>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Technical response
                          </p>
                          <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-white p-3 text-xs text-gray-700">
                            {renderJson((log as any).response)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}

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

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-gray-200 pt-4 text-sm">
          <p className="text-gray-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1}
              className="h-10 rounded-md border border-gray-300 px-4 font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page >= totalPages}
              className="h-10 rounded-md border border-gray-300 px-4 font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
