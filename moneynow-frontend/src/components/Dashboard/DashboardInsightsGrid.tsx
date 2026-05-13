import DashboardCard from "./DashboardCard";
import DashboardIcon from "./DashboardIcon";
import { insightCards } from "@/lib/dashboard-data";

export default function DashboardInsightsGrid() {
  return (
    <section className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {insightCards.map((card) => (
        <DashboardCard key={card.id} className="rounded-3xl p-5" hover>
          <div className={`mb-5 grid h-10 w-10 place-items-center rounded-xl ${card.iconBg}`}>
            <DashboardIcon name={card.icon} className={`h-5 w-5 ${card.iconColor}`} />
          </div>
          <h3 className="text-[16px] font-semibold text-[#030C20]">{card.title}</h3>
          <p className="mt-3 text-[15px] leading-8 text-[#6374A2]">{card.description}</p>
        </DashboardCard>
      ))}
    </section>
  );
}
