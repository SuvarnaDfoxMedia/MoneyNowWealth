import DashboardCard from "./DashboardCard";
import { ArrowRight } from "lucide-react";

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
  return (
    <DashboardCard className="h-full rounded-[24px] border border-[#E4EAF3] bg-white p-6 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
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

        {/* Active Badge */}
        <span className="inline-flex items-center gap-2 rounded-full border border-[#CFEFDE] bg-[#F1FBF5] px-3 py-[6px] text-[12px] font-semibold text-[#119B59]">
          <span className="h-2 w-2 rounded-full bg-[#16B364]" />
          Active
        </span>
      </div>

      {/* Progress Section */}
      <div className="mt-7 flex items-center gap-5">
        <DashboardCircularProgress
          value={60}
          size={92}
          strokeWidth={8}
          trackColor="#E8EDF5"
          progressColor="#0F6CBD"
          secondaryProgressColor="#14B8A6"
          textColor="#071B39"
        />

        <div>
          <h4 className="text-[16px] font-semibold leading-none text-[#071B39]">
            MoneyNow Basic
          </h4>

          <p className="mt-2 max-w-[150px] text-[14px] leading-6 text-[#6E7B96]">
            4 of 6 EDGE features unlocked
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="my-6 border-t border-[#E9EEF5]" />

      {/* Footer */}
      <div className="flex items-center justify-between">
        <p className="text-[14px] font-medium text-[#7B879F]">
          Next reset : Mar 1
        </p>

        <a
          href="#"
          className="inline-flex items-center gap-1 text-[14px] font-semibold text-[#0A4A87]"
        >
          Manage Plan
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </DashboardCard>
  );
}