"use client";

import { useMemo } from "react";
import DashboardProfileCompletionCard from "./DashboardProfileCompletionCard";
import DashboardStatsSection from "./DashboardStatsSection";
import DashboardOnboardingCards from "./DashboardOnboardingCards";
import DashboardCard from "./DashboardCard";
import { useProfileStore } from "@/stores/profileStore";
import { getPreferredUserName } from "@/utils/profileHelpers";

export default function DashboardWelcomeSection() {
  const profile = useProfileStore((state) => state.profile);
  const displayName = useMemo(() => getPreferredUserName(profile), [profile]);

  return (
    <DashboardCard className="mt-4 rounded-[24px] p-6 md:p-7">
      {/* Top Section */}
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        {/* Left Content */}
        <div className="flex-1">
          {/* Badge */}
          <span className="inline-flex items-center gap-2 rounded-full bg-[#0A4A87] px-4 py-2 text-[12px] font-semibold tracking-[0.2px] text-white">
            ONBOARDING
            <span className="text-[#CFE6FF]">Step 1 of 3</span>
          </span>

          {/* Heading */}
          <h1 className="mt-5 text-[30px] font-semibold leading-[1.15] tracking-[-0.6px] text-[#051338]">
            Welcome to <span className="text-[#0A4A87]">MoneyNow</span>
            {displayName ? `, ${displayName}!` : "!"}{" "}
            <span className="inline-block origin-[70%_70%] animate-wave pl-1">
              👋
            </span>
          </h1>

          {/* Description */}
          <p className="mt-3 max-w-[760px] text-[15px] leading-7 text-[#60729B]">
            You&apos;re all set! Explore our tools and resources to start your
            investment journey.
          </p>
        </div>

        {/* Right Card */}
        <div className="w-full xl:flex xl:max-w-[320px] xl:items-center xl:justify-end">
          <DashboardProfileCompletionCard />
        </div>
      </div>

      {/* Stats */}
      <DashboardStatsSection />

      {/* Onboarding Cards */}
      <DashboardOnboardingCards />
    </DashboardCard>
  );
}
