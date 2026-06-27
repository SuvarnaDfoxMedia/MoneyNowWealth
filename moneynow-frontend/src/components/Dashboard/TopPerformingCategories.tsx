import Link from "next/link";
import { ArrowRight } from "lucide-react";
import DashboardCard from "./DashboardCard";

type FundCategory = {
  name: string;
  return3y: string;
  return5y: string;
  expenseRatio: string;
  riskLabel: string;
  riskColor: string;
};

const categories: FundCategory[] = [
  {
    name: "Flexi Cap Funds",
    return3y: "15.4%",
    return5y: "13.2%",
    expenseRatio: "1.12%",
    riskLabel: "MODERATE",
    riskColor: "bg-[#DCFCE7] text-[#16A34A]",
  },
  {
    name: "ELSS Funds",
    return3y: "14.1%",
    return5y: "12.6%",
    expenseRatio: "1.20%",
    riskLabel: "TAX-SMART",
    riskColor: "bg-[#DBEAFE] text-[#2563EB]",
  },
  {
    name: "Large & Mid Cap Funds",
    return3y: "16.0%",
    return5y: "13.8%",
    expenseRatio: "1.05%",
    riskLabel: "CONSISTENT",
    riskColor: "bg-[#DCFCE7] text-[#16A34A]",
  },
  {
    name: "Index Funds",
    return3y: "12.8%",
    return5y: "11.4%",
    expenseRatio: "0.45%",
    riskLabel: "LOW",
    riskColor: "bg-[#DCFCE7] text-[#16A34A]",
  },
];

export default function TopPerformingCategories() {
  return (
    <DashboardCard className="mt-4 rounded-xl p-6 md:p-7">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-[22px] font-bold text-[#051338]">
          Top Performing Categories
        </h2>
        <Link 
          href="#" 
          className="group inline-flex items-center gap-1 whitespace-nowrap shrink-0 rounded-sm bg-[#0A4A87] px-5 py-2 text-[14px] font-semibold text-white shadow-sm transition-all hover:bg-[#083A69]"
        >
          View all funds
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-up-right h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 text-white" aria-hidden="true"><path d="M7 7h10v10"></path><path d="M7 17 17 7"></path></svg>
        </Link>
      </div>

      {/* Table */}
      <div className="w-full overflow-hidden overflow-x-auto rounded-xl border border-[#E7ECF5]">
        <table className="w-full min-w-[700px] border-collapse text-left">
          <thead>
            <tr className="bg-[#F1F5F9]">
              <th className="px-6 py-4 text-[13px] font-semibold uppercase tracking-wide text-[#64748B] md:px-7">
                CATEGORY
              </th>
              <th className="px-4 py-4 text-[13px] font-semibold uppercase tracking-wide text-[#64748B]">
                3Y RETURNS
              </th>
              <th className="px-4 py-4 text-[13px] font-semibold uppercase tracking-wide text-[#64748B]">
                5Y RETURNS
              </th>
              <th className="px-4 py-4 text-[13px] font-semibold uppercase tracking-wide text-[#64748B]">
                EXPENSE RATIO
              </th>
              <th className="px-6 py-4 text-[13px] font-semibold uppercase tracking-wide text-[#64748B] md:px-7">
                RISK LEVEL
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9] bg-white">
            {categories.map((cat, index) => (
              <tr key={index} className="transition-colors hover:bg-gray-50/50">
                <td className="px-6 py-3 text-[15px] text-[#0A1633] md:px-7">
                  {cat.name}
                </td>
                <td className="px-4 py-3 text-[15px]  text-[#0A1633]">
                  {cat.return3y}
                </td>
                <td className="px-4 py-3 text-[15px]  text-[#0A1633]">
                  {cat.return5y}
                </td>
                <td className="px-4 py-3 text-[15px]  text-[#0A1633]">
                  {cat.expenseRatio}
                </td>
                <td className="px-6 py-3 md:px-7">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide ${cat.riskColor}`}
                  >
                    {cat.riskLabel}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardCard>
  );
}
