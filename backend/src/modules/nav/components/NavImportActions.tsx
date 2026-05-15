import { useRef, useState } from "react";
import { toast } from "react-hot-toast";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiDownload,
  FiUpload,
  FiX,
} from "react-icons/fi";
import type { UploadReport } from "../types";
import { useNavUpload } from "../hooks";
import { exportNavFile } from "../api";

type NavImportActionsProps = {
  role: string;
  onImported?: () => void | Promise<void>;
};

const getErrorReport = (error: unknown) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    return (error as { response?: { data?: { data?: UploadReport; message?: string } } })
      .response?.data;
  }
  return undefined;
};

export default function NavImportActions({ role, onImported }: NavImportActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<UploadReport | null>(null);
  const [notice, setNotice] = useState<{
    tone: "success" | "warning" | "error";
    message: string;
  } | null>(null);
  const [validatedFileKey, setValidatedFileKey] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadMutation = useNavUpload(role);
  const currentFileKey = file
    ? `${file.name}::${file.size}::${file.lastModified}`
    : null;
  const canConfirmImport =
    Boolean(file) &&
    Boolean(currentFileKey) &&
    validatedFileKey === currentFileKey &&
    report?.validateOnly === true &&
    report.rejected === 0 &&
    report.errors.length === 0;

  const resetDialog = () => {
    setFile(null);
    setReport(null);
    setNotice(null);
    setValidatedFileKey(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const closeDialog = () => {
    setIsOpen(false);
    resetDialog();
  };

  const submitImport = async (validateOnly: boolean) => {
    if (!file) {
      setNotice({ tone: "error", message: "Choose a NAV file before importing." });
      return;
    }

    setNotice(null);
    setReport(null);

    try {
      const response = await uploadMutation.mutateAsync({
        file,
        validateOnly,
      });
      const nextReport = response.data ?? null;
      setReport(nextReport);
      if (validateOnly) {
        setValidatedFileKey(nextReport?.errors.length === 0 && currentFileKey ? currentFileKey : null);
      } else {
        setValidatedFileKey(null);
      }
      setNotice({
        tone: "success",
        message:
          response.message ||
          (validateOnly
            ? "NAV file validated successfully."
            : "NAV import completed successfully."),
      });
      if (!validateOnly) {
        await onImported?.();
      }
    } catch (error) {
      const errorResponse = getErrorReport(error);
      setReport(errorResponse?.data ?? null);
      setValidatedFileKey(null);
      setNotice({
        tone: errorResponse?.data ? "warning" : "error",
        message: errorResponse?.message || "NAV import failed.",
      });
    }
  };

  const downloadErrorReport = () => {
    if (!report?.errors.length) return;
    const lines = [
      ["row", "identifier", "message"].join(","),
      ...report.errors.map((item) =>
        [String(item.row), item.identifier || "", item.message]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${report.fileName.replace(/\.(xlsx|xls|csv)$/i, "")}-nav-errors.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await exportNavFile(role);
      const blob = new Blob([response.data], {
        type:
          response.headers["content-type"] ||
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const disposition = String(response.headers["content-disposition"] || "");
      const filenameMatch = disposition.match(/filename="([^"]+)"/i);
      const filename = filenameMatch?.[1] || "nav-history-export.xlsx";
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      toast.success("NAV export started.");
    } catch {
      toast.error("NAV export failed.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#043f79] px-4 text-sm font-medium text-white shadow-sm transition hover:bg-[#032d57]"
        >
          <FiUpload />
          Import
        </button>
        <button
          type="button"
          onClick={() => void handleExport()}
          disabled={isExporting}
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FiDownload />
          {isExporting ? "Preparing..." : "Export"}
        </button>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 px-4">
          <div className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="shrink-0 p-6 pb-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Import NAV
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Validate the client workbook first, then confirm import when
                    the report has no rejected rows.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeDialog}
                  aria-label="Close import dialog"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                >
                  <FiX className="text-lg" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
              <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="grid gap-4">
                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <label
                        htmlFor="nav-import-file"
                        className="inline-flex h-11 cursor-pointer items-center justify-center rounded-lg bg-[#043f79] px-4 text-sm font-medium text-white transition hover:bg-[#032d57]"
                      >
                        Choose File
                      </label>
                      <div className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                        <span className={file ? "text-gray-900" : "text-gray-500"}>
                          {file ? file.name : "No file chosen"}
                        </span>
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      id="nav-import-file"
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={(event) => {
                        setFile(event.target.files?.[0] ?? null);
                        setReport(null);
                        setNotice(null);
                        setValidatedFileKey(null);
                      }}
                      className="sr-only"
                    />
                    <p className="mt-3 text-xs text-gray-500">
                      Supports one-scheme-per-sheet client files with ISIN,
                      Date and NAV, plus formula sheets with assets,
                      liabilities and units.
                    </p>
                  </div>
                </div>
              </div>

              {notice ? (
                <div
                  className={`mt-5 rounded-xl border p-4 ${
                    notice.tone === "error"
                      ? "border-red-200 bg-red-50 text-red-800"
                      : notice.tone === "warning"
                        ? "border-amber-200 bg-amber-50 text-amber-800"
                        : "border-emerald-200 bg-emerald-50 text-emerald-800"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-lg">
                      {notice.tone === "success" ? <FiCheckCircle /> : <FiAlertCircle />}
                    </span>
                    <p className="text-sm font-medium">{notice.message}</p>
                  </div>
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={resetDialog}
                  className="h-10 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => void submitImport(true)}
                  disabled={!file || uploadMutation.isPending}
                  className="h-10 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploadMutation.isPending ? "Working..." : "Validate"}
                </button>
                <button
                  type="button"
                  onClick={() => void submitImport(false)}
                  disabled={!canConfirmImport || uploadMutation.isPending}
                  className="h-10 rounded-lg bg-[#043f79] px-4 text-sm font-medium text-white transition hover:bg-[#032d57] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploadMutation.isPending ? "Importing..." : "Confirm Import"}
                </button>
              </div>

              {file && !canConfirmImport ? (
                <p className="mt-3 text-sm text-amber-700">
                  Validate the selected file before confirming the NAV import.
                </p>
              ) : null}

              {report ? (
                <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {[
                      ["Inserted", report.inserted, "text-emerald-700"],
                      ["Updated", report.updated, "text-blue-700"],
                      ["Skipped", report.skipped, "text-gray-700"],
                      ["Rejected", report.rejected, "text-red-700"],
                    ].map(([label, value, className]) => (
                      <div key={String(label)} className="rounded-lg bg-gray-50 p-3 text-sm">
                        <p className="text-gray-500">{label}</p>
                        <p className={`mt-1 font-semibold ${className}`}>{value}</p>
                      </div>
                    ))}
                  </div>

                  {(typeof report.totalRows === "number" ||
                    typeof report.validRows === "number") && (
                    <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                      <div className="rounded-lg bg-gray-50 p-3 text-sm">
                        <p className="text-gray-500">Total rows</p>
                        <p className="mt-1 font-semibold text-gray-800">
                          {report.totalRows ?? "-"}
                        </p>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3 text-sm">
                        <p className="text-gray-500">Valid rows</p>
                        <p className="mt-1 font-semibold text-gray-800">
                          {report.validRows ?? "-"}
                        </p>
                      </div>
                    </div>
                  )}

                  {report.errors.length > 0 ? (
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
                        {report.errors.slice(0, 50).map((item) => (
                          <div key={`${item.row}-${item.message}`}>
                            Row {item.row}: {item.message}
                            {item.identifier ? ` (${item.identifier})` : ""}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {Array.isArray(report.skippedRows) &&
                  report.skippedRows.length > 0 ? (
                    <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <p className="text-sm font-medium text-gray-900">
                        Skipped rows
                      </p>
                      <div className="mt-3 max-h-56 space-y-2 overflow-auto text-sm text-gray-700">
                        {report.skippedRows.slice(0, 50).map((item, index) => (
                          <div key={`${item.row}-${item.reason}-${index}`}>
                            Row {item.row}: {item.reason}
                            {item.identifier ? ` (${item.identifier})` : ""}
                          </div>
                        ))}
                      </div>
                      {report.skippedRows.length > 50 ? (
                        <p className="mt-3 text-xs text-gray-500">
                          Showing first 50 skipped rows.
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
