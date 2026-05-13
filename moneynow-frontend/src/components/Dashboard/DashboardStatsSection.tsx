import {
  Target,
  Wrench,
  CalendarDays,
  TrendingUp,
} from "lucide-react";

const stats = [
  {
    id: "goals",
    label: "GOALS SET",
    value: "0 / 3",
    icon: Target,
    iconBg: "bg-[#F4F7FC]",
    iconColor: "text-[#215BAA]",
  },
  {
    id: "tools",
    label: "TOOLS USED",
    value: "0",
    icon: Wrench,
    iconBg: "bg-[#EEF9F3]",
    iconColor: "text-[#1BAA63]",
  },
  {
    id: "member",
    label: "MEMBER SINCE",
    value: "Today",
    icon: CalendarDays,
    iconBg: "bg-[#F4F7FC]",
    iconColor: "text-[#215BAA]",
  },
  {
    id: "risk",
    label: "RISK SCORE",
    value: "Pending",
    icon: TrendingUp,
    iconBg: "bg-[#FFF5EC]",
    iconColor: "text-[#F08A24]",
  },
];

export default function DashboardStatsSection() {
  return (
    <section className="mt-6 rounded-xl border border-[#EEF2F7] bg-[#FAFBFD] px-4 py-4">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.id}
              className="flex items-center gap-4"
            >
              {/* Icon */}
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-full ${stat.iconBg}`}
              >
                <Icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>

              {/* Content */}
              <div>
                <p className="text-[12px] font-medium uppercase tracking-[0.10em] text-[#7D8CA8]">
                  {stat.label}
                </p>

                <p className="mt-3 text-[22px] font-semibold leading-none text-[#081225]">
                  {stat.value}
                </p>
              </div>
            </div>
          );
        })}

      </div>
    </section>
  );
}