import DashboardCard from "./DashboardCard";

const stats = [
  { id: "goals", label: "GOALS SET", value: "0 / 3" },
  { id: "tools", label: "TOOLS USED", value: "0" },
  { id: "member", label: "MEMBER SINCE", value: "Today" },
  { id: "risk", label: "RISK SCORE", value: "Pending" },
];

export default function DashboardStatsSection() {
  return (
    <section className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <DashboardCard key={stat.id} className="rounded-2xl bg-[#FAFBFE] px-4 py-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#7587AD]">{stat.label}</p>
          <p className="mt-2 text-[28px] font-semibold leading-none text-[#040C20]">{stat.value}</p>
        </DashboardCard>
      ))}
    </section>
  );
}
