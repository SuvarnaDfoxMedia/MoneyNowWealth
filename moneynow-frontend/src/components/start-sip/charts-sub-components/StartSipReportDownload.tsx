"use client";

import type { RefObject } from "react";
import type { CalculatorTab } from "@/hooks/useCalculator";
import type { StartSipResult, StartSipValues } from "@/stores/startSipStore";
import { downloadStartSipReport } from "@/lib/pdf/startSipReport";

interface StartSipReportDownloadProps {
  activeTab: CalculatorTab | "";
  result: StartSipResult | null;
  values: StartSipValues;
  barChartRef?: RefObject<HTMLDivElement | null>;
  pieChartRef?: RefObject<HTMLDivElement | null>;
  chartType?: "sip" | "goal" | null;
  disabled?: boolean;
  className?: string;
}

export default function StartSipReportDownload({
  activeTab,
  result,
  values,
  barChartRef,
  pieChartRef: _pieChartRef,
  chartType = null,
  disabled = false,
  className = "",
}: StartSipReportDownloadProps) {
  const handleDownload = async () => {
    if (!activeTab || !result) return;

    await downloadStartSipReport({
      activeTab,
      result,
      values,
      barChartRef,
      chartType,
    });
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={disabled || !activeTab || !result}
      className={`${className} cursor-pointer text-white disabled:cursor-not-allowed disabled:bg-slate-400`}
    >
      Download Report
    </button>
  );
}
