import { useState } from "react";
import { useParams } from "react-router-dom";

import PageHeader from "../components/PageHeader";
import { useMfApiExport, useMfApiImport, useMfApiResyncToManual } from "../hooks";
import * as XLSX from "xlsx";
import { downloadBlob } from "../utils";

export default function MfApiImportExportPage() {
  const { role = "admin" } = useParams();
  const [file, setFile] = useState<File | null>(null);
  const [validateOnly, setValidateOnly] = useState(true);
  const importMutation = useMfApiImport(role);
  const exportMutation = useMfApiExport(role);
  const resyncMutation = useMfApiResyncToManual(role);

  const report = importMutation.data;

  const handleImport = () => {
    if (!file) return;
    importMutation.mutate({ file, validateOnly });
  };

  const handleExport = async () => {
    const response = await exportMutation.mutateAsync();
    downloadBlob(
      response.data,
      `mf-api-export-${new Date().toISOString().slice(0, 10)}.xlsx`,
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
            <li><strong>Activation-only sheet</strong> — just <code className="text-xs bg-gray-100 px-1 rounded">scheme_code · is_active</code> — activates matching schemes and bridges them to the manual module</li>
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
                    ✓ {report.activated} scheme{report.activated !== 1 ? "s" : ""} activated and queued to sync to the manual MF module (Mutual Funds → Fund listing).
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
            Download all MF API schemes as a flat Excel file. Includes <code className="text-xs bg-gray-100 px-1 rounded">is_active</code> column — edit it and re-import to bulk-activate/deactivate schemes.
          </p>
          <div className="mt-4 space-y-3">
            <button
              type="button"
              onClick={handleExport}
              disabled={exportMutation.isPending}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-60 hover:bg-gray-50 transition-colors"
            >
              {exportMutation.isPending ? "Exporting…" : "Download Export (.xlsx)"}
            </button>
            <p className="text-xs text-gray-400">
              Tip: export → set <code className="bg-gray-100 px-1 rounded">is_active</code> to <code className="bg-gray-100 px-1 rounded">true</code> for the schemes you want → re-import to activate them all at once.
            </p>
          </div>
        </div>
      </div>

      {/* ── Re-sync All Active to Manual ──────────────────────────────────── */}
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Re-sync Active Schemes → Manual Module</h2>
        <p className="mt-1 text-sm text-gray-600">
          Forces every currently-active MF API scheme to push its data into the manual <strong>Mutual Funds</strong> module (<code className="text-xs bg-white/60 px-1 rounded">mfschemes</code> collection). Run this if schemes appear active in MF API but are missing or stale in the manual listing.
        </p>
        <div className="mt-4">
          <button
            type="button"
            onClick={() => resyncMutation.mutate()}
            disabled={resyncMutation.isPending}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
          >
            {resyncMutation.isPending ? "Starting re-sync…" : "Re-sync All Active → Manual"}
          </button>
          {resyncMutation.isSuccess && (
            <p className="mt-2 text-sm text-emerald-800 font-medium">
              ✓ Re-sync started — runs in the background. Check the manual Funds listing in a moment.
            </p>
          )}
          {resyncMutation.isError && (
            <p className="mt-2 text-sm text-red-700">Re-sync failed. See server logs.</p>
          )}
        </div>
      </div>

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
