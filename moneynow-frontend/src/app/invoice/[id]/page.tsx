

"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { API } from "@/app/api/axios";

interface InvoiceData {
  _id: string;
  invoiceId: string;
  planName: string;
  amount: number;
  currency: string;
  paymentDate: string;
  transactionId?: string;
  orderId?: string;
  type: string;
  user: {
    firstname: string;
    lastname: string;
    email: string;
  };
  validity?: {
    startDate: string;
    endDate: string;
  };
  startDate?: string;
  endDate?: string;
  paymentMethod?: string;
  paymentStatus?: string;
}

const safeDate = (value?: string) => {
  if (!value) return "-";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("en-GB");
};

const InvoicePage = () => {
  const router = useRouter();
  const { id } = useParams();

  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!id) {
        setError("No invoice ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await API.get(`/api/subscription-payment/invoice/${id}`, {
          withCredentials: true,
        });

        if (res.data.success && res.data.invoice) {
          setInvoice(res.data.invoice);
        } else {
          setError("Invoice not found or invalid data");
        }
      } catch (err: any) {
        console.error("Error fetching invoice:", err);
        setError(err.response?.data?.message || "Failed to load invoice");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  const handleDownload = async () => {
    if (!invoiceRef.current || !invoice) return;

    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(
        `Invoice_${invoice.invoiceId}_${invoice.user.firstname}_${invoice.user.lastname}.pdf`,
      );
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("PDF generation failed.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-[#6B7280]">
        Loading invoice...
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-[#B91C1C]">
        <p className="mb-4">{error || "Invoice not found."}</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-[#043F79] text-white rounded hover:bg-[#032f5c] transition"
        >
          &larr; Go Back
        </button>
      </div>
    );
  }

  const validityStart =
    invoice.validity?.startDate || invoice.startDate || invoice.paymentDate;

  const validityEnd =
    invoice.validity?.endDate || invoice.endDate || invoice.paymentDate;

  const statusColor =
    invoice.paymentStatus === "success"
      ? "bg-[#DCFCE7] text-[#166534]"
      : invoice.paymentStatus === "pending"
        ? "bg-[#FEF9C3] text-[#78350F]"
        : "bg-[#F3F4F6] text-[#374151]";

  return (
    <div className="max-w-5xl mx-auto my-[50px] min-h-screen">
      <div className="flex justify-end gap-4 mb-6">
        <button
          onClick={handleDownload}
          className="px-4 py-2 bg-[#043F79] text-white rounded flex items-center gap-2 hover:bg-[#032f5c] transition"
        >
          Download PDF
        </button>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-[#043F79] text-white rounded flex items-center gap-2 hover:bg-[#032f5c] transition"
        >
          &larr; Back
        </button>
      </div>

      <div
        ref={invoiceRef}
        className="bg-[#ffffff] shadow-sm rounded-lg overflow-hidden"
      >
        <div className="flex justify-between items-center bg-[#F9FAFB] p-6 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-4">
            <Image
              src="/images/moneynow-logo.png"
              alt="Logo"
              width={120}
              height={50}
              className="object-contain"
            />
            <span className="text-2xl font-bold tracking-wide text-[#111827]">
              Invoice
            </span>
          </div>

          <div className="text-right">
            <p className="text-[#4B5563] text-sm mb-1">
              Date: {safeDate(invoice.paymentDate)}
            </p>
            <p className="text-[#4B5563] text-sm mb-1">
              Invoice #: {invoice.invoiceId?.substring(0, 8)}
            </p>
            <span
              className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${statusColor}`}
            >
              {invoice.paymentStatus?.toUpperCase() || "PAID"}
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 p-6 border-b border-[#E5E7EB]">
          <div>
            <h3 className="uppercase text-[#6B7280] text-sm font-semibold mb-2">
              Billed To
            </h3>
            <p className="text-[#111827] font-medium">
              {invoice.user.firstname} {invoice.user.lastname}
            </p>
            <p className="text-[#374151] text-sm">{invoice.user.email}</p>
          </div>

          <div className="text-right">
            <h3 className="uppercase text-[#6B7280] text-sm font-semibold mb-2">
              Company
            </h3>
            <p className="text-[#111827] font-medium">Your Company Name</p>
            <p className="text-[#374151] text-sm">support@example.com</p>
            <p className="text-[#374151] text-sm">+91 1234567890</p>
          </div>
        </div>

        <div className="p-6 border-b border-[#E5E7EB]">
          <h3 className="text-[#111827] text-lg font-semibold mb-4">
            Subscription Summary
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border border-[#E5E7EB] rounded-lg">
              <thead className="bg-[#F9FAFB]">
                <tr className="text-[#4B5563] text-sm">
                  <th className="p-4 border-b border-[#E5E7EB]">Plan Name</th>
                  <th className="p-4 border-b border-[#E5E7EB]">Start Date</th>
                  <th className="p-4 border-b border-[#E5E7EB]">End Date</th>
                  <th className="p-4 border-b border-[#E5E7EB]">Amount</th>
                  <th className="p-4 border-b border-[#E5E7EB]">Type</th>
                  <th className="p-4 border-b border-[#E5E7EB]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                <tr className="text-[#111827]">
                  <td className="p-4">{invoice.planName}</td>
                  <td className="p-4">{safeDate(validityStart)}</td>
                  <td className="p-4">{safeDate(validityEnd)}</td>
                  <td className="p-4 font-semibold">
                    ₹{Number(invoice.amount || 0).toFixed(2)}
                  </td>
                  <td className="p-4">{invoice.type}</td>
                  <td className="p-4">
                    <span
                      className={`inline-block px-2 py-1 text-xs font-semibold rounded ${statusColor}`}
                    >
                      {invoice.paymentStatus?.toUpperCase() || "PAID"}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 p-6 border-b border-[#E5E7EB]">
          <div>
            <h3 className="uppercase text-[#6B7280] text-sm font-semibold mb-2">
              Payment Details
            </h3>
            <p className="text-[#111827] mb-1">
              <span className="font-medium">Transaction ID:</span>{" "}
              {invoice.transactionId || "N/A"}
            </p>
            <p className="text-[#111827] mb-1">
              <span className="font-medium">Order ID:</span>{" "}
              {invoice.orderId || "N/A"}
            </p>
            <p className="text-[#111827]">
              <span className="font-medium">Payment Method:</span>{" "}
              {invoice.paymentMethod || "Online"}
            </p>
          </div>

          <div>
            <h3 className="uppercase text-[#6B7280] text-sm font-semibold mb-2">
              Subscription Period
            </h3>
            <p className="text-[#111827] mb-1">
              <span className="font-medium">Start Date:</span>{" "}
              {safeDate(validityStart)}
            </p>
            <p className="text-[#111827] mb-1">
              <span className="font-medium">End Date:</span>{" "}
              {safeDate(validityEnd)}
            </p>
            <p className="text-[#111827]">
              <span className="font-medium">Payment Date:</span>{" "}
              {safeDate(invoice.paymentDate)}
            </p>
          </div>
        </div>

        <div className="p-6 flex justify-end border-b border-[#E5E7EB]">
          <div className="w-full md:w-1/3 bg-[#F9FAFB] rounded-lg p-4">
            <div className="flex justify-between mb-2">
              <span className="text-[#4B5563] font-medium">Subtotal</span>
              <span className="font-semibold">
                ₹{Number(invoice.amount || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-[#4B5563] font-medium">Tax (0%)</span>
              <span className="font-semibold">₹0.00</span>
            </div>
            <div className="flex justify-between mt-2 border-t border-[#E5E7EB] pt-2 text-lg font-bold">
              <span>Total Amount</span>
              <span>₹{Number(invoice.amount || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="p-6 text-center text-[#6B7280] text-sm bg-[#F9FAFB]">
          <p className="mb-2">
            Thank you for subscribing to{" "}
            <span className="font-semibold">{invoice.planName}</span>.
          </p>
          <p className="mb-2">
            For any queries or support, please contact us at{" "}
            <span className="font-medium">support@example.com</span>.
          </p>
          <p className="text-xs text-[#9CA3AF] mt-4">
            This is an auto-generated invoice. No signature required.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvoicePage;
