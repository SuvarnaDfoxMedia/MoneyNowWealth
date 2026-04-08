import React, { useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiDownload,
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
  | "full-workbook";

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
};

type Props = {
  role: string;
  options: EntityOption[];
  onImported?: () => void | Promise<void>;
};

const emptyReport: ImportReport | null = null;

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
}: Props) {
  const [selectedEntity, setSelectedEntity] = useState<MfImportEntity>(
    options[0]?.value || "funds",
  );
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
      options.find((option) => option.value === selectedEntity)?.label ||
      "Selected",
    [options, selectedEntity],
  );

  const currentFileKey = file
    ? `${selectedEntity}::${file.name}::${file.size}::${file.lastModified}`
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
    formData.append("entity", selectedEntity);
    formData.append("validateOnly", String(validateOnly));

    if (validateOnly) setIsValidating(true);
    else setIsImporting(true);
    setImportError(null);
    setReport(null);
    setInlineNotice(null);

    try {
      const response = await axiosInstance.post<{
        data: ImportReport;
        message: string;
      }>(`/${role}/mf/import/excel`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const nextReport = response.data?.data;
      setReport(nextReport);
      if (validateOnly) {
        setValidatedFileKey(
          nextReport?.errorCount === 0 && currentFileKey ? currentFileKey : null,
        );
      }
      setInlineNotice({
        tone:
          nextReport?.errorCount > 0
            ? "warning"
            : "success",
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
            ? "Review the validation summary and fix the issues before importing."
            : "Validation passed. You can confirm the import now."
          : "The file has been imported successfully. The table will refresh with the latest data.",
      });

      if (!validateOnly && onImported) {
        setValidatedFileKey(null);
        await onImported();
      }
    } catch (error: any) {
      const nextReport = error?.response?.data?.data as ImportReport | undefined;
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

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await axiosInstance.get(`/${role}/mf/export/excel`, {
        params: { entity: selectedEntity },
        responseType: "blob",
      });
      const blob = new Blob([response.data], {
        type:
          response.headers["content-type"] ||
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const disposition = String(response.headers["content-disposition"] || "");
      const filenameMatch = disposition.match(/filename="([^"]+)"/i);
      const filename = filenameMatch?.[1] || `mf-${selectedEntity}.xlsx`;
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Export started.");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || error?.message || "Export failed",
      );
    } finally {
      setIsExporting(false);
    }
  };

  const summaryTotals = report ? totalChanges(report.summary) : null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {options.length > 1 && (
          <select
            value={selectedEntity}
            onChange={(event) => {
              setSelectedEntity(event.target.value as MfImportEntity);
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
          onClick={() => void handleExport()}
          disabled={isExporting}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#043f79] px-4 text-sm font-medium text-white transition hover:bg-[#032d57] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FiDownload />
          {isExporting ? "Exporting..." : "Export"}
        </button>
      </div>

      {isImportOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 px-4">
          <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="shrink-0 p-6 pb-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Import {selectedLabel}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Upload the Excel file, review the validation summary, and
                    then confirm the import when everything looks right.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsImportOpen(false);
                    setFile(null);
                    setReport(null);
                    setImportError(null);
                    setInlineNotice(null);
                    setValidatedFileKey(null);
                  }}
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
                    import type.
                  </p>
                </div>

                <div className="mt-4 rounded-xl bg-white p-4 ring-1 ring-gray-200">
                  <p className="text-sm font-medium text-gray-900">
                    File requirements
                  </p>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <p>
                      Funds require `scheme_code` and NFOs require `nfo_id` for
                      strict matching.
                    </p>
                    <p>
                      Use the exported sample for the selected type so the
                      correct sheet names and columns are preserved.
                    </p>
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
                      {inlineNotice.tone === "error" ? (
                        <FiAlertCircle />
                      ) : inlineNotice.tone === "warning" ? (
                        <FiAlertCircle />
                      ) : (
                        <FiCheckCircle />
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

                  {report.errors.length > 0 && (
                    <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4">
                      <p className="text-sm font-medium text-red-900">
                        Validation issues
                      </p>
                      <div className="mt-3 max-h-56 space-y-2 overflow-auto text-sm text-red-800">
                        {report.errors.slice(0, 50).map((item, index) => (
                          <div key={`${item.sheet}-${item.row}-${index}`}>
                            {item.sheet} row {item.row}: {item.message}
                            {item.identifier ? ` (${item.identifier})` : ""}
                          </div>
                        ))}
                      </div>
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
