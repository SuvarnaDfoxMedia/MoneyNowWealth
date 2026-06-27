"use client";

import { CalendarDays, Target, TrendingUp, Wrench } from "lucide-react";
import { useProfileStore } from "@/stores/profileStore";

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
    value: "-",
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

const formatMemberSince = (value?: string) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function DashboardStatsSection() {
  const profile = useProfileStore((state) => state.profile);
  const memberSince = formatMemberSince(profile?.created_at);

  return (
    <section className="mt-6 rounded-xl border border-[#EEF2F7] bg-[#FAFBFD] px-4 py-4">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const value = stat.id === "member" ? memberSince : stat.value;

          return (
            <div key={stat.id} className="flex items-center gap-4">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-full ${stat.iconBg}`}
              >
                <Icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>

              <div>
                <p className="text-[12px] font-medium uppercase tracking-[0.10em] text-[#7D8CA8]">
                  {stat.label}
                </p>

                <p className="mt-3 text-[22px] font-semibold leading-none text-[#081225]">
                  {value}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
