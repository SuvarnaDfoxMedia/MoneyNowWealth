"use client";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export const BRAND_NAVY = [6, 28, 68] as const;
export const BRAND_BLUE = [11, 75, 138] as const;
export const BRAND_GREEN = [52, 168, 83] as const;
export const SURFACE = [245, 248, 252] as const;
export const BORDER = [220, 226, 236] as const;
export const BODY_TEXT = [39, 39, 42] as const;
export const PDF_FONT_FAMILY = "helvetica";
export const CANVAS_FONT_STACK = "Poppins, Arial, sans-serif";

export type JsPdfWithGState = jsPDF & {
  GState: new (options: { opacity: number }) => unknown;
};

export const splitText = (doc: jsPDF, text: string, width: number) =>
  doc.splitTextToSize(text, width) as string[];

export const getTextBlockHeight = (lines: string[], lineHeight: number) =>
  Math.max(lines.length, 1) * lineHeight;

export const sanitizeClone = (clonedDoc: Document) => {
  clonedDoc.querySelectorAll("*").forEach((node) => {
    const element = node as HTMLElement;
    const style = clonedDoc.defaultView?.getComputedStyle(element);
    if (!style) return;

    const normalizeColor = (value: string, fallback: string) =>
      value.includes("oklch") || value.includes("lab") ? fallback : value;

    element.style.color = normalizeColor(style.color, "#000000");
    element.style.backgroundColor = normalizeColor(
      style.backgroundColor,
      "#ffffff",
    );
    element.style.borderColor = normalizeColor(style.borderColor, "#d1d5db");

    ["fill", "stroke"].forEach((attribute) => {
      const current = element.getAttribute(attribute);
      if (current && (current.includes("oklch") || current.includes("lab"))) {
        element.setAttribute(attribute, "#000000");
      }
    });
  });
};

export const loadImageAsDataUrl = (src: string) =>
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

export const captureChartImage = async (node: HTMLDivElement) => {
  const canvas = await html2canvas(node, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    onclone: sanitizeClone,
  });

  return {
    image: canvas.toDataURL("image/png"),
    width: canvas.width,
    height: canvas.height,
  };
};

export const formatGeneratedTimestamp = (date: Date) =>
  `${date.toLocaleDateString("en-GB")} • ${date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

export const addFooterToAllPages = (
  doc: jsPDF,
  pageWidth: number,
  pageHeight: number,
) => {
  const totalPages = doc.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(220);
    doc.line(40, pageHeight - 40, pageWidth - 40, pageHeight - 40);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text("MoneyNow Wealth", 40, pageHeight - 25);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 100, pageHeight - 25);
  }
};
