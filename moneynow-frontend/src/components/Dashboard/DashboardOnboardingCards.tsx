import { ArrowRight } from "lucide-react";
import DashboardCard from "./DashboardCard";
import DashboardIcon from "./DashboardIcon";
import { onboardingCards } from "@/lib/dashboard-data";

export default function DashboardOnboardingCards() {
  return (
    <section className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
      {onboardingCards.map((card) => (
        <DashboardCard key={card.id} hover className="rounded-3xl p-5">
          <div className={`mb-4 grid h-12 w-12 place-items-center rounded-md ${card.iconBg}`}>
            <DashboardIcon name={card.icon} className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-[18px] font-semibold leading-[1.45] text-[#050D1F]">{card.title}</h3>
          <p className="mt-2 min-h-[58px] text-[15px] leading-6 text-[#6374A2]">{card.description}</p>
          <a href="#" className="mt-4 inline-flex items-center gap-1 text-[15px] font-semibold text-[#0A4A87]">
            {card.cta} <ArrowRight className="h-4 w-4" />
          </a>
        </DashboardCard>
      ))}
    </section>
  );
}
