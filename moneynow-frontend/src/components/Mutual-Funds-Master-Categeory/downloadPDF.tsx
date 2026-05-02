"use client";

import React from "react";
import { downloadSimpleCalculatorReport } from "@/lib/pdf/simpleCalculatorReport";

interface PDFDownloadButtonProps {
  activeTab: string;
  result?: any;
  values?: any;
  disabled?: boolean;
  className?: string;
}

export default function PDFDownloadButton({
  activeTab,
  result,
  values = {},
  disabled = false,
  className = "",
}: PDFDownloadButtonProps) {
  const handleDownload = () => {
    downloadSimpleCalculatorReport({ activeTab, result, values });
  };

  return (
    <button
      onClick={handleDownload}
      disabled={disabled || !result}
      className={`px-4 py-2 rounded text-white ${
        disabled || !result
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-[#043F79] hover:bg-blue-700"
      } ${className}`}
    >
      Download Report
    </button>
  );
}
