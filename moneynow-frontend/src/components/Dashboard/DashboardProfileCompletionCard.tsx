import DashboardCircularProgress from "./DashboardCircularProgress";
import DashboardCard from "./DashboardCard";

export default function DashboardProfileCompletionCard() {
  return (
    <DashboardCard className="flex min-h-[118px] items-center gap-4 rounded-3xl px-5 py-4">
      <DashboardCircularProgress
        value={33}
        size={62}
        strokeWidth={7}
        trackClassName="stroke-[#E6EBF3]"
        progressClassName="stroke-[#17B787]"
        textClassName="fill-[#101A33] text-[12px] font-semibold"
      />
      <div>
        <p className="text-[14px] font-semibold text-[#0F1F45]">Profile complete</p>
        <p className="mt-1 text-[15px] text-[#6374A2]">Get started in 3 simple steps</p>
      </div>
    </DashboardCard>
  );
}
