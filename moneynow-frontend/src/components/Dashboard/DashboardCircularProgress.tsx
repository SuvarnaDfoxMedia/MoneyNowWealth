type DashboardCircularProgressProps = {
  value: number;
  size?: number;
  strokeWidth?: number;
  trackClassName?: string;
  progressClassName?: string;
  textClassName?: string;
  suffix?: string;
};

export default function DashboardCircularProgress({
  value,
  size = 68,
  strokeWidth = 8,
  trackClassName = "stroke-[#E5EAF3]",
  progressClassName = "stroke-[#1B78D4]",
  textClassName = "fill-[#0B1220] text-[14px] font-semibold",
  suffix = "%",
}: DashboardCircularProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (clamped / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 transform">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        fill="none"
        className={trackClassName}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        className={`${progressClassName} transition-all duration-300`}
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        className={`${textClassName} rotate-90`}
      >
        {clamped}
        {suffix}
      </text>
    </svg>
  );
}
