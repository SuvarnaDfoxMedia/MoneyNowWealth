import DashboardCard from "./DashboardCard";

function DashboardCircularProgress({
  value,
  size = 46,
  strokeWidth = 4.5,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Exact 33% progress
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
        {/* Background Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
        />

        {/* Progress Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#11A7B5"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
        />
      </svg>

      {/* Percentage Text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[12px] font-bold leading-none text-[#1E293B]">
          {value}%
        </span>
      </div>
    </div>
  );
}

export default function DashboardProfileCompletionCard() {
  return (
    <DashboardCard className="flex min-h-[82px] items-center gap-4 rounded-[16px] border border-[#E5EAF1] bg-[#F8FAFC] px-4 py-3 shadow-none">
      {/* Progress */}
      <DashboardCircularProgress
        value={33}
        size={46}
        strokeWidth={4.5}
      />

      {/* Content */}
      <div>
        <h4 className="text-[16px] font-semibold leading-none text-[#1E293B]">
          Profile complete
        </h4>

        <p className="mt-[8px] text-[12px] font-medium leading-none text-[#74829A]">
          Get started in 3 simple steps
        </p>
      </div>
    </DashboardCard>
  );
}