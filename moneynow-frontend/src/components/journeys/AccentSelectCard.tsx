import React from "react";
import { LucideIcon } from "lucide-react";

interface AccentSelectCardProps {
  icon?: LucideIcon;
  title: string;
  subLabel?: string;
  selected: boolean;
  onClick?: () => void;
  variant?: "selectable" | "informational"; // informational = coral accent, no click state
}

const ACCENT = { selectable: "#0E4A89", informational: "#D85A30" };

export const AccentSelectCard: React.FC<AccentSelectCardProps> = ({
  icon: Icon,
  title,
  subLabel,
  selected,
  onClick,
  variant = "selectable",
}) => {
  const isInformational = variant === "informational";
  const active = isInformational || selected;
  const accentColor = ACCENT[variant];

  const Wrapper = isInformational ? "div" : "button";

  return (
    <Wrapper
      type={isInformational ? undefined : "button"}
      onClick={isInformational ? undefined : onClick}
      className={`text-left w-full rounded-lg p-4 transition-colors duration-150 border-l-[3px] ${
        active ? "bg-[#F5F9FD]" : "bg-[#FAFAFA]"
      } border border-gray-200 ${
        !isInformational
          ? "focus:outline-none focus:ring-2 focus:ring-[#0E4A89]/30 hover:border-primary/50 hover:bg-gray-50"
          : ""
      }`}
      style={{ borderLeftColor: active ? accentColor : "transparent" }}
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <Icon
            className="w-[18px] h-[18px] flex-shrink-0 mt-0.5"
            style={{ color: accentColor }}
          />
        )}
        <div>
          <div
            className="font-semibold text-[13px]"
            style={{ color: active ? accentColor : "#111" }}
          >
            {title}
          </div>
          {subLabel && (
            <div className="mt-1 text-[11.5px] text-[#5b7690] leading-tight">
              {subLabel}
            </div>
          )}
        </div>
      </div>
    </Wrapper>
  );
};
