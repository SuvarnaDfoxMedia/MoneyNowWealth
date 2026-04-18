import React from "react";

export interface MFDeleteImpactItem {
  key: string;
  label: string;
  count: number;
}

export interface MFDeleteImpactSummary {
  entityType: "main-category" | "category" | "amc";
  entityId: string;
  entityName: string;
  items: MFDeleteImpactItem[];
  totalDependencies: number;
}

interface MFDeleteImpactModalProps {
  title: string;
  fallbackMessage: string;
  impact: MFDeleteImpactSummary | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const formatDependencySummary = (items: MFDeleteImpactItem[]) => {
  const nonZeroItems = items.filter((item) => item.count > 0);
  if (nonZeroItems.length === 0) return "";

  return nonZeroItems
    .map((item) => `${item.count} ${item.label}`)
    .join(", ");
};

export default function MFDeleteImpactModal({
  title,
  fallbackMessage,
  impact,
  loading = false,
  onClose,
  onConfirm,
}: MFDeleteImpactModalProps) {
  const summaryText = impact ? formatDependencySummary(impact.items) : "";

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>

        {loading ? (
          <p className="mt-2 text-sm text-gray-600">
            Checking related records before delete...
          </p>
        ) : impact ? (
          <>
            <p className="mt-2 text-sm text-gray-600">
              {impact.totalDependencies > 0
                ? `This ${impact.entityName} is currently used in ${summaryText}. You can still continue, but please review the related records first if needed.`
                : fallbackMessage}
            </p>

            {impact.totalDependencies > 0 && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-medium text-amber-900">
                  Related records found
                </p>
                <div className="mt-2 space-y-1 text-sm text-amber-800">
                  {impact.items
                    .filter((item) => item.count > 0)
                    .map((item) => (
                      <div key={item.key}>
                        {item.count} {item.label}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="mt-2 text-sm text-gray-600">{fallbackMessage}</p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="h-10 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="h-10 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
