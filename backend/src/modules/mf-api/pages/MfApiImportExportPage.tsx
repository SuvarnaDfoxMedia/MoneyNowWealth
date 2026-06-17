import { useState } from "react";
import { useParams } from "react-router-dom";

import PageHeader from "../components/PageHeader";
import { useMfApiExport, useMfApiImport } from "../hooks";
import * as XLSX from "xlsx";
import { downloadBlob } from "../utils";

export default function MfApiImportExportPage() {
  const { role = "admin" } = useParams();
  const [file, setFile] = useState<File | null>(null);
  const [validateOnly, setValidateOnly] = useState(true);
  const importMutation = useMfApiImport(role);
  const exportMutation = useMfApiExport(role);

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
    <div className="min-h-screen bg-gray-50 p-4">
      <PageHeader
        title="Import / Export"
        description="Keep this workflow separate from the existing MF import/export screens."
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Import</h2>
          <p className="mt-1 text-sm text-gray-500">
            Upload a file to validate or import isolated MF API data.
          </p>

          <div className="mt-4 space-y-4">
            <input
              type="file"
              accept=".xlsx,.xls,.csv,.json"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />

            <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={validateOnly}
                onChange={(event) => setValidateOnly(event.target.checked)}
              />
              Validate only
            </label>

            <button
              type="button"
              onClick={handleImport}
              disabled={!file || importMutation.isPending}
              className="rounded-lg bg-[#043f79] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {importMutation.isPending ? "Importing..." : "Start Import"}
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Export</h2>
          <p className="mt-1 text-sm text-gray-500">
            Export the isolated MF API dataset without touching the legacy MF flow.
          </p>

          <div className="mt-4 space-y-4">
            <button
              type="button"
              onClick={handleExport}
              disabled={exportMutation.isPending}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {exportMutation.isPending ? "Exporting..." : "Download Export"}
            </button>
          </div>
        </div>
      </div>

      {/* Top Holdings Template card */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm xl:col-span-2">
        <h2 className="text-lg font-semibold text-gray-900">Top Holdings Template</h2>
        <p className="mt-1 text-sm text-gray-500">
          Download a blank Excel file to fill in top holdings manually. Upload it from the
          scheme detail page under the <strong>Top Holdings</strong> tab.
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

      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900">Latest Import State</h3>
        <p className="mt-2 text-sm text-gray-600">
          {file ? `Selected file: ${file.name}` : "No file selected yet."}
        </p>
        <p className="mt-1 text-sm text-gray-600">
          Validate only: {validateOnly ? "Yes" : "No"}
        </p>
      </div>

      <details className="mt-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
        <summary className="text-xs font-medium text-gray-700 cursor-pointer">
          Column reference (click to expand)
        </summary>
        <div className="mt-2 text-xs text-gray-500 space-y-1 font-mono">
          <p>scheme_name · amc_name · scheme_code · isin · external_key</p>
          <p>plan_type · option_type · category · sub_category</p>
          <p>tr_1w · tr_1m · tr_3m · tr_6m · tr_1y · tr_2y · tr_3y · tr_5y · tr_10y · tr_since_launch · tr_ytd · tr_d1</p>
          <p>bm_1w ... bm_10y · bm_since_launch · bm_ytd (benchmark returns)</p>
          <p>cat_1w ... cat_10y · cat_since_launch · cat_ytd (category avg)</p>
          <p>risk_sharpe_3y · risk_volatility_3y · risk_alpha_1y · risk_beta_1y · risk_sortino · risk_ytm · risk_avg_maturity</p>
          <p>mc_large_cap_pct · mc_mid_cap_pct · mc_small_cap_pct</p>
          <p>ar_ytd · ar_2024 · ar_2023 · ar_2022 (and earlier years)</p>
        </div>
      </details>
    </div>
  );
}
