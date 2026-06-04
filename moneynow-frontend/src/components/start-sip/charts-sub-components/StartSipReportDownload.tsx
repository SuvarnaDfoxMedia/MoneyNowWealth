"use client";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useState, type RefObject } from "react";
import type { CalculatorTab } from "@/hooks/useCalculator";
import { START_SIP_CALCULATORS } from "@/stores/startSipStore";

type StartSipValues = {
  sip_amount: number;
  expected_return: number;
  years: number;
  inflation_rate: number;
  wealth_amount: number;
  current_age: number;
  retirement_age: number;
  savings_amount: number;
  sip_stepup_value: number;
};

type StepUpBreakdownRow = {
  year?: number;
  sip_amount_per_month?: number;
  invested_amount_per_year?: number;
  total_invested_amount?: number;
};

type StartSipResult = Partial<{
  invested_amount: number;
  growth_value: number;
  maturity_amount: number;
  stepup_invested_amount: number;
  stepup_growth_value: number;
  stepup_maturity_amount: number;
  target_wealth: number;
  sip_amount: number;
  growth_amount: number;
  target_amount: number;
  monthly_savings: number;
  total_earnings: number;
  years: number;
  list: StepUpBreakdownRow[];
}>;

type JsPdfWithAutoTable = jsPDF & {
  lastAutoTable?: {
    finalY?: number;
  };
};

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

const BRAND_NAVY = [11, 59, 110] as const;
const CHART_BLUE = [40, 152, 194] as const;
const CHART_GREEN = [54, 176, 86] as const;
const CHART_ORANGE = [247, 153, 50] as const;
const BODY_TEXT = [39, 39, 42] as const;
const PDF_CAPTURE_SCALE = 1;
const PDF_PIE_WIDTH = 450;
const PDF_BAR_MAX_HEIGHT = 610;

const formatCurrency = (value?: number) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

const formatPercent = (value?: number) =>
  `${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}%`;

const disclaimerLines = [
  "We have gathered all the data, information, statistics from the sources believed to be highly reliable and true. All necessary precautions have been taken to avoid any error, lapse or insufficiency; however, no representations or warranties are made (express or implied) as to the reliability, accuracy or completeness of such information. We cannot be held liable for any loss arising directly or indirectly from the use of, or any action taken in on, any information appearing herein. The user is advised to verify the contents of the report independently. It is not an investment recommendation or personal financial, investment or professional advice and should not be treated as such.",
  "The Risk Level of any of the schemes must always be commensurate with the risk profile, investment objective or financial goals of the investor concerned. Therefore, the Investors should assess their risk profile before making any investment decision and consider the asset allocation accordingly.",
  "Mutual Fund investments are subject to market risks, read all scheme related documents carefully. Past performance may or may not be sustained.",
];

const getCalculatorTitle = (activeTab: CalculatorTab) =>
  START_SIP_CALCULATORS.find((item) => item.tab === activeTab)?.title || activeTab;

const buildInputRows = (
  activeTab: CalculatorTab,
  values: StartSipValues,
): [string, string][] => {
  switch (activeTab) {
    case "SIP Calculator":
      return [
        ["Monthly SIP Investment Amount", formatCurrency(values.sip_amount)],
        ["Investment Period (Years)", `${values.years} years`],
        ["Expected Rate of Return", formatPercent(values.expected_return)],
      ];
    case "SIP with Annual Increase":
      return [
        ["Initial Monthly SIP Amount", formatCurrency(values.sip_amount)],
        ["Investment Period (Years)", `${values.years} years`],
        ["Expected Rate of Return", formatPercent(values.expected_return)],
        ["Annual SIP Step-Up Value", formatPercent(values.sip_stepup_value)],
      ];
    case "Target Amount SIP Calculator":
      return [
        ["Target Wealth Goal", formatCurrency(values.wealth_amount)],
        ["Timeframe to Horizon (Years)", `${values.years} years`],
        ["Expected Rate of Return", formatPercent(values.expected_return)],
        ["Expected Inflation Rate", formatPercent(values.inflation_rate)],
      ];
    case "Become A Crorepati Calculator":
      return [
        ["Current Age", `${values.current_age} years`],
        ["Target Retirement Age", `${values.retirement_age} years`],
        ["Expected Rate of Return", formatPercent(values.expected_return)],
        ["Expected Inflation Rate", formatPercent(values.inflation_rate)],
        ["Existing Savings / Initial Seed", formatCurrency(values.savings_amount)],
      ];
    default:
      return [];
  }
};

const buildSummaryRows = (
  activeTab: CalculatorTab,
  values: StartSipValues,
  result: StartSipResult,
): [string, string][] => {
  switch (activeTab) {
    case "SIP with Annual Increase":
      return [
        ["Total SIP Amount Invested", formatCurrency(result.stepup_invested_amount || result.invested_amount)],
        ["Total Estimated Capital Growth", formatCurrency(result.stepup_growth_value || result.growth_value)],
        ["Total Estimated Future Value", formatCurrency(result.stepup_maturity_amount || result.maturity_amount)],
      ];
    case "Target Amount SIP Calculator":
      return [
        ["Target Wealth Objective", formatCurrency(result.target_wealth || values.wealth_amount)],
        ["Required Monthly SIP Base", formatCurrency(result.sip_amount)],
        ["Total Nominal Principal Invested", formatCurrency(result.invested_amount)],
        ["Total Capital Growth Earnings", formatCurrency(result.growth_amount)],
      ];
    case "Become A Crorepati Calculator":
      return [
        ["Target Future Corpus Needed", formatCurrency(result.target_amount || result.target_wealth)],
        ["Required Monthly Savings Target", formatCurrency(result.monthly_savings)],
        ["Total Principal Outlay Invested", formatCurrency(result.invested_amount)],
        ["Total Compounded Capital Growth", formatCurrency(result.total_earnings)],
      ];
    default:
      return [
        ["Total SIP Amount Invested", formatCurrency(result.invested_amount)],
        ["Total Estimated Capital Growth", formatCurrency(result.growth_value)],
        ["Total Estimated Future Value", formatCurrency(result.maturity_amount)],
      ];
  }
};

// ── sanitizeClone — properly closed ─────────────────────────────────────────
const sanitizeClone = (clonedDoc: Document) => {
  clonedDoc.querySelectorAll("*").forEach((node) => {
    const element = node as HTMLElement;
    const style = clonedDoc.defaultView?.getComputedStyle(element);
    if (!style) return;

    const normalizeColor = (value: string, fallback: string) =>
      value.includes("oklch") || value.includes("lab") ? fallback : value;

    element.style.color = normalizeColor(style.color, "#000000");
    element.style.backgroundColor = normalizeColor(style.backgroundColor, "#ffffff");
    element.style.borderColor = normalizeColor(style.borderColor, "#d1d5db");

    ["fill", "stroke"].forEach((attribute) => {
      const current = element.getAttribute(attribute);
      if (current && (current.includes("oklch") || current.includes("lab"))) {
        element.setAttribute(attribute, "#000000");
      }
    });
  });

  clonedDoc.querySelectorAll("svg text, .recharts-text, .recharts-cartesian-axis-tick-value").forEach((node) => {
    const element = node as SVGTextElement;
    element.style.fontSize = "18px";
    element.style.fontWeight = "600";
    element.style.fill = "#334155";
  });

  clonedDoc.querySelectorAll(".recharts-legend-item-text, [class*='legend'], p, span, strong, h3, h4").forEach((node) => {
    const element = node as HTMLElement;
    element.style.fontSize = "16px";
    element.style.lineHeight = "24px";
  });

  // Fix bullet/dot alignment in ChartLegend cards
  clonedDoc.querySelectorAll(".rounded-full").forEach((node) => {
    const element = node as HTMLElement;
    element.style.display = "inline-block";
    element.style.verticalAlign = "middle";
    element.style.flexShrink = "0";
    element.style.marginTop = "0px";
  });

  clonedDoc.querySelectorAll(".flex.items-start").forEach((node) => {
    const element = node as HTMLElement;
    element.style.display = "flex";
    element.style.alignItems = "center";
  });
}; // ← closing brace — THIS was missing before
// ────────────────────────────────────────────────────────────────────────────

const loadImageAsDataUrl = (src: string) =>
  new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("Canvas not available"));
        return;
      }

      context.drawImage(image, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    image.src = src;
  });

const getPrimaryChartNumbers = (result: StartSipResult) => {
  const invested = Number(result.invested_amount || result.stepup_invested_amount || 0);
  const growth = Number(
    result.growth_amount ||
      result.growth_value ||
      result.stepup_growth_value ||
      result.total_earnings ||
      0,
  );
  const total = Number(
    result.stepup_maturity_amount ||
      result.maturity_amount ||
      result.target_amount ||
      result.target_wealth ||
      invested + growth ||
      0,
  );

  return { invested, growth, total };
};

const createFallbackPieChart = async (result: StartSipResult) => {
  const { invested, growth } = getPrimaryChartNumbers(result);
  const total = Math.max(invested + growth, 1);
  const canvas = document.createElement("canvas");
  const size = 1600;
  const center = size / 2;
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas context construction failure");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, size, size);

  const slices = [
    { value: invested, color: `rgb(${CHART_BLUE.join(",")})` },
    { value: growth, color: `rgb(${CHART_GREEN.join(",")})` },
  ].filter((item) => item.value > 0);

  let startAngle = -Math.PI / 2;
  slices.forEach((slice) => {
    const endAngle = startAngle + (slice.value / total) * Math.PI * 2;
    context.beginPath();
    context.moveTo(center, center);
    context.arc(center, center, 620, startAngle, endAngle);
    context.lineTo(center, center);
    context.closePath();
    context.fillStyle = slice.color;
    context.fill();
    startAngle = endAngle;
  });

  return canvas.toDataURL("image/png");
};

const getLastTableY = (doc: jsPDF) =>
  (doc as JsPdfWithAutoTable).lastAutoTable?.finalY || 0;

export default function StartSipReportDownload({
  activeTab,
  result,
  values,
  barChartRef,
  pieChartRef,
  chartType = null,
  disabled = false,
  className = "",
}: StartSipReportDownloadProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    if (!activeTab || !result || isGenerating) return;

    try {
      setIsGenerating(true);
      await new Promise((resolve) => setTimeout(resolve, 150));

      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const generatedOn = new Date();
      const reportTitle = getCalculatorTitle(activeTab);
      const inputRows = buildInputRows(activeTab, values);
      const summaryRows = buildSummaryRows(activeTab, values, result);
      const { invested, growth, total } = getPrimaryChartNumbers(result);
      const marginX = 40;
      const contentWidth = pageWidth - marginX * 2;
      const totalPdfPages = 3;

      const addFooter = (currentPage: number) => {
        doc.setDrawColor(220, 222, 225);
        doc.setLineWidth(0.5);
        doc.line(marginX, pageHeight - 40, pageWidth - marginX, pageHeight - 40);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(120, 120, 120);
        doc.text("MoneyNow Wealth Solutions", marginX, pageHeight - 25);
        doc.text(`Page ${currentPage} of ${totalPdfPages}`, pageWidth - marginX, pageHeight - 25, {
          align: "right",
        });
      };

      const drawReportLegend = (y: number) => {
        const legendItems = [
          { label: "Total Outlay Invested", value: invested, color: CHART_BLUE },
          { label: "Estimated Wealth Growth", value: growth, color: CHART_GREEN },
          { label: "Total Projected Valuation", value: total, color: CHART_ORANGE },
        ].filter((item) => item.value > 0);

        const columnWidth = 175;
        const totalLegendWidth = legendItems.length * columnWidth;
        const startX = (pageWidth - totalLegendWidth) / 2;

        legendItems.forEach((item, index) => {
          const itemX = startX + index * columnWidth;

          doc.setFillColor(item.color[0], item.color[1], item.color[2]);
          doc.rect(itemX, y - 9, 12, 12, "F");

          doc.setFont("helvetica", "normal");
          doc.setFontSize(11);
          doc.setTextColor(0, 0, 0);
          doc.text(item.label, itemX + 20, y);

          doc.setFont("helvetica", "bold");
          doc.setFontSize(14);
          doc.setTextColor(0, 0, 0);
          doc.text(formatCurrency(item.value), itemX + 20, y + 22);

          doc.setFont("helvetica", "normal");
        });
      };

      const tableStyles = {
        font: "helvetica",
        fontSize: 8,
        lineColor: [210, 214, 219] as [number, number, number],
        lineWidth: 0.5,
        textColor: [30, 30, 30] as [number, number, number],
        cellPadding: { top: 8, right: 10, bottom: 8, left: 10 },
        minCellHeight: 20,
      };

      // ================= PAGE 1 =================
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      try {
        const logo = await loadImageAsDataUrl("/images/footer-logo.png");
        doc.addImage(logo, "PNG", marginX, 35, 130, 35);
      } catch {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(BRAND_NAVY[0], BRAND_NAVY[1], BRAND_NAVY[2]);
        doc.text("MoneyNow Wealth", marginX, 58);
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...BODY_TEXT);
      doc.text("MONEYNOW WEALTH MANAGEMENT", pageWidth - marginX, 38, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);

      const identityLines = [
        "A1, 108, Sarova Complex, Thakur Village",
        "Kandivali East, Mumbai - 400101",
        "Phone: +91 89765 000 22 | Email: info@moneynowwealth.com",
        `Report Generation Date: ${generatedOn.toLocaleDateString("en-GB")}`,
      ];
      identityLines.forEach((line, index) => {
        doc.text(line, pageWidth - marginX, 50 + index * 11, { align: "right" });
      });

      // Title — no background, navy text
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(BRAND_NAVY[0], BRAND_NAVY[1], BRAND_NAVY[2]);
      doc.text(reportTitle.toUpperCase(), pageWidth / 2, 130, { align: "center" });

      autoTable(doc, {
        startY: 160,
        head: [["Investment Parameters Evaluated", "Configured Value"]],
        body: inputRows,
        theme: "grid",
        styles: tableStyles,
        headStyles: {
          fillColor: [11, 59, 110],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "left",
        },
        columnStyles: {
          0: { cellWidth: contentWidth * 0.60 },
          1: { cellWidth: contentWidth * 0.40, fontStyle: "bold" },
        },
        margin: { left: marginX, right: marginX },
        tableWidth: contentWidth,
      });

      const table2StartY = getLastTableY(doc) + 15;
      autoTable(doc, {
        startY: table2StartY,
        head: [["Projection Breakdown Results", "Estimated Forecast Summary"]],
        body: summaryRows,
        theme: "grid",
        styles: tableStyles,
        headStyles: {
          fillColor: [11, 59, 110],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "left",
        },
        columnStyles: {
          0: { cellWidth: contentWidth * 0.60 },
          1: { cellWidth: contentWidth * 0.40, fontStyle: "bold", textColor: [16, 124, 65] },
        },
        margin: { left: marginX, right: marginX },
        tableWidth: contentWidth,
      });

      const pieY = getLastTableY(doc) + 18;
      const finalPieWidth = PDF_PIE_WIDTH;
      let finalPieHeight = PDF_PIE_WIDTH;

      try {
        let pieImage = "";
        if (chartType === "sip" && pieChartRef?.current) {
          const pieCanvas = await html2canvas(pieChartRef.current, {
            scale: PDF_CAPTURE_SCALE,
            useCORS: true,
            backgroundColor: "#ffffff",
            onclone: sanitizeClone,
          });
          pieImage = pieCanvas.toDataURL("image/png");
          const pieRatio = pieCanvas.height / pieCanvas.width;
          finalPieHeight = finalPieWidth * pieRatio;
        } else {
          pieImage = await createFallbackPieChart(result);
        }

        const pieX = (pageWidth - finalPieWidth) / 2;
        doc.addImage(pieImage, "PNG", pieX, pieY, finalPieWidth, finalPieHeight);
        drawReportLegend(pieY + finalPieHeight + 32);
      } catch {
        drawReportLegend(pieY + 30);
      }

      addFooter(1);

      // ================= PAGE 2 =================
      doc.addPage();
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      const barChartTitleY = 55;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(...BRAND_NAVY);
      doc.text(
        chartType === "goal"
          ? "Target Projection Accumulation Timeline"
          : "Systematic Investment Plan (SIP) Compound Trajectory",
        marginX,
        barChartTitleY,
      );

      const workingY = barChartTitleY + 24;

      if (barChartRef?.current) {
        const canvas = await html2canvas(barChartRef.current, {
          scale: PDF_CAPTURE_SCALE,
          useCORS: true,
          backgroundColor: "#ffffff",
          onclone: sanitizeClone,
        });
        const img = canvas.toDataURL("image/png");
        const ratio = canvas.height / canvas.width;
        const availableHeight = pageHeight - workingY - 70;
        const chartHeight = Math.min(PDF_BAR_MAX_HEIGHT, availableHeight, contentWidth * ratio);
        doc.addImage(img, "PNG", marginX, workingY, contentWidth, chartHeight);
      } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(90, 90, 90);
        doc.text("Chart preview was not available for this report.", marginX, workingY + 20);
      }

      addFooter(2);

      // ================= PAGE 3 =================
      doc.addPage();
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      const complianceBoxY = 70;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...BODY_TEXT);
      doc.text("Regulatory Disclaimers & Statutory Risk Disclosures:", marginX, complianceBoxY);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(90, 90, 90);

      let disclaimerTextCursorY = complianceBoxY + 18;
      disclaimerLines.forEach((line) => {
        const structuralSplits = doc.splitTextToSize(line, contentWidth);
        doc.text(structuralSplits, marginX, disclaimerTextCursorY);
        disclaimerTextCursorY += structuralSplits.length * 13 + 8;
      });

      addFooter(3);

      doc.save(`${reportTitle.replace(/\s+/g, "_")}_Statement.pdf`);
    } catch (error) {
      console.error("Error generating clean layout PDF document:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={disabled || !activeTab || !result || isGenerating}
      className={`${className} flex items-center justify-center gap-2 font-medium transition-all duration-200 cursor-pointer text-white disabled:cursor-not-allowed disabled:bg-slate-400`}
    >
      {isGenerating ? (
        <>
          <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Generating Premium Report...
        </>
      ) : (
        "Download Report"
      )}
    </button>
  );
}