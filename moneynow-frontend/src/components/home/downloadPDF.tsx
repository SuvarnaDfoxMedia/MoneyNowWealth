// // components/PDFDownloadButton.tsx
// import jsPDF from "jspdf";
// import "jspdf-autotable";

// interface PDFDownloadButtonProps {
//   activeTab: string;
//   result: any;
//   currentAge?: number;
//   retirementAge?: number;
// }

// export default function PDFDownloadButton({
//   activeTab,
//   result,
//   currentAge,
//   retirementAge,
// }: PDFDownloadButtonProps) {
//   const handleDownload = () => {
//     if (!result) return;

//     const doc = new jsPDF();
//     doc.setFontSize(16);
//     doc.text(`${activeTab} Report`, 14, 20);

//     const rupee = "\u20B9"; // ₹
//     const summaryData: any[] = [];

//     switch (activeTab) {
//       case "SIP Growth":
//       case "Step-Up SIP":
//         summaryData.push(
//           ["SIP Amount", `${rupee}${result.sip_amount?.toLocaleString("en-IN")}`],
//           ["Interest Rate", `${result.interest_rate}%`],
//           ["Period (Months)", result.period],
//           ["Invested Amount", `${rupee}${result.invested_amount?.toLocaleString("en-IN")}`],
//           ["Growth Value", `${rupee}${result.growth_value?.toLocaleString("en-IN")}`],
//           ["Maturity Amount", `${rupee}${result.maturity_amount?.toLocaleString("en-IN")}`]
//         );
//         break;

//       case "Lumpsum":
//         summaryData.push(
//           ["Lumpsum Amount", `${rupee}${result.lumpsum_amount?.toLocaleString("en-IN")}`],
//           ["Interest Rate", `${result.expected_return}%`],
//           ["Investment Period", `${result.years} Years`]
//         );
//         break;

//       case "Goal Planner":
//         summaryData.push(
//           ["Years", result.years],
//           ["Dream Amount", `${rupee}${result.dream_amount?.toLocaleString("en-IN")}`],
//           ["Savings Amount", `${rupee}${result.savings_amount?.toLocaleString("en-IN")}`],
//           ["Target Amount", `${rupee}${result.target_amount?.toLocaleString("en-IN")}`],
//           ["Monthly Savings", `${rupee}${result.monthly_savings?.toLocaleString("en-IN")}`],
//           ["Total Earnings", `${rupee}${result.total_earnings?.toLocaleString("en-IN")}`],
//           ["Inflation Rate", `${result.inflation_rate}%`],
//           ["Expected Return", `${result.expected_return}%`]
//         );
//         break;

//       case "Retirement Planner":
//         summaryData.push(
//           ["Current Age", currentAge],
//           ["Retirement Age", retirementAge],
//           ["Years to Retirement", result.years],
//           ["Target Retirement Corpus", `${rupee}${result.target_amount?.toLocaleString("en-IN")}`],
//           ["Monthly Savings Required", `${rupee}${result.monthly_savings?.toLocaleString("en-IN")}`],
//           ["Total Earnings", `${rupee}${result.total_earnings?.toLocaleString("en-IN")}`],
//           ["Inflation Rate", `${result.inflation_rate}%`],
//           ["Expected Return", `${result.expected_return}%`]
//         );
//         break;

//       default:
//         break;
//     }

//     doc.autoTable({
//       startY: 30,
//       head: [["Parameter", "Value"]],
//       body: summaryData,
//       theme: "grid",
//       headStyles: { fillColor: [4, 63, 121], textColor: 255 },
//     });

//     // Include yearly breakdown if available
//     if (result.list && Array.isArray(result.list) && result.list.length > 0) {
//       const yearHeaders = Object.keys(result.list[0]).map((key) =>
//         key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
//       );
//       const yearData = result.list.map((row: any) =>
//         Object.values(row).map((val) =>
//           typeof val === "number" ? `${rupee}${val.toLocaleString("en-IN")}` : val
//         )
//       );
//       doc.autoTable({
//         startY: doc.lastAutoTable.finalY + 10,
//         head: [yearHeaders],
//         body: yearData,
//         theme: "grid",
//         headStyles: { fillColor: [0, 123, 255], textColor: 255 },
//       });
//     }

//     doc.save(`${activeTab.replace(/ /g, "_")}_Report.pdf`);
//   };

//   return (
//     <button
//       onClick={handleDownload}
//       className="px-4 py-2 bg-[#043F79] text-white rounded hover:bg-blue-700"
//     >
//       Download Report
//     </button>
//   );
// }



"use client";

import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PDFDownloadButtonProps {
  activeTab: string;
  result?: any;
  currentAge?: number;
  retirementAge?: number;
  disabled?: boolean; // disable while calculation is loading
}

export default function PDFDownloadButton({
  activeTab,
  result,
  currentAge,
  retirementAge,
  disabled = false,
}: PDFDownloadButtonProps) {
  const handleDownload = () => {
    if (!result) return; // do nothing if result is not ready

    const doc = new jsPDF();
   const rupee = "Rs. ";


    doc.setFontSize(16);
    doc.text(`${activeTab} Report`, 14, 20);

    const summaryData: (string | number | undefined)[][] = [];

    switch (activeTab) {
      case "SIP Growth":
      case "Step-Up SIP":
        summaryData.push(
          ["SIP Amount", result.sip_amount ? `${rupee}${result.sip_amount.toLocaleString("en-IN")}` : "—"],
          ["Interest Rate", result.interest_rate ? `${result.interest_rate}%` : "—"],
          ["Period (Months)", result.period ?? "—"],
          ["Invested Amount", result.invested_amount ? `${rupee}${result.invested_amount.toLocaleString("en-IN")}` : "—"],
          ["Growth Value", result.growth_value ? `${rupee}${result.growth_value.toLocaleString("en-IN")}` : "—"],
          ["Maturity Amount", result.maturity_amount ? `${rupee}${result.maturity_amount.toLocaleString("en-IN")}` : "—"]
        );
        break;

      case "Lumpsum":
        summaryData.push(
          ["Lumpsum Amount", result.lumpsum_amount ? `${rupee}${result.lumpsum_amount.toLocaleString("en-IN")}` : "—"],
          ["Expected Return", result.expected_return ? `${result.expected_return}%` : "—"],
          ["Investment Period", result.years ? `${result.years} Years` : "—"]
        );
        break;

      case "Goal Planner":
        summaryData.push(
          ["Years", result.years ?? "—"],
          ["Dream Amount", result.dream_amount ? `${rupee}${result.dream_amount.toLocaleString("en-IN")}` : "—"],
          ["Savings Amount", result.savings_amount ? `${rupee}${result.savings_amount.toLocaleString("en-IN")}` : "—"],
          ["Target Amount", result.target_amount ? `${rupee}${result.target_amount.toLocaleString("en-IN")}` : "—"],
          ["Monthly Savings", result.monthly_savings ? `${rupee}${result.monthly_savings.toLocaleString("en-IN")}` : "—"],
          ["Total Earnings", result.total_earnings ? `${rupee}${result.total_earnings.toLocaleString("en-IN")}` : "—"],
          ["Inflation Rate", result.inflation_rate ? `${result.inflation_rate}%` : "—"],
          ["Expected Return", result.expected_return ? `${result.expected_return}%` : "—"]
        );
        break;

      case "Retirement Planner":
        summaryData.push(
          ["Current Age", currentAge ?? "—"],
          ["Retirement Age", retirementAge ?? "—"],
          ["Years to Retirement", result.years ?? "—"],
          ["Target Retirement Corpus", result.target_amount ? `${rupee}${result.target_amount.toLocaleString("en-IN")}` : "—"],
          ["Monthly Savings Required", result.monthly_savings ? `${rupee}${result.monthly_savings.toLocaleString("en-IN")}` : "—"],
          ["Total Earnings", result.total_earnings ? `${rupee}${result.total_earnings.toLocaleString("en-IN")}` : "—"],
          ["Inflation Rate", result.inflation_rate ? `${result.inflation_rate}%` : "—"],
          ["Expected Return", result.expected_return ? `${result.expected_return}%` : "—"]
        );
        break;
    }

    // Add summary table
    autoTable(doc, {
      startY: 30,
      head: [["Parameter", "Value"]],
      body: summaryData,
      theme: "grid",
      headStyles: { fillColor: [4, 63, 121], textColor: 255 },
    });

    // Yearly breakdown table (if exists)
    if (Array.isArray(result.list) && result.list.length > 0) {
      const headers = Object.keys(result.list[0]).map((key) =>
        key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
      );

      const rows = result.list.map((row: any) =>
        Object.values(row).map((val) =>
          typeof val === "number" ? `${rupee}${val.toLocaleString("en-IN")}` : val
        )
      );

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [headers],
        body: rows,
        theme: "grid",
        headStyles: { fillColor: [0, 123, 255], textColor: 255 },
      });
    }

    doc.save(`${activeTab.replace(/\s+/g, "_")}_Report.pdf`);
  };

  return (
    <button
      onClick={handleDownload}
      disabled={disabled || !result} // Disable if loading or result not ready
      className={`px-4 py-2 rounded text-white ${
        disabled || !result
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-[#043F79] hover:bg-blue-700"
      }`}
    >
      Download Report
    </button>
  );
}
