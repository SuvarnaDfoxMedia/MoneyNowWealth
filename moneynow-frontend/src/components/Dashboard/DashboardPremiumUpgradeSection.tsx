import { ArrowRight } from "lucide-react";
import DashboardPlanUsageCard from "./DashboardPlanUsageCard";

export default function DashboardPremiumUpgradeSection() {
  return (
    <section className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[2.2fr_1fr]">
      <div className="relative overflow-hidden rounded-3xl bg-[#0A4A87] p-7 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,#ffffff30_1px,transparent_1px),linear-gradient(to_bottom,#ffffff30_1px,transparent_1px)] [background-size:36px_36px]" />
        <div className="relative">
          <span className="inline-flex rounded-full bg-[#0F5CA9] px-4 py-1 text-[12px] font-semibold">MoneyNow EDGE</span>
          <h3 className="mt-5 text-[34px] font-semibold leading-[1.2]">Unlock premium features with MoneyNow EDGE</h3>
          <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[#DCE9FF]">
            Make sharper investment decisions with curated research, advanced calculators, and analyst-led newsletters.
          </p>
          <button className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-[14px] font-semibold text-[#0A4A87] transition-all duration-300 hover:bg-[#EDF4FF]">
            Upgrade to MoneyNow EDGE <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <DashboardPlanUsageCard />
    </section>
  );
}

