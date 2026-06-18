import Link from "next/link";
import { Mail } from "lucide-react";
import DashboardCard from "./DashboardCard";

export default function NewsletterBanner() {
  return (
    <DashboardCard className="mt-4 flex flex-col gap-5 rounded-[24px] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6 md:p-7">
      <div className="flex items-center gap-4 sm:gap-5">
        <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-[#F4F8FF] sm:h-[60px] sm:w-[60px]">
          <Mail className="h-6 w-6 text-[#0A4A87] sm:h-7 sm:w-7" strokeWidth={2} />
        </div>
        <div>
          <h3 className="text-[18px] font-bold text-[#051338] sm:text-[20px]">
            Latest Newsletter
          </h3>
          <p className="mt-1 text-[14px] font-medium text-[#64748B] sm:text-[15px]">
            Stay updated with market trends, expert views & more.
          </p>
        </div>
      </div>
      <Link
        href="#"
        className="group inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-[#0A4A87] px-6 py-3 text-[14px] font-semibold text-white transition-all hover:bg-[#083A69] sm:text-[15px]"
      >
        View Latest Newsletter
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-up-right h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 text-white" aria-hidden="true"><path d="M7 7h10v10"></path><path d="M7 17 17 7"></path></svg>
      </Link>
    </DashboardCard>
  );
}
