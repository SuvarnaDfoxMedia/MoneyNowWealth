import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

import PageHeader from "../components/PageHeader";
import { useMfApiExport, useMfApiImport } from "../hooks";
import { fetchUnbridgedSchemesApi } from "../api";
import * as XLSX from "xlsx";
import { downloadBlob } from "../utils";

export default function MfApiImportExportPage() {
  const { role = "admin" } = useParams();
  const [file, setFile] = useState<File | null>(null);
  const [validateOnly, setValidateOnly] = useState(true);
  const [showBridgeFailures, setShowBridgeFailures] = useState(false);
  const [showDiagnose, setShowDiagnose] = useState(false);
  const importMutation = useMfApiImport(role);
  const exportMutation = useMfApiExport(role);
  const diagnoseMutation = useMutation({
    mutationFn: () => fetchUnbridgedSchemesApi(role),
  });

  const report = importMutation.data;
  const diagnoseData = (diagnoseMutation.data as any)?.data ?? (diagnoseMutation.data as any);

  const handleImport = () => {
    if (!file) return;
    importMutation.mutate({ file, validateOnly });
  };

  const handleExport = async (activeOnly = false) => {
    const response = await exportMutation.mutateAsync({ active_only: activeOnly });
    const prefix = activeOnly ? "mf-api-active-export" : "mf-api-all-export";
    downloadBlob(
      response.data,
      `${prefix}-${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  const handleDownloadHoldingsTemplate = () => {
    const template = [
      {
        name: "HDFC Bank Ltd",
        net_assets_pct: 8.2,
        market_value: 6024500000,
        share_amount: 12500000,
        share_change: 250000,
        sector: "Banking",
        security_type: "Equity",
        maturity: "",
        credit_quality_india: "",
        country: "IN",
      },
      {
        name: "Infosys Ltd",
        net_assets_pct: 6.5,
        market_value: 4780000000,
        share_amount: 9800000,
        share_change: -100000,
        sector: "Information Technology",
        security_type: "Equity",
        maturity: "",
        credit_quality_india: "",
        country: "IN",
      },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(template), "Holdings");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "top-holdings-template.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 space-y-4">
      <PageHeader
        title="Import / Export"
        description="Keep this workflow separate from the existing MF import/export screens."
      />

      {/* ── Import + Export Cards ─────────────────────────────────────────── */}
      <div className="grid gap-4 xl:grid-cols-2">

        {/* Import Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Import</h2>
          <p className="mt-1 text-sm text-gray-500">
            Supports two file formats:
          </p>
          <ul className="mt-1 ml-4 text-sm text-gray-500 list-disc space-y-0.5">
            <li><strong>Full data sheet</strong> — columns like <code className="text-xs bg-gray-100 px-1 rounded">scheme_name · scheme_code · tr_1y · bm_1y …</code></li>
            <li><strong>Activation-only sheet</strong> — just <code className="text-xs bg-gray-100 px-1 rounded">scheme_code · is_active</code> — activates or deactivates matching schemes and keeps the manual module in sync</li>
          </ul>

          <div className="mt-4 space-y-4">
            <input
              type="file"
              accept=".xlsx,.xls,.csv,.json"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                importMutation.reset();
              }}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />

            <label className="flex items-center gap-3 text-sm font-medium text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={validateOnly}
                onChange={(e) => setValidateOnly(e.target.checked)}
              />
              Validate only (dry run — no DB changes)
            </label>

            <button
              type="button"
              onClick={handleImport}
              disabled={!file || importMutation.isPending}
              className="rounded-lg bg-[#043f79] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {importMutation.isPending ? "Processing…" : "Start Import"}
            </button>

            {/* ── Result Block ──────────────────────────────────────────── */}
            {importMutation.isSuccess && report && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
                <p className="font-semibold text-gray-800 mb-3">
                  {report.validateOnly ? "✅ Validation Result" : "✅ Import Result"}
                  <span className="ml-2 text-xs font-normal text-gray-500">
                    {report.fileName}
                  </span>
                </p>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  <span className="text-gray-600">Total Rows:</span>
                  <span className="font-bold text-gray-900">{report.totalRows ?? 0}</span>

                  {!report.validateOnly && (
                    <>
                      <span className="text-gray-600">New schemes inserted:</span>
                      <span className="font-bold text-green-700">{report.inserted ?? 0}</span>

                      <span className="text-gray-600">Existing schemes updated:</span>
                      <span className="font-bold text-blue-700">{report.updated ?? 0}</span>

                      <span className="text-gray-600 font-medium">Bridged → Manual module:</span>
                      <span className={`font-bold ${(report.activated ?? 0) > 0 ? "text-emerald-600" : "text-gray-400"}`}>
                        {report.activated ?? 0}
                      </span>

                      <span className="text-gray-600">Deactivated schemes:</span>
                      <span className={`font-bold ${(report.deactivated ?? 0) > 0 ? "text-slate-700" : "text-gray-400"}`}>
                        {report.deactivated ?? 0}
                      </span>

                      {(report.syncFailed ?? 0) > 0 && (
                        <>
                          <span className="text-red-700 font-medium">Failed to bridge to manual:</span>
                          <button
                            type="button"
                            onClick={() => setShowBridgeFailures(true)}
                            className="font-bold text-red-700 underline text-left"
                          >
                            {report.syncFailed} scheme{report.syncFailed !== 1 ? "s" : ""} — click to view
                          </button>
                        </>
                      )}

                      {(report.syncPartial ?? 0) > 0 && (
                        <>
                          <span className="text-orange-700 font-medium">Bridge partial (no AMC/category):</span>
                          <span className="font-bold text-orange-700">{report.syncPartial}</span>
                        </>
                      )}

                      <span className="text-gray-600">Skipped (no change):</span>
                      <span className="font-bold text-gray-500">{report.skipped ?? 0}</span>
                    </>
                  )}

                  <span className="text-gray-600">Rejected (errors):</span>
                  <span className={`font-bold ${(report.rejected ?? 0) > 0 ? "text-red-600" : "text-gray-400"}`}>
                    {report.rejected ?? 0}
                  </span>
                </div>

                {(report.activated ?? 0) > 0 && !report.validateOnly && (
                  <div className="mt-3 rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-800">
                    ✓ {report.activated} scheme{report.activated !== 1 ? "s" : ""} activated and bridged to the manual MF module (Mutual Funds → Fund listing).
                  </div>
                )}

                {(report.deactivated ?? 0) > 0 && !report.validateOnly && (
                  <div className="mt-3 rounded-md bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-700">
                    {report.deactivated} scheme{report.deactivated !== 1 ? "s" : ""} deactivated in the MF API and marked inactive in the manual MF module.
                  </div>
                )}

                {(report.syncPartial ?? 0) > 0 && !report.validateOnly && (
                  <div className="mt-3 rounded-md bg-orange-50 border border-orange-200 px-3 py-2 text-xs text-orange-800">
                    ⚠ {report.syncPartial} scheme{report.syncPartial !== 1 ? "s" : ""} were activated but could not be fully bridged because their AMC name or category is missing in the API data.
                    {" "}<strong>Fix</strong>: go to MF API → Dashboard → click <em>Sync Active</em>. The full API sync will fetch complete scheme data (including AMC and category) and bridge them properly.
                  </div>
                )}

                {!report.validateOnly && (
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        diagnoseMutation.mutate();
                        setShowDiagnose(true);
                      }}
                      disabled={diagnoseMutation.isPending}
                      className="text-xs rounded-md border border-gray-300 bg-white px-3 py-1.5 text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
                    >
                      {diagnoseMutation.isPending ? "Checking…" : "🔍 Diagnose Missing Schemes"}
                    </button>
                    <span className="text-xs text-gray-400">Finds active API schemes not yet in manual module</span>
                  </div>
                )}

                {(report.errors?.length ?? 0) > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-red-700 mb-1">Row errors:</p>
                    <ul className="text-xs text-red-600 space-y-0.5 max-h-28 overflow-y-auto bg-red-50 border border-red-100 rounded p-2">
                      {report.errors!.map((e, i) => (
                        <li key={i}>Row {e.row}: {e.message}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {importMutation.isError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                Import failed. Check the file format and try again.
              </div>
            )}
          </div>
        </div>

        {/* Export Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Export</h2>
          <p className="mt-1 text-sm text-gray-500">
            Download MF API schemes as a flat Excel file. Includes <code className="text-xs bg-gray-100 px-1 rounded">is_active</code> column — edit it and re-import to bulk-activate/deactivate schemes.
          </p>
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleExport(false)}
                disabled={exportMutation.isPending}
                className="rounded-lg bg-[#043f79] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 hover:bg-[#03305c] transition-colors"
              >
                {exportMutation.isPending ? "Exporting…" : "Download All Schemes (.xlsx)"}
              </button>
              <button
                type="button"
                onClick={() => handleExport(true)}
                disabled={exportMutation.isPending}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-60 hover:bg-gray-50 transition-colors"
              >
                {exportMutation.isPending ? "Exporting…" : "Download Active Only (.xlsx)"}
              </button>
            </div>
            <p className="text-xs text-gray-400">
              Tip: export all schemes → set <code className="bg-gray-100 px-1 rounded">is_active</code> to <code className="bg-gray-100 px-1 rounded">true</code> or <code className="bg-gray-100 px-1 rounded">false</code> → re-import to activate or deactivate them in bulk.
            </p>
          </div>
        </div>
      </div>

      {/* ── Bridge Failures Modal ───────────────────────────────────────── */}
      {showBridgeFailures && report?.bridgeFailed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Bridge Failures — {report.bridgeFailed.length} scheme{report.bridgeFailed.length !== 1 ? "s" : ""}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  These schemes were marked active but could not be populated in the manual MF module.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBridgeFailures(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none"
              >
                ✕
              </button>
            </div>
            {/* Scrollable list */}
            <div className="overflow-y-auto flex-1 px-5 py-3">
              <table className="w-full text-xs border-collapse">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 pr-3 text-gray-600 font-medium w-28">Scheme Code</th>
                    <th className="text-left py-2 pr-3 text-gray-600 font-medium">Scheme Name</th>
                    <th className="text-left py-2 text-gray-600 font-medium">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {report.bridgeFailed.map((f, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-red-50/40">
                      <td className="py-1.5 pr-3 font-mono text-gray-700">{f.scheme_code || "—"}</td>
                      <td className="py-1.5 pr-3 text-gray-700">{f.scheme_name || "—"}</td>
                      <td className="py-1.5 text-red-600">{f.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl flex items-center justify-between gap-3">
              <p className="text-xs text-gray-500">
                Fix: ensure these schemes have been synced from the external API (MF API → Dashboard → Sync All) so their AMC name and category are populated, then re-import the activation sheet.
              </p>
              <button
                type="button"
                onClick={() => setShowBridgeFailures(false)}
                className="shrink-0 rounded-lg bg-gray-800 px-4 py-2 text-xs font-medium text-white hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Diagnose Missing Schemes Modal ───────────────────────────────── */}
      {showDiagnose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  {diagnoseMutation.isPending
                    ? "Checking\u2026"
                    : diagnoseData
                    ? (diagnoseData.unbridged_count ?? 0) === 0
                      ? "All active schemes are bridged"
                      : `${diagnoseData.unbridged_count ?? 0} active schemes still missing from manual`
                    : "Diagnose Missing Schemes"}
                </h3>
                {diagnoseData && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Active in MF API: {diagnoseData.total_active} \u2022 Active manual bridges: {diagnoseData.total_bridged} \u2022 Gap: {diagnoseData.unbridged_count}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowDiagnose(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none"
              >
                \u2715
              </button>
            </div>
            {/* Body */}
            <div className="overflow-y-auto flex-1 px-5 py-3">
              {diagnoseMutation.isPending && (
                <p className="text-sm text-gray-500 py-6 text-center">Loading\u2026</p>
              )}
              {diagnoseMutation.isError && (
                <p className="text-sm text-red-600 py-6 text-center">Failed to load. Check server logs.</p>
              )}
              {diagnoseData?.unbridged?.length === 0 && (
                <p className="text-sm text-emerald-700 py-6 text-center font-medium">\u2713 All active schemes are bridged to the manual module.</p>
              )}
              {(diagnoseData?.unbridged?.length ?? 0) > 0 && (
                <table className="w-full text-xs border-collapse">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 pr-2 text-gray-600 font-medium w-24">Code</th>
                      <th className="text-left py-2 pr-2 text-gray-600 font-medium">Name</th>
                      <th className="text-left py-2 pr-2 text-gray-600 font-medium w-28">AMC</th>
                      <th className="text-left py-2 pr-2 text-gray-600 font-medium w-24">Category</th>
                      <th className="text-left py-2 text-gray-600 font-medium">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diagnoseData.unbridged.map((s: any, i: number) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-amber-50/40">
                        <td className="py-1.5 pr-2 font-mono text-gray-700">{s.scheme_code || "\u2014"}</td>
                        <td className="py-1.5 pr-2 text-gray-800">{s.scheme_name || "\u2014"}</td>
                        <td className="py-1.5 pr-2 text-gray-600">{s.amc_name || <span className="text-red-500 italic">missing</span>}</td>
                        <td className="py-1.5 pr-2 text-gray-600">{s.category || <span className="text-red-500 italic">missing</span>}</td>
                        <td className="py-1.5 text-amber-700 text-xs">{s.last_sync_error || s.sync_status || "\u2014"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl flex items-center justify-between gap-3">
              <p className="text-xs text-gray-500">
                {(diagnoseData?.unbridged_count ?? 0) === 0
                  ? "No action is needed. Every active MF API scheme already has a matching manual fund bridge."
                  : "Fix: go to MF API \u2192 Dashboard \u2192 Sync Active. Schemes with missing AMC/category will be re-fetched from the external API and then re-bridged automatically."}
              </p>
              <button
                type="button"
                onClick={() => setShowDiagnose(false)}
                className="shrink-0 rounded-lg bg-gray-800 px-4 py-2 text-xs font-medium text-white hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Top Holdings Template ─────────────────────────────────────────── */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Top Holdings Template</h2>
        <p className="mt-1 text-sm text-gray-500">
          Download a blank Excel to fill in top holdings manually. Upload it from the scheme detail page.
        </p>
        <div className="mt-4 flex items-start gap-4 flex-wrap">
          <button
            type="button"
            onClick={handleDownloadHoldingsTemplate}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Download Template (.xlsx)
          </button>
          <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 text-xs text-gray-500 font-mono flex-1 min-w-0">
            <span className="font-semibold text-gray-700 not-italic">Columns: </span>
            name · net_assets_pct · market_value · share_amount · share_change
            · sector · security_type · maturity · credit_quality_india · country
          </div>
        </div>
      </div>

      {/* ── Column reference ─────────────────────────────────────────────── */}
      <details className="rounded-lg border border-gray-100 bg-gray-50 p-3">
        <summary className="text-xs font-medium text-gray-700 cursor-pointer">
          Full import column reference (click to expand)
        </summary>
        <div className="mt-2 text-xs text-gray-500 space-y-1 font-mono">
          <p><strong>Identity:</strong> scheme_name · amc_name · scheme_code · isin · external_key · plan_type · option_type · category · sub_category</p>
          <p><strong>Trailing returns (fund):</strong> tr_1w · tr_1m · tr_3m · tr_6m · tr_1y · tr_2y · tr_3y · tr_5y · tr_10y · tr_since_launch · tr_ytd · tr_d1</p>
          <p><strong>Benchmark returns:</strong> bm_1w … bm_10y · bm_since_launch · bm_ytd · benchmark_name</p>
          <p><strong>Category avg:</strong> cat_1w … cat_10y · cat_since_launch · cat_ytd · category_name</p>
          <p><strong>Risk metrics:</strong> risk_sharpe_3y · risk_volatility_3y · risk_alpha_1y · risk_beta_1y · risk_sortino · risk_ytm · risk_avg_maturity</p>
          <p><strong>Market cap:</strong> mc_large_cap_pct · mc_mid_cap_pct · mc_small_cap_pct</p>
          <p><strong>Annual returns:</strong> ar_ytd · ar_2024 · ar_2023 · ar_2022 …</p>
          <p><strong>Activation shortcut:</strong> scheme_code + is_active (yes/true/1) — no other columns needed</p>
        </div>
      </details>
    </div>
  );
}
