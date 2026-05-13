import DashboardCard from "./DashboardCard";
import DashboardCircularProgress from "./DashboardCircularProgress";

export default function DashboardPlanUsageCard() {
  return (
    <DashboardCard className="h-full rounded-3xl p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[30px] font-semibold leading-[1.15] text-[#040C20]">Your Plan</h3>
        <span className="rounded-full bg-[#E8F7EE] px-3 py-1 text-[12px] font-semibold text-[#1A9A4D]">• Active</span>
      </div>

      <div className="mt-5 flex items-center gap-5">
        <DashboardCircularProgress value={60} size={92} strokeWidth={8} />
        <div>
          <p className="text-[18px] font-semibold text-[#050D1F]">MoneyNow Basic</p>
          <p className="mt-1 text-[15px] text-[#62739D]">4 of 6 EDGE features unlocked</p>
        </div>
      </div>

      <div className="my-5 border-t border-[#E7ECF5]" />

      <div className="flex items-center justify-between text-[15px]">
        <p className="text-[#7383A9]">Next reset : Mar 1</p>
        <a href="#" className="font-semibold text-[#0A4A87]">Manage Plan -&gt;</a>
      </div>
    </DashboardCard>
  );
}
