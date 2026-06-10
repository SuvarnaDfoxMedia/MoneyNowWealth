import React from "react";
import { FiArrowLeft, FiRefreshCw, FiSave } from "react-icons/fi";

type MFFormHeaderProps = {
  title: string;
  onBack: () => void;
};

type MFFormActionsProps = {
  onReset: () => void;
  isSubmitting: boolean;
  submitLabel: string;
};

export const mfInputClass =
  "w-full h-11 border border-gray-300 rounded-md px-3 focus:outline-none focus:ring-2 focus:ring-blue-200";

export const mfTextAreaClass =
  "w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200";

export const mfCheckboxClass = "w-4 h-4 accent-blue-600";

export const MFFormContainer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div className="p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
    {children}
  </div>
);

export const MFFormHeader: React.FC<MFFormHeaderProps> = ({
  title,
  onBack,
}) => (
  <div className="flex justify-between items-center mb-8">
    <h2 className="text-2xl font-semibold text-[#043f79]">{title}</h2>
    <button
      type="button"
      onClick={onBack}
      className="flex items-center gap-2 bg-[#043f79] text-white px-4 py-2 rounded-md hover:bg-[#0654a4] transition"
    >
      <FiArrowLeft /> Back
    </button>
  </div>
);

export const MFFormActions: React.FC<MFFormActionsProps> = ({
  onReset,
  isSubmitting,
  submitLabel,
}) => (
  <div className="flex justify-end gap-4 pt-8 border-t border-gray-100">
    <button
      type="button"
      onClick={onReset}
      className="flex items-center gap-2 bg-gray-200 text-gray-700 px-5 py-2.5 rounded-md hover:bg-gray-300 transition"
    >
      <FiRefreshCw /> Reset
    </button>

    <button
      type="submit"
      disabled={isSubmitting}
      className="flex items-center gap-2 bg-[#043f79] text-white px-6 py-2.5 rounded-md hover:bg-[#0654a4] transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <FiSave /> {isSubmitting ? "Saving..." : submitLabel}
    </button>
  </div>
);
