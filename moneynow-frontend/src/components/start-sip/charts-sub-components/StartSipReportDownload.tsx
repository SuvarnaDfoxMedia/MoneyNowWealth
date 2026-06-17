"use client";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useState, type RefObject } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type JsPdfWithAutoTable = jsPDF & {
  lastAutoTable?: {
    finalY?: number;
  };
};

interface StartSipReportDownloadProps {
  title: string;
  inputRows: [string, string][];
  resultRows: [string, string][];
  barChartRef?: RefObject<HTMLDivElement | null>;
  pieChartRef?: RefObject<HTMLDivElement | null>;
  chartType?: "sip" | "goal" | null;
  disabled?: boolean;
  className?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BRAND_NAVY = [11, 59, 110] as const;
const CHART_BLUE = [40, 152, 194] as const;
const CHART_GREEN = [54, 176, 86] as const;
const CHART_ORANGE = [247, 153, 50] as const;
const BODY_TEXT = [39, 39, 42] as const;

const PDF_CAPTURE_SCALE = 2;
const PDF_PIE_WIDTH = 420;
const PDF_BAR_MAX_HEIGHT = 560;

const disclaimerLines = [
  "We have gathered all the data, information, statistics from the sources believed to be highly reliable and true. All necessary precautions have been taken to avoid any error, lapse or insufficiency; however, no representations or warranties are made (express or implied) as to the reliability, accuracy or completeness of such information. We cannot be held liable for any loss arising directly or indirectly from the use of, or any action taken in on, any information appearing herein. The user is advised to verify the contents of the report independently. It is not an investment recommendation or personal financial, investment or professional advice and should not be treated as such.",
  "The Risk Level of any of the schemes must always be commensurate with the risk profile, investment objective or financial goals of the investor concerned. Therefore, the Investors should assess their risk profile before making any investment decision and consider the asset allocation accordingly.",
  "Mutual Fund investments are subject to market risks, read all scheme related documents carefully. Past performance may or may not be sustained.",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (value?: number) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

const getLastTableY = (doc: jsPDF) =>
  (doc as JsPdfWithAutoTable).lastAutoTable?.finalY || 0;

const sanitizeClone = (clonedDoc: Document) => {
  clonedDoc.querySelectorAll("*").forEach((node) => {
    const el = node as HTMLElement;
    const style = clonedDoc.defaultView?.getComputedStyle(el);
    if (!style) return;

    const fix = (v: string, fb: string) =>
      v.includes("oklch") || v.includes("lab") ? fb : v;

    el.style.color = fix(style.color, "#000000");
    el.style.backgroundColor = fix(style.backgroundColor, "#ffffff");
    el.style.borderColor = fix(style.borderColor, "#d1d5db");

    ["fill", "stroke"].forEach((attr) => {
      const cur = el.getAttribute(attr);
      if (cur && (cur.includes("oklch") || cur.includes("lab")))
        el.setAttribute(attr, "#000000");
    });
  });

  clonedDoc
    .querySelectorAll("svg text, .recharts-text, .recharts-cartesian-axis-tick-value")
    .forEach((node) => {
      const el = node as SVGTextElement;
      el.style.fontSize = "18px";
      el.style.fontWeight = "600";
      el.style.fill = "#334155";
    });

  clonedDoc
    .querySelectorAll(".recharts-legend-item-text, [class*='legend'], p, span, strong, h3, h4")
    .forEach((node) => {
      const el = node as HTMLElement;
      el.style.fontSize = "16px";
      el.style.lineHeight = "24px";
    });

  clonedDoc.querySelectorAll(".rounded-full").forEach((node) => {
    const el = node as HTMLElement;
    el.style.display = "inline-block";
    el.style.verticalAlign = "middle";
    el.style.flexShrink = "0";
    el.style.marginTop = "0px";
  });

  clonedDoc.querySelectorAll(".flex.items-start").forEach((node) => {
    const el = node as HTMLElement;
    el.style.display = "flex";
    el.style.alignItems = "center";
  });
};

const loadImageAsDataUrl = (src: string) =>
  new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not available")); return; }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error(`Failed to load: ${src}`));
    img.src = src;
  });

// Parse key numeric values from result rows for the legend
const getPrimaryChartNumbers = (rows: [string, string][]) => {
  const parse = (str: string) => Number(str?.replace(/[^0-9.-]/g, "") || "0") || 0;

  let invested = 0;
  let growth = 0;
  let total = 0;

  const rowMap: Record<string, number> = {};
  rows.forEach(([label, val]) => {
    rowMap[label.trim().toLowerCase()] = parse(val);
  });

  const findValue = (possibleLabels: string[]) => {
    for (const label of possibleLabels) {
      const lower = label.toLowerCase();
      if (rowMap[lower] !== undefined) return rowMap[lower];
    }
    return undefined;
  };

  invested = findValue([
    "total sip amount invested with step up",
    "total sip amount invested",
    "your lumpsum amount",
    "total amount invested",
    "lumpsum amount required",
    "principal loan amount",
    "total investment",
    "principal amount",
    "total savings amount",
  ]) ?? parse(rows[0]?.[1]);

  total = findValue([
    "total future value with step up",
    "total future value",
    "your future amount",
    "final targeted amount",
    "target wealth",
    "target corpus",
    "target retirement corpus",
    "total payment (principal + interest)",
    "final balance",
    "future cost",
    "maturity amount",
    "future value of savings",
    "total inflation adjusted amount",
  ]) ?? parse(rows[rows.length - 1]?.[1]);

  growth = findValue([
    "total growth with step up",
    "total growth",
    "total growth amount",
    "total interest payable",
    "total gain",
  ]) ?? 0;

  if (growth === 0 && total > invested) {
    growth = Math.max(total - invested, 0);
  }

  if (total === 0) {
    total = invested + growth;
  }

  return { invested, growth, total };
};

// Fallback canvas pie — used if pieChartRef capture fails
const createFallbackPieImage = async (rows: [string, string][]) => {
  const { invested, growth } = getPrimaryChartNumbers(rows);
  const total = Math.max(invested + growth, 1);
  const canvas = document.createElement("canvas");
  const size = 1200;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas error");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  const slices = [
    { value: invested, color: `rgb(${CHART_BLUE.join(",")})` },
    { value: growth, color: `rgb(${CHART_GREEN.join(",")})` },
  ].filter((s) => s.value > 0);
  let start = -Math.PI / 2;
  slices.forEach((s) => {
    const end = start + (s.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(size / 2, size / 2);
    ctx.arc(size / 2, size / 2, 480, start, end);
    ctx.closePath();
    ctx.fillStyle = s.color;
    ctx.fill();
    start = end;
  });
  return canvas.toDataURL("image/png");
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function StartSipReportDownload({
  title,
  inputRows,
  resultRows,
  barChartRef,
  pieChartRef,
  disabled = false,
  className = "",
}: StartSipReportDownloadProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    if (isGenerating || !inputRows.length || !resultRows.length) return;

    try {
      setIsGenerating(true);
      await new Promise((r) => setTimeout(r, 150));

      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const generatedOn = new Date();
      const marginX = 40;
      const contentWidth = pageWidth - marginX * 2;

      const { invested, growth, total } = getPrimaryChartNumbers(resultRows);

      // ── Helper: draw footer on a given page ────────────────────────────────
      const drawFooter = (pg: number, totalPg: number) => {
        doc.setPage(pg);
        doc.setDrawColor(220, 222, 225);
        doc.setLineWidth(0.5);
        doc.line(marginX, pageHeight - 40, pageWidth - marginX, pageHeight - 40);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(120, 120, 120);
        doc.text("MoneyNow Wealth Solutions", marginX, pageHeight - 25);
        doc.text(`Page ${pg} of ${totalPg}`, pageWidth - marginX, pageHeight - 25, {
          align: "right",
        });
      };

      // ── Helper: draw legend row ────────────────────────────────────────────
      const drawReportLegend = (y: number) => {
        const items = [
          { label: "Total Outlay Invested", value: invested, color: CHART_BLUE },
          { label: "Estimated Wealth Growth", value: growth, color: CHART_GREEN },
          { label: "Total Projected Valuation", value: total, color: CHART_ORANGE },
        ].filter((item) => item.value > 0);

        const colW = 175;
        const startX = (pageWidth - items.length * colW) / 2;

        items.forEach((item, i) => {
          const ix = startX + i * colW;
          doc.setFillColor(item.color[0], item.color[1], item.color[2]);
          doc.rect(ix, y - 9, 12, 12, "F");
          doc.setFont("helvetica", "normal");
          doc.setFontSize(11);
          doc.setTextColor(0, 0, 0);
          doc.text(item.label, ix + 20, y);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(14);
          doc.text(formatCurrency(item.value), ix + 20, y + 22);
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

      // ── PAGE 1 — Header + Tables (auto-overflow to extra pages) ───────────

      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      // Logo
      try {
        const logo = await loadImageAsDataUrl("/images/footer-logo.png");
        doc.addImage(logo, "PNG", marginX, 35, 130, 35);
      } catch {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(BRAND_NAVY[0], BRAND_NAVY[1], BRAND_NAVY[2]);
        doc.text("MoneyNow Wealth", marginX, 58);
      }

      // Company header (top-right)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...BODY_TEXT);
      doc.text("MONEYNOW WEALTH MANAGEMENT", pageWidth - marginX, 38, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      [
        "A1, 108, Sarova Complex, Thakur Village",
        "Kandivali East, Mumbai - 400101",
        "Phone: +91 89765 000 22 | Email: info@moneynowwealth.com",
        `Report Generation Date: ${generatedOn.toLocaleDateString("en-GB")}`,
      ].forEach((line, i) => {
        doc.text(line, pageWidth - marginX, 50 + i * 11, { align: "right" });
      });

      // Report title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(BRAND_NAVY[0], BRAND_NAVY[1], BRAND_NAVY[2]);
      doc.text(title.toUpperCase(), pageWidth / 2, 130, { align: "center" });

      // Input parameters table
      autoTable(doc, {
        startY: 160,
        head: [["Investment Parameters Evaluated", "Configured Value"]],
        body: inputRows.map(([l, v]) => [l, v.replace(/₹/g, "Rs. ")]),
        theme: "grid",
        styles: tableStyles,
        headStyles: {
          fillColor: [11, 59, 110],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "left",
        },
        columnStyles: {
          0: { cellWidth: contentWidth * 0.6 },
          1: { cellWidth: contentWidth * 0.4, fontStyle: "bold" },
        },
        margin: { left: marginX, right: marginX },
        tableWidth: contentWidth,
      });

      // Results table
      autoTable(doc, {
        startY: getLastTableY(doc) + 15,
        head: [["Projection Breakdown Results", "Estimated Forecast Summary"]],
        body: resultRows.map(([l, v]) => [l, v.replace(/₹/g, "Rs. ")]),
        theme: "grid",
        styles: tableStyles,
        headStyles: {
          fillColor: [11, 59, 110],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "left",
        },
        columnStyles: {
          0: { cellWidth: contentWidth * 0.6 },
          1: { cellWidth: contentWidth * 0.4, fontStyle: "bold", textColor: [16, 124, 65] },
        },
        margin: { left: marginX, right: marginX },
        tableWidth: contentWidth,
        showHead: "firstPage",
      });

      // ── PIE CHART — always its own dedicated page ──────────────────────────

      doc.addPage();
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(BRAND_NAVY[0], BRAND_NAVY[1], BRAND_NAVY[2]);
      doc.text("Investment Projection Overview", pageWidth / 2, 55, { align: "center" });

      // Horizontal rule under title
      doc.setDrawColor(220, 222, 225);
      doc.setLineWidth(0.5);
      doc.line(marginX, 65, pageWidth - marginX, 65);

      let finalPieWidth = PDF_PIE_WIDTH;
      let finalPieHeight = PDF_PIE_WIDTH;
      const pieStartY = 80;

      try {
        let pieImage = "";
        if (pieChartRef?.current) {
          const pieCanvas = await html2canvas(pieChartRef.current, {
            scale: PDF_CAPTURE_SCALE,
            useCORS: true,
            backgroundColor: "#ffffff",
            onclone: sanitizeClone,
          });
          pieImage = pieCanvas.toDataURL("image/png");
          const ratio = pieCanvas.height / pieCanvas.width;
          // Scale to fit page width, capped at PDF_PIE_WIDTH
          const maxW = Math.min(PDF_PIE_WIDTH, contentWidth);
          finalPieWidth = maxW;
          finalPieHeight = finalPieWidth * ratio;
        } else {
          pieImage = await createFallbackPieImage(resultRows);
          finalPieWidth = Math.min(PDF_PIE_WIDTH, contentWidth);
          finalPieHeight = finalPieWidth;
        }

        const pieX = (pageWidth - finalPieWidth) / 2;
        doc.addImage(pieImage, "PNG", pieX, pieStartY, finalPieWidth, finalPieHeight);
        drawReportLegend(pieStartY + finalPieHeight + 30);
      } catch {
        drawReportLegend(pieStartY + 20);
      }

      // ── BAR CHART — always its own dedicated page ──────────────────────────

      if (barChartRef?.current) {
        doc.addPage();
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageWidth, pageHeight, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(BRAND_NAVY[0], BRAND_NAVY[1], BRAND_NAVY[2]);
        doc.text("Systematic Investment Growth Trajectory", pageWidth / 2, 55, { align: "center" });

        // Horizontal rule under title
        doc.setDrawColor(220, 222, 225);
        doc.setLineWidth(0.5);
        doc.line(marginX, 65, pageWidth - marginX, 65);

        try {
          const barCanvas = await html2canvas(barChartRef.current, {
            scale: PDF_CAPTURE_SCALE,
            useCORS: true,
            backgroundColor: "#ffffff",
            onclone: sanitizeClone,
          });
          const barImg = barCanvas.toDataURL("image/png");
          const ratio = barCanvas.height / barCanvas.width;
          const availH = pageHeight - 80 - 70; // top zone + footer zone
          const chartH = Math.min(PDF_BAR_MAX_HEIGHT, availH, contentWidth * ratio);
          doc.addImage(barImg, "PNG", marginX, 80, contentWidth, chartH);
        } catch { /* skip */ }
      }

      // ── DISCLAIMER PAGE — always last ─────────────────────────────────────

      doc.addPage();
      const disclaimerPageNum = (doc as any).internal.getCurrentPageInfo().pageNumber;
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...BODY_TEXT);
      doc.text("Regulatory Disclaimers & Statutory Risk Disclosures:", marginX, 70);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(90, 90, 90);

      let curY = 88;
      disclaimerLines.forEach((line) => {
        const splits = doc.splitTextToSize(line, contentWidth);
        doc.text(splits, marginX, curY);
        curY += splits.length * 13 + 8;
      });

      // ── Draw footers on all pages with correct totals ─────────────────────

      const grandTotal = disclaimerPageNum;
      for (let pg = 1; pg <= grandTotal; pg++) {
        drawFooter(pg, grandTotal);
      }

      // ── Save ──────────────────────────────────────────────────────────────

      doc.save(`${title.replace(/\s+/g, "_")}_Statement.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={disabled || !inputRows.length || !resultRows.length || isGenerating}
      className={`${className} flex items-center justify-center gap-2 font-medium transition-all duration-200 cursor-pointer text-white disabled:cursor-not-allowed disabled:bg-slate-400`}
    >
      {isGenerating ? (
        <>
          <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Generating Premium Report...
        </>
      ) : (
        "Download Report"
      )}
    </button>
  );
}