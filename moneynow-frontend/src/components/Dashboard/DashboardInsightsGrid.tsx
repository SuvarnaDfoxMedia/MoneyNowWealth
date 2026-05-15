import DashboardCard from "./DashboardCard";
import DashboardIcon from "./DashboardIcon";
import { ArrowUpRight } from "lucide-react";
import type { LucideIconName } from "@/lib/dashboard-data";

type InsightCard = {
  id: string;
  title: string;
  description: string;
  badge: string;
  icon: LucideIconName;
  iconBg: string;
  iconColor: string;
  badgeStyle: string;
  bulletColor: string;
  glowColor: string; // Used for the top border gradient
  cta: string;
  ctaColor: string;
  items: string[];
};

export default function DashboardInsightsGrid() {
  const cards: InsightCard[] = [
    {
      id: "insights",
      title: "Latest Insights",
      description: "How rate cuts could reshape your fixed income portfolio",
      badge: "NEW",
      icon: "Lightbulb",
      iconBg: "bg-[#F3EEFF]",
      iconColor: "text-[#7C3AED]",
      badgeStyle: "bg-[#F3EEFF] text-[#7C3AED]",
      bulletColor: "bg-[#7C3AED]",
      glowColor: "#7C3AED",
      cta: "View all insights",
      ctaColor: "text-[#7C3AED]",
      items: [
        "Why mid caps are showing strength",
        "Top 5 SIP strategies for 2026",
        "Decoding the new tax regime",
      ],
    },
    {
      id: "calculators",
      title: "Calculators",
      description: "Plan smarter with built-for-fintech calculators",
      badge: "TOOLS",
      icon: "Calculator",
      iconBg: "bg-[#E9FAF2]",
      iconColor: "text-[#16A34A]",
      badgeStyle: "bg-[#E9FAF2] text-[#16A34A]",
      bulletColor: "bg-[#16A34A]",
      glowColor: "#16A34A",
      cta: "Open Calculators",
      ctaColor: "text-[#16A34A]",
      items: [
        "SIP Calculator",
        "Goal Calculator",
        "Retirement Calculator",
        "Lumpsum Calculator",
      ],
    },
    {
      id: "research",
      title: "MF Research",
      description: "Curated mutual fund research from top analysts",
      badge: "REPORTS",
      icon: "TrendingUp",
      iconBg: "bg-[#EEF4FF]",
      iconColor: "text-[#2563EB]",
      badgeStyle: "bg-[#EEF4FF] text-[#2563EB]",
      bulletColor: "bg-[#2563EB]",
      glowColor: "#2563EB",
      cta: "View Research",
      ctaColor: "text-[#2563EB]",
      items: [
        "Top Performing Large Cap Funds",
        "Best Debt Funds to Consider",
        "Small Cap Funds Analysis",
        "Monthly Market Outlook",
      ],
    },
    {
      id: "toolkit",
      title: "Wealth Toolkit",
      description: "Everything you need to track and grow your wealth",
      badge: "PREMIUM",
      icon: "Hammer",
      iconBg: "bg-[#FFF4E6]",
      iconColor: "text-[#F97316]",
      badgeStyle: "bg-[#FFF4E6] text-[#F97316]",
      bulletColor: "bg-[#F97316]",
      glowColor: "#F97316",
      cta: "Open Toolkit",
      ctaColor: "text-[#F97316]",
      items: [
        "SIP Tracker",
        "Goal Planner",
        "Risk Profiler",
        "Asset Allocation Guide",
      ],
    },
  ];

  const getGlowStyle = (hexColor: string) => ({
    background: `linear-gradient(
      90deg, 
      transparent 0%, 
      ${hexColor}33 20%, 
      ${hexColor} 40%,   
      ${hexColor} 60%,    
      ${hexColor}33 80%, 
      transparent 100%
    )`,
  });

  return (
    <section className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <DashboardCard
          key={card.id}
          className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-[#EEF2F7] bg-white p-6 shadow-sm transition-all hover:shadow-md"
        >
          <div
            className="absolute left-0 top-0 h-[1.5px] w-full"
            style={getGlowStyle(card.glowColor)}
          />

          {/* HEADER */}
          <div className="flex items-center justify-between">
            <div
              className={`grid h-12 w-12 place-items-center rounded-xl ${card.iconBg}`}
            >
              <DashboardIcon
                name={card.icon}
                className={`h-5 w-5 ${card.iconColor}`}
              />
            </div>

            <span
              className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${card.badgeStyle}`}
            >
              {card.badge}
            </span>
          </div>

          {/* TITLE */}
          <h3 className="mt-5 text-[18px] font-bold text-[#0A1633]">
            {card.title}
          </h3>

          {/* DESCRIPTION */}
          <p className="mt-2 text-[14px] leading-[1.6] text-[#64748B]">
            {card.description}
          </p>

          {/* LIST ITEMS */}
          <ul className="mb-6 mt-5 space-y-3">
            {card.items.map((item, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 text-[14px] font-medium text-[#475569]"
              >
                <span
                  className={`mt-[6px] h-[6px] w-[6px] shrink-0 rounded-full ${card.bulletColor}`}
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          {/* FOOTER */}
          <div className="mt-auto flex items-center justify-between border-t border-[#F1F5F9] pt-4">
            <button
              className={`text-[14px] font-bold transition-opacity hover:opacity-70 ${card.ctaColor}`}
            >
              {card.cta}
            </button>

            <ArrowUpRight
              className={`h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ${card.ctaColor}`}
            />
          </div>
        </DashboardCard>
      ))}
    </section>
  );
}
