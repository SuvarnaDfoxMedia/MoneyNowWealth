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
  glow: string;
  cta: string;
  ctaColor: string;
  items: string[];
};

export default function DashboardInsightsGrid() {
  const cards: InsightCard[] = [
    {
      id: "insights",
      title: "Latest Insights",
      description:
        "How rate cuts could reshape your fixed income portfolio",
      badge: "NEW",
      icon: "Lightbulb",
      iconBg: "bg-[#F3EEFF]",
      iconColor: "text-[#7C3AED]",
      badgeStyle: "bg-[#F3EEFF] text-[#7C3AED]",
      bulletColor: "bg-[#7C3AED]",
      glow: "rgba(124, 92, 255, 1)",
      cta: "View all insights",
      ctaColor: "text-[#7C3AED]",
      items: [
        "Why mid caps are showing strength",
        "Top 5 SIP strategies for 2026",
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
      glow: "rgba(22, 163, 74, 1)",
      cta: "Open Calculators",
      ctaColor: "text-[#16A34A]",
      items: ["SIP Calculator", "Goal Calculator"],
    },
    {
      id: "research",
      title: "MF Research",
      description:
        "Curated mutual fund research from top analysts",
      badge: "REPORTS",
      icon: "TrendingUp",
      iconBg: "bg-[#EEF4FF]",
      iconColor: "text-[#2563EB]",
      badgeStyle: "bg-[#EEF4FF] text-[#2563EB]",
      bulletColor: "bg-[#2563EB]",
      glow: "rgba(37, 99, 235, 1)",
      cta: "View Research",
      ctaColor: "text-[#2563EB]",
      items: [
        "Top Performing Large Cap Funds",
        "Best Debt Funds to Consider",
      ],
    },
    {
      id: "toolkit",
      title: "Wealth Toolkit",
      description:
        "Everything you need to track and grow your wealth",
      badge: "PREMIUM",
      icon: "Hammer",
      iconBg: "bg-[#FFF4E6]",
      iconColor: "text-[#F97316]",
      badgeStyle: "bg-[#FFF4E6] text-[#F97316]",
      bulletColor: "bg-[#F97316]",
      glow: "rgba(249, 115, 22, 1)",
      cta: "Open Toolkit",
      ctaColor: "text-[#F97316]",
      items: ["SIP Tracker", "Goal Planner"],
    },
  ];

   const getGlow = (color: string) => ({
    background: `linear-gradient(
      90deg,
      ${color}22 0%,
      ${color} 50%,
      ${color}22 100%
    )`,
  });

  return (
    <section className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <DashboardCard
          key={card.id}
          className="relative flex h-full flex-col rounded-3xl border border-[#EEF2F7] bg-white p-6 shadow-sm transition hover:shadow-md overflow-hidden"
        >
          <div
            className="absolute left-0 top-0 h-[2px] w-full"
            style={getGlow(card.glow)}
          />

          {/* TOP HEADER */}
          <div className="flex items-center justify-between">
            <div
              className={`grid h-12 w-12 place-items-center rounded-md ${card.iconBg}`}
            >
              <DashboardIcon
                name={card.icon}
                className={`h-5 w-5 ${card.iconColor}`}
              />
            </div>

            <span
              className={`rounded-full px-3 py-1 text-[12px] font-semibold uppercase tracking-wide ${card.badgeStyle}`}
            >
              {card.badge}
            </span>
          </div>

          {/* TITLE */}
          <h3 className="mt-5 text-[18px] font-semibold text-[#0A1633]">
            {card.title}
          </h3>

          {/* DESCRIPTION */}
          <p className="mt-2 text-[14px] leading-[1.6] text-[#64748B]">
            {card.description}
          </p>

          {/* LIST */}
          <ul className="mt-4 mb-4 space-y-2">
            {card.items.map((item, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-[14px] text-[#475569]"
              >
                <span
                  className={`mt-[6px] h-2 w-2 shrink-0 rounded-full ${card.bulletColor}`}
                />
                {item}
              </li>
            ))}
          </ul>

          {/* CTA FIXED */}
          <div className="mt-auto flex items-center justify-between border-t border-[#EEF2F7] pt-4">
            <button
              className={`text-[14px] font-semibold ${card.ctaColor}`}
            >
              {card.cta}
            </button>

            <ArrowUpRight className={`h-4 w-4 ${card.ctaColor}`} />
          </div>
        </DashboardCard>
      ))}
    </section>
  );
}