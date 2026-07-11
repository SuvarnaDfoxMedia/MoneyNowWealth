import DashboardCard from "./DashboardCard";
import { ArrowRight } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import Link from "next/link";

function DashboardCircularProgress({
  value,
  size = 92,
  strokeWidth = 8,
  trackColor = "#E8EDF5",
  progressColor = "#0F6CBD",
  secondaryProgressColor = "#14B8A6",
  textColor = "#071B39",
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  trackColor?: string;
  progressColor?: string;
  secondaryProgressColor?: string;
  textColor?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = circumference - (value / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90"
      >
        <defs>
          <linearGradient
            id="progressGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={secondaryProgressColor} />
            <stop offset="100%" stopColor={progressColor} />
          </linearGradient>
        </defs>

        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
        />
      </svg>

      {/* Center Text */}
      <div className="absolute flex flex-col items-center justify-center">
        <span
          className="text-[18px] font-bold leading-none"
          style={{ color: textColor }}
        >
          {value}%
        </span>

        <span className="mt-1 text-[11px] font-medium text-[#8A94A6]">
          Unlocked
        </span>
      </div>
    </div>
  );
}

export default function DashboardPlanUsageCard() {
  const { currentSubscription, latestSubscription } = useSubscription();
  const subscriptionCard = currentSubscription || latestSubscription;
  
  const isPremiumActive = currentSubscription?.isPremium === true && currentSubscription?.isActive === true;

  const isExpiredPremium = 
    !isPremiumActive && 
    latestSubscription?.planName?.toLowerCase().includes("premium") === true;

  const planName = isPremiumActive ? "MoneyNow EDGE" : "MoneyNow Basic";
  const percentage = isPremiumActive ? 100 : 0;
  const featuresText = isPremiumActive ? "6 of 6 EDGE features unlocked" : "0 of 6 EDGE features unlocked";
  
  let nextResetText = "Lifetime access";
  if (isPremiumActive && subscriptionCard?.endDate) {
    nextResetText = `Next reset : ${new Date(subscriptionCard.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  } else if (isExpiredPremium) {
    nextResetText = "Expired";
  }

  const badgeText = isPremiumActive ? "Active" : isExpiredPremium ? "Expired" : "Active";
  const badgeColorClass = isExpiredPremium 
    ? "border-[#FDE8E8] bg-[#FDF2F2] text-[#C81E1E]" 
    : "border-[#CFEFDE] bg-[#F1FBF5] text-[#119B59]";
  const dotColorClass = isExpiredPremium ? "bg-[#E02424]" : "bg-[#16B364]";

  return (
    <DashboardCard className="h-full rounded-[24px] border border-[#E4EAF3] bg-white p-6 shadow-[0_2px_10px_rgba(15,23,42,0.03)] flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-[18px] font-semibold text-[#071B39]">
              Your Plan
            </h3>

            <p className="mt-2 text-[13px] font-medium text-[#6E7B96]">
              Current plan
            </p>
          </div>

          {/* Status Badge */}
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-[6px] text-[12px] font-semibold ${badgeColorClass}`}>
            <span className={`h-2 w-2 rounded-full ${dotColorClass}`} />
            {badgeText}
          </span>
        </div>

        {/* Progress Section */}
        <div className="mt-7 flex items-center gap-5">
          <DashboardCircularProgress
            value={percentage}
            size={92}
            strokeWidth={8}
            trackColor="#E8EDF5"
            progressColor="#0F6CBD"
            secondaryProgressColor="#14B8A6"
            textColor="#071B39"
          />

          <div>
            <h4 className="text-[16px] font-semibold leading-none text-[#071B39]">
              {planName}
            </h4>

            <p className="mt-2 max-w-[150px] text-[14px] leading-6 text-[#6E7B96]">
              {featuresText}
            </p>
          </div>
        </div>
      </div>

      <div>
        {/* Divider */}
        <div className="my-6 border-t border-[#E9EEF5]" />

        {/* Footer */}
        <div className="flex items-center justify-between">
          <p className="text-[14px] font-medium text-[#7B879F]">
            {nextResetText}
          </p>

          <Link
            href="/user/dashboard/subscription"
            className="inline-flex items-center gap-1 text-[14px] font-semibold text-[#0A4A87] hover:text-[#083B6C] transition-colors"
          >
            Manage Plan
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </DashboardCard>
  );
}