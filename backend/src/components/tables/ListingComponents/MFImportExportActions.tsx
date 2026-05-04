import React, { useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiDownload,
  FiFileText,
  FiUpload,
  FiX,
} from "react-icons/fi";
import { axiosInstance } from "../../../api/axios";
import { toast } from "react-hot-toast";

export type MfImportEntity =
  | "main-categories"
  | "categories"
  | "amcs"
  | "funds"
  | "nfo"
  | "index-snapshots"
  | "top-holdings"
  | "full-workbook";

type ExportMode = "data" | "template";

type EntityOption = {
  value: MfImportEntity;
  label: string;
};

type ImportSection = {
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
};

type ImportSummary = {
  mainCategories: ImportSection;
  categories: ImportSection;
  amcs: ImportSection;
  funds: ImportSection;
  nfos: ImportSection;
  indexSnapshots: ImportSection;
  topHoldings: ImportSection;
};

type ImportReport = {
  fileName: string;
  entity: MfImportEntity;
  validateOnly: boolean;
  processedSheets: string[];
  summary: ImportSummary;
  errorCount: number;
  errors: Array<{
    sheet: string;
    row: number;
    message: string;
    identifier?: string;
  }>;
  previewSheets?: Array<{
    sheet: string;
    headers: string[];
    rows: Record<string, unknown>[];
  }>;
};

type Props = {
  role: string;
  options: EntityOption[];
  onImported?: () => void | Promise<void>;
  selectedEntity?: MfImportEntity;
  onEntityChange?: (entity: MfImportEntity) => void;
  forceOpenKey?: number;
  trailingActions?: React.ReactNode;
};

const emptyReport: ImportReport | null = null;

const entityGuidance: Record<
  MfImportEntity,
  { title: string; items: string[] }
> = {
  "main-categories": {
    title: "Main category import tips",
    items: [
      "Download the template first so the correct sheet name and columns are preserved.",
      "Keep each main category name unique inside the file.",
      "Use `is_active` as Yes or No for easier spreadsheet editing.",
    ],
  },
  categories: {
    title: "Category import tips",
    items: [
      "Each category must map to an existing main category name or id.",
      "If you are creating dependencies together, use the full workbook template or import main categories first.",
      "Use the new workbook columns for trailing, YTD, and annual benchmark returns.",
      "Category averages are recalculated from active scheme data when funds are imported or updated.",
    ],
  },
  amcs: {
    title: "AMC import tips",
    items: [
      "Each AMC name should be unique in the file.",
      "Use the template and keep `is_active` as Yes or No.",
      "If funds reference a new AMC, import AMCs first or use the full workbook flow.",
    ],
  },
  funds: {
    title: "Fund import tips",
    items: [
      "`scheme_code` is mandatory and is used for strict matching during updates.",
      "Each fund must resolve to an existing AMC and category by name or id.",
      "The primary workbook format is `Scheme_Details` with trailing, YTD, annual year columns, and duplicate SheetJS-safe headers such as `YTD_1` and `2025_1`.",
      "Use the dedicated Top Holdings module for detailed holdings workbooks. The legacy `top_holdings` fund column is still normalized when present.",
    ],
  },
  nfo: {
    title: "NFO import tips",
    items: [
      "`nfo_id` is mandatory and is used for strict matching during updates.",
      "Each NFO must resolve to an existing AMC and category by name or id.",
      "Make sure `subscription_end_date` is on or after `subscription_start_date`.",
    ],
  },
  "index-snapshots": {
    title: "Index snapshot import tips",
    items: [
      "`benchmark_index_name` and `last_updated_date` are required for matching.",
      "Category is optional, but linking one improves reporting clarity.",
      "Use one row per benchmark per date.",
    ],
  },
  "top-holdings": {
    title: "Top holdings import tips",
    items: [
      "You can import the client workbook layout with Holdings Summary and Holdings Detail sections.",
      "Percentage cells are read from their displayed values, so 12.98% stays 12.98 during import.",
      "Export downloads a flat `Top_Holdings` sheet that can also be re-imported later.",
    ],
  },
  "full-workbook": {
    title: "Full workbook import tips",
    items: [
      "This is the safest option when the workbook contains related entities together.",
      "Sheets are processed in dependency order: main categories, categories, AMCs, funds, NFOs, then index snapshots.",
      "Use the full workbook template when preparing data for a first-time bulk import.",
    ],
  },
};

const totalChanges = (summary: ImportSummary) =>
  Object.values(summary).reduce(
    (acc, section) => ({
      inserted: acc.inserted + section.inserted,
      updated: acc.updated + section.updated,
      skipped: acc.skipped + section.skipped,
      errors: acc.errors + section.errors,
    }),
    { inserted: 0, updated: 0, skipped: 0, errors: 0 },
  );

export default function MFImportExportActions({
  role,
  options,
  onImported,
  selectedEntity: propSelectedEntity,
  onEntityChange,
  forceOpenKey,
  trailingActions,
}: Props) {
  const [selectedEntity, setSelectedEntity] = useState<MfImportEntity>(
    propSelectedEntity || options[0]?.value || "funds",
  );
  const currentSelectedEntity = propSelectedEntity ?? selectedEntity;
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<ImportReport | null>(emptyReport);
  const [importError, setImportError] = useState<string | null>(null);
  const [inlineNotice, setInlineNotice] = useState<{
    tone: "success" | "warning" | "error";
    title: string;
    message: string;
  } | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [validatedFileKey, setValidatedFileKey] = useState<string | null>(null);

  const selectedLabel = useMemo(
    () =>
      options.find((option) => option.value === currentSelectedEntity)?.label ||
      "Selected",
    [options, currentSelectedEntity],
  );

  const guidance =
    entityGuidance[currentSelectedEntity] || entityGuidance["full-workbook"];

  const currentFileKey = file
    ? `${currentSelectedEntity}::${file.name}::${file.size}::${file.lastModified}`
    : null;
  const hasValidationErrors = Boolean(report && report.errorCount > 0);
  const isValidatedForCurrentFile =
    Boolean(currentFileKey) && validatedFileKey === currentFileKey;
  const canConfirmImport =
    Boolean(file) &&
    Boolean(report) &&
    Boolean(currentFileKey) &&
    isValidatedForCurrentFile &&
    report?.validateOnly === true &&
    report?.errorCount === 0;

  React.useEffect(() => {
    if (!forceOpenKey) return;
    setIsImportOpen(true);
  }, [forceOpenKey]);

  const closeImportDialog = () => {
    setIsImportOpen(false);
    setFile(null);
    setReport(null);
    setImportError(null);
    setInlineNotice(null);
    setValidatedFileKey(null);
  };

  const submitImport = async (validateOnly: boolean) => {
    if (!file) {
      setImportError("Please choose an Excel file first.");
      setInlineNotice({
        tone: "error",
        title: "",
        message: "Choose an Excel file before validating or importing.",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("entity", currentSelectedEntity);
    formData.append("validateOnly", String(validateOnly));

    if (validateOnly) setIsValidating(true);
    else setIsImporting(true);
    setImportError(null);
    setReport(null);
    setInlineNotice(null);

    try {
      const importEndpoint =
        currentSelectedEntity === "top-holdings"
          ? `/${role}/mf/top-holdings/import`
          : `/${role}/mf/import/excel`;
      const response = await axiosInstance.post<{
        data: ImportReport;
        message: string;
      }>(importEndpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const nextReport = response.data?.data;
      setReport(nextReport);
      if (validateOnly) {
        setValidatedFileKey(
          nextReport?.errorCount === 0 && currentFileKey
            ? currentFileKey
            : null,
        );
      }
      setInlineNotice({
        tone: nextReport?.errorCount > 0 ? "warning" : "success",
        title:
          nextReport?.errorCount > 0
            ? validateOnly
              ? "Validation found issues"
              : "Import completed with issues"
            : validateOnly
              ? "Validation completed"
              : "Import completed",
        message: validateOnly
          ? nextReport?.errorCount > 0
            ? "Review the validation summary, preview, and error report before importing."
            : "Validation passed. You can confirm the import now."
          : "The file has been imported successfully. The table will refresh with the latest data.",
      });

      if (!validateOnly && onImported) {
        setValidatedFileKey(null);
        await onImported();
      }
    } catch (error: any) {
      const nextReport = error?.response?.data?.data as
        | ImportReport
        | undefined;
      const message =
        error?.response?.data?.message || error?.message || "Import failed";
      setImportError(message);
      if (nextReport) {
        setReport(nextReport);
      }
      if (validateOnly || nextReport?.errorCount) {
        setValidatedFileKey(null);
      }
      setInlineNotice({
        tone: nextReport ? "warning" : "error",
        title: nextReport ? "Import blocked" : "",
        message: nextReport
          ? "Validation issues were found. Review the summary below before trying again."
          : message,
      });
    } finally {
      if (validateOnly) setIsValidating(false);
      else setIsImporting(false);
    }
  };

  const handleExport = async (mode: ExportMode) => {
    setIsExporting(true);
    try {
      const response = await axiosInstance.get(`/${role}/mf/export/excel`, {
        params: { entity: currentSelectedEntity, mode },
        responseType: "blob",
      });
      const blob = new Blob([response.data], {
        type:
          response.headers["content-type"] ||
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const disposition = String(response.headers["content-disposition"] || "");
      const filenameMatch = disposition.match(/filename="([^"]+)"/i);
      const filename =
        filenameMatch?.[1] || `mf-${currentSelectedEntity}-${mode}.xlsx`;
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      toast.success(
        mode === "template"
          ? "Template download started."
          : "Data export started.",
      );
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || error?.message || "Export failed",
      );
    } finally {
      setIsExporting(false);
    }
  };

  const downloadErrorReport = () => {
    if (!report || report.errors.length === 0) return;
    const lines = [
      ["sheet", "row", "identifier", "message"].join(","),
      ...report.errors.map((item) =>
        [item.sheet, String(item.row), item.identifier || "", item.message]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${report.fileName.replace(/\.(xlsx|xls)$/i, "")}-validation-errors.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  };

  const summaryTotals = report ? totalChanges(report.summary) : null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {options.length > 1 && !propSelectedEntity && (
          <select
            value={currentSelectedEntity}
            onChange={(event) => {
              const newEntity = event.target.value as MfImportEntity;
              setSelectedEntity(newEntity);
              onEntityChange?.(newEntity);
              setReport(null);
              setImportError(null);
              setInlineNotice(null);
              setValidatedFileKey(null);
              setFile(null);
            }}
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 focus:border-[#043f79] focus:outline-none"
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
        <button
          type="button"
          onClick={() => setIsImportOpen(true)}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#043f79] px-4 text-sm font-medium text-[#043f79] transition hover:bg-blue-50"
        >
          <FiUpload />
          Import
        </button>

        <button
          type="button"
          onClick={() => void handleExport("data")}
          disabled={isExporting}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FiDownload />
          {isExporting ? "Preparing..." : "Export"}
        </button>

        {trailingActions}

        {/* {!propSelectedEntity && (
          <button
            type="button"
            onClick={() => void handleExport("template")}
            disabled={isExporting}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#043f79] px-4 text-sm font-medium text-white transition hover:bg-[#032d57] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiFileText />
            {isExporting ? "Preparing..." : "Download Template"}
          </button>
        )} */}
      </div>

      {isImportOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 px-4">
          <div className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="shrink-0 p-6 pb-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Import {selectedLabel}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Upload the Excel file, validate it, review the parsed
                    preview, and then confirm the import when everything looks
                    right.
                  </p>
                  <p className="mt-2 text-xs font-medium uppercase tracking-wide text-[#043f79]">
                    Start with the template if a new client sheet is being
                    prepared.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeImportDialog}
                  aria-label="Close import dialog"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                >
                  <FiX className="text-lg" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
              <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      File Selection
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      Importing into{" "}
                      <span className="font-medium text-gray-900">
                        {selectedLabel}
                      </span>
                    </p>
                  </div>
                  <div className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#043f79] ring-1 ring-[#043f79]/15">
                    Excel only
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <label
                      htmlFor="mf-import-file"
                      className="inline-flex h-11 cursor-pointer items-center justify-center rounded-lg bg-[#043f79] px-4 text-sm font-medium text-white transition hover:bg-[#032d57]"
                    >
                      Choose File
                    </label>
                    <div className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                      <span
                        className={file ? "text-gray-900" : "text-gray-500"}
                      >
                        {file ? file.name : "No file chosen"}
                      </span>
                    </div>
                  </div>
                  <input
                    id="mf-import-file"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(event) => {
                      setFile(event.target.files?.[0] || null);
                      setReport(null);
                      setImportError(null);
                      setInlineNotice(null);
                      setValidatedFileKey(null);
                    }}
                    className="sr-only"
                  />
                  <p className="mt-3 text-xs text-gray-500">
                    Upload a valid `.xlsx` or `.xls` file for the selected
                    import type. The latest MF template preserves duplicate
                    workbook headers required by the client format.
                  </p>
                </div>

                <div className="mt-4 rounded-xl bg-white p-4 ring-1 ring-gray-200">
                  <p className="text-sm font-medium text-gray-900">
                    {guidance.title}
                  </p>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    {guidance.items.map((item) => (
                      <p key={item}>{item}</p>
                    ))}
                    <p>
                      Confirm import is enabled only after validation passes for
                      the currently selected file.
                    </p>
                  </div>
                </div>
              </div>

              {inlineNotice && (
                <div
                  className={`mt-5 rounded-xl border p-4 ${
                    inlineNotice.tone === "error"
                      ? "border-red-200 bg-red-50"
                      : inlineNotice.tone === "warning"
                        ? "border-amber-200 bg-amber-50"
                        : "border-emerald-200 bg-emerald-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 text-lg ${
                        inlineNotice.tone === "error"
                          ? "text-red-600"
                          : inlineNotice.tone === "warning"
                            ? "text-amber-600"
                            : "text-emerald-600"
                      }`}
                    >
                      {inlineNotice.tone === "success" ? (
                        <FiCheckCircle />
                      ) : (
                        <FiAlertCircle />
                      )}
                    </div>
                    <div>
                      {inlineNotice.title ? (
                        <p
                          className={`text-sm font-semibold ${
                            inlineNotice.tone === "error"
                              ? "text-red-900"
                              : inlineNotice.tone === "warning"
                                ? "text-amber-900"
                                : "text-emerald-900"
                          }`}
                        >
                          {inlineNotice.title}
                        </p>
                      ) : null}
                      <p
                        className={`${inlineNotice.title ? "mt-1" : ""} text-sm ${
                          inlineNotice.tone === "error"
                            ? "text-red-800"
                            : inlineNotice.tone === "warning"
                              ? "text-amber-800"
                              : "text-emerald-800"
                        }`}
                      >
                        {inlineNotice.message}
                      </p>
                      {importError ? (
                        <p className="mt-2 text-xs text-red-700">
                          {importError}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-5 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => void submitImport(true)}
                  disabled={!file || isValidating || isImporting}
                  className="h-10 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isValidating ? "Validating..." : "Validate"}
                </button>
                <button
                  type="button"
                  onClick={() => void submitImport(false)}
                  disabled={!canConfirmImport || isImporting || isValidating}
                  className="h-10 rounded-lg bg-[#043f79] px-4 text-sm font-medium text-white transition hover:bg-[#032d57] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isImporting ? "Importing..." : "Confirm Import"}
                </button>
              </div>

              {file && !canConfirmImport && !isImporting ? (
                <p className="mt-3 text-sm text-amber-700">
                  {hasValidationErrors
                    ? "Fix the validation issues, then validate the same file again before importing."
                    : "Run validation on this file before confirming the import."}
                </p>
              ) : null}

              {report && summaryTotals && (
                <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700">
                    <span>
                      <strong>File:</strong> {report.fileName}
                    </span>
                    <span>
                      <strong>Sheets:</strong>{" "}
                      {report.processedSheets.join(", ") || "-"}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
                      <div className="font-medium">Inserted</div>
                      <div className="mt-1 text-lg font-semibold">
                        {summaryTotals.inserted}
                      </div>
                    </div>
                    <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
                      <div className="font-medium">Updated</div>
                      <div className="mt-1 text-lg font-semibold">
                        {summaryTotals.updated}
                      </div>
                    </div>
                    <div className="rounded-lg bg-gray-100 p-3 text-sm text-gray-800">
                      <div className="font-medium">Skipped</div>
                      <div className="mt-1 text-lg font-semibold">
                        {summaryTotals.skipped}
                      </div>
                    </div>
                    <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
                      <div className="font-medium">Errors</div>
                      <div className="mt-1 text-lg font-semibold">
                        {summaryTotals.errors}
                      </div>
                    </div>
                  </div>

                  {report.previewSheets && report.previewSheets.length > 0 && (
                    <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-medium text-gray-900">
                          Parsed preview
                        </p>
                        <p className="text-xs text-gray-500">
                          First few parsed rows after header matching
                        </p>
                      </div>
                      <div className="mt-4 space-y-4">
                        {report.previewSheets.map((preview) => (
                          <div
                            key={preview.sheet}
                            className="rounded-lg border border-gray-200 bg-white p-3"
                          >
                            <p className="text-sm font-semibold text-gray-900">
                              {preview.sheet}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              Headers: {preview.headers.join(", ") || "-"}
                            </p>
                            <div className="mt-3 overflow-x-auto">
                              <table className="min-w-full text-left text-xs text-gray-700">
                                <thead>
                                  <tr className="border-b border-gray-200">
                                    {preview.headers
                                      .slice(0, 6)
                                      .map((header) => (
                                        <th
                                          key={header}
                                          className="px-2 py-2 font-medium text-gray-600"
                                        >
                                          {header}
                                        </th>
                                      ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {preview.rows
                                    .slice(0, 3)
                                    .map((row, rowIndex) => (
                                      <tr
                                        key={`${preview.sheet}-${rowIndex}`}
                                        className="border-b border-gray-100 last:border-b-0"
                                      >
                                        {preview.headers
                                          .slice(0, 6)
                                          .map((header) => (
                                            <td
                                              key={header}
                                              className="px-2 py-2 align-top"
                                            >
                                              {String(row[header] ?? "-")}
                                            </td>
                                          ))}
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {report.errors.length > 0 && (
                    <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-medium text-red-900">
                          Validation issues
                        </p>
                        <button
                          type="button"
                          onClick={downloadErrorReport}
                          className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-100"
                        >
                          <FiDownload />
                          Download Error Report
                        </button>
                      </div>
                      <div className="mt-3 max-h-56 space-y-2 overflow-auto text-sm text-red-800">
                        {report.errors.slice(0, 50).map((item, index) => (
                          <div key={`${item.sheet}-${item.row}-${index}`}>
                            {item.sheet} row {item.row}: {item.message}
                            {item.identifier ? ` (${item.identifier})` : ""}
                          </div>
                        ))}
                      </div>
                      {report.errors.length > 50 ? (
                        <p className="mt-3 text-xs text-red-700">
                          Showing the first 50 issues here. Download the error
                          report for the full validation list.
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
