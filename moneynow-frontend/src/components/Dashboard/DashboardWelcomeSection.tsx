import DashboardProfileCompletionCard from "./DashboardProfileCompletionCard";
import DashboardStatsSection from "./DashboardStatsSection";
import DashboardOnboardingCards from "./DashboardOnboardingCards";
import DashboardCard from "./DashboardCard";

export default function DashboardWelcomeSection() {
  return (
    <DashboardCard className="mt-4 rounded-[24px] p-6 md:p-7">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#0A4A87] px-4 py-2 text-[12px] font-semibold text-white">
            ONBOARDING <span className="text-[#CFE6FF]">Step 1 of 3</span>
          </span>
          <h1 className="mt-5 text-[30px] font-semibold leading-[1.15] text-[#051338]">
            Welcome to <span className="text-[#0A4A87]">MoneyNow</span>, Gautami! 👋
          </h1>
          <p className="mt-2 text-[15px] text-[#60729B]">
            You&apos;re all set! Explore our tools and resources to start your investment journey.
          </p>
        </div>
        <div className="w-full xl:max-w-[320px]">
          <DashboardProfileCompletionCard />
        </div>
      </div>

      <DashboardStatsSection />
      <DashboardOnboardingCards />
    </DashboardCard>
  );
}


