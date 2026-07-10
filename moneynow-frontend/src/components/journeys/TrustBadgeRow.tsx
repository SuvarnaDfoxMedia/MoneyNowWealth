import React from "react";
import { CheckCircle2 } from "lucide-react";

interface TrustBadgeRowProps {
  badges: string[];
}

export const TrustBadgeRow: React.FC<TrustBadgeRowProps> = ({ badges }) => {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-6">
      {badges.map((badge, index) => (
        <div key={index} className="flex items-center text-white/90">
          <CheckCircle2 className="mr-2 h-4 w-4 text-white" />
          <span className="text-[14px] font-medium tracking-wide">
            {badge}
          </span>
        </div>
      ))}
    </div>
  );
};
