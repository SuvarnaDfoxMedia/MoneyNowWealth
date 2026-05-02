"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getSimpleCalculatorReportDefinition } from "@/lib/reports/simpleCalculatorReportDefinitions";
import { formatGeneratedTimestamp, PDF_FONT_FAMILY } from "@/lib/pdf/shared";

interface SimpleCalculatorReportOptions {
  activeTab: string;
  result?: Record<string, any>;
  values?: Record<string, any>;
}

export const downloadSimpleCalculatorReport = ({
  activeTab,
  result,
  values = {},
}: SimpleCalculatorReportOptions) => {
  if (!result) return;

  const definition = getSimpleCalculatorReportDefinition(activeTab);
  if (!definition) return;

  const doc = new jsPDF();
  const now = new Date();

  doc.setFont(PDF_FONT_FAMILY, "bold");
  doc.setFontSize(16);
  doc.text(`${activeTab} Report`, 14, 20);

  doc.setFont(PDF_FONT_FAMILY, "normal");
  doc.setFontSize(10);
  doc.text(`Generated on: ${formatGeneratedTimestamp(now)}`, 14, 30);

  autoTable(doc, {
    startY: 40,
    head: [["Parameter", "Value"]],
    body: definition.summaryRows({ activeTab, result, values }).map(([label, value]) => [
      String(label),
      typeof value === "number" ? value : (value ?? "—"),
    ]),
    theme: "grid",
    headStyles: {
      fillColor: [4, 63, 121],
      textColor: 255,
      font: PDF_FONT_FAMILY,
    },
    styles: { cellPadding: 3, fontSize: 10, font: PDF_FONT_FAMILY },
  });

  const detailTables = definition.detailTables?.({ activeTab, result, values }) || [];

  detailTables.forEach((table) => {
    doc.addPage();
    doc.setFont(PDF_FONT_FAMILY, "bold");
    doc.setFontSize(14);
    doc.text(table.title, 14, 20);

    autoTable(doc, {
      startY: 30,
      head: [table.headers],
      body: table.rows,
      theme: "grid",
      headStyles: {
        fillColor: [0, 123, 255],
        textColor: 255,
        font: PDF_FONT_FAMILY,
      },
      styles: { cellPadding: 3, fontSize: 10, font: PDF_FONT_FAMILY },
    });
  });

  doc.save(`${activeTab.replace(/\s+/g, "_")}_Report_${Date.now()}.pdf`);
};
