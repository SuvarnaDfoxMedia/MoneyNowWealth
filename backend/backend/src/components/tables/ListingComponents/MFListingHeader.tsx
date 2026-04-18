import React from "react";
import { FiPlus, FiFileText } from "react-icons/fi";

type MfImportEntity =
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

type ExportMode = "data" | "template";

type MFListingHeaderProps = {
  title: string;
  onAdd: () => void;
  templateOptions?: EntityOption[];
  selectedEntity?: MfImportEntity;
  onEntityChange?: (entity: MfImportEntity) => void;
  role?: string;
  isExporting?: boolean;
  onExport?: (mode: ExportMode) => void;
};

export default function MFListingHeader({
  title,
  onAdd,
  templateOptions,
  selectedEntity,
  onEntityChange,
  role,
  isExporting,
  onExport,
}: MFListingHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-medium">{title}</h2>
      <div className="flex items-center gap-2">
        {templateOptions && templateOptions.length > 1 && selectedEntity && (
          <select
            value={selectedEntity}
            onChange={(event) =>
              onEntityChange?.(event.target.value as MfImportEntity)
            }
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 focus:border-[#043f79] focus:outline-none"
          >
            {templateOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
        {onExport && (
          <button
            type="button"
            onClick={() => void onExport("template")}
            disabled={isExporting}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#043f79] px-4 text-sm font-medium text-white transition hover:bg-[#032d57] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiFileText />
            {isExporting ? "Preparing..." : "Download Template"}
          </button>
        )}
        <button
          onClick={onAdd}
          className="bg-[#043f79] text-white px-3 py-2 rounded-md flex items-center gap-2"
        >
          <FiPlus /> Add
        </button>
      </div>
    </div>
  );
}
